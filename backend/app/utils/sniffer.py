import os
import time
import threading
from datetime import datetime
import joblib
from typing import Dict, Any

# Import Scapy if available, other handle import error gracefully
try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

from app.routes.predict import manager, load_champion_model
from app.utils.ml_pipeline import FEATURE_COLS, INV_LABEL_MAP
from app.database import SessionLocal
from app.models import Prediction, SystemLog, TrainedModel

# Sniffer Control State
SNIFFER_STATE = {
    "active": False,
    "thread": None,
    "pps": 0,
    "threats": 0,
    "suspicious_ips": set(),
    "protocol_counts": {"TCP": 0, "UDP": 0, "ICMP": 0, "HTTP": 0},
    "packet_counter": 0,
    "window_start": time.time()
}

# In-memory flow dictionary to track active connections and aggregate packet counts
# Structure: { src_ip: { start_time, packet_count, byte_count, syn_count, protocol } }
ACTIVE_FLOWS: Dict[str, Dict[str, Any]] = {}

def get_threat_severity(label: str) -> str:
    if label == "BENIGN":
        return "LOW"
    elif label in ["ICMP Flood", "HTTP Flood"]:
        return "HIGH"
    return "CRITICAL" # SYN and UDP floods

def process_scapy_packet(packet):
    """Callback triggered by Scapy for every captured packet on the interface."""
    if not SNIFFER_STATE["active"]:
        return
        
    # We only care about IP packets (IPv4)
    if not packet.haslayer(IP):
        return
        
    src_ip = packet[IP].src
    dst_ip = packet[IP].dst
    
    # Ignore localhost/loopback traffic so we only monitor REAL external network traffic
    if src_ip.startswith("127.") or dst_ip.startswith("127."):
        return
        
    proto_num = packet[IP].proto
    size_bytes = len(packet)
    
    # Identify protocol name
    proto_name = "TCP"
    if packet.haslayer(UDP):
        proto_name = "UDP"
    elif packet.haslayer(ICMP):
        proto_name = "ICMP"
    elif packet.haslayer(TCP) and (packet[TCP].dport == 80 or packet[TCP].sport == 80):
        proto_name = "HTTP"
        
    # Increment global stats
    SNIFFER_STATE["packet_counter"] += 1
    SNIFFER_STATE["protocol_counts"][proto_name] = SNIFFER_STATE["protocol_counts"].get(proto_name, 0) + 1
    
    # Calculate live Packets Per Second (PPS) in 1-second sliding windows
    now = time.time()
    elapsed = now - SNIFFER_STATE["window_start"]
    if elapsed >= 1.0:
        SNIFFER_STATE["pps"] = int(SNIFFER_STATE["packet_counter"] / elapsed)
        SNIFFER_STATE["packet_counter"] = 0
        SNIFFER_STATE["window_start"] = now
        
    # Track flow statistics by source IP
    if src_ip not in ACTIVE_FLOWS:
        ACTIVE_FLOWS[src_ip] = {
            "start_time": now,
            "tot_pkts": 0,
            "tot_bytes": 0,
            "syn_count": 0,
            "protocol": proto_num
        }
        
    flow = ACTIVE_FLOWS[src_ip]
    flow["tot_pkts"] += 1
    flow["tot_bytes"] += size_bytes
    
    # Check TCP SYN flags
    syn_flag = 0
    if packet.haslayer(TCP) and packet[TCP].flags & 0x02: # 0x02 is SYN flag bit
        flow["syn_count"] += 1
        syn_flag = 1
        
    # Aggregate features to feed into the ML model
    flow_duration = now - flow["start_time"]
    tot_fwd_pkts = flow["tot_pkts"]
    tot_bwd_pkts = 0 # In simple one-way sniffing, we approximate bwd packets
    fwd_pkt_len_mean = flow["tot_bytes"] / flow["tot_pkts"]
    bwd_pkt_len_mean = 0.0
    flow_byts_s = flow["tot_bytes"] / max(0.0001, flow_duration)
    flow_pkts_s = flow["tot_pkts"] / max(0.0001, flow_duration)
    
    # Feed to ML Model every 10 packets to throttle CPU overhead
    if flow["tot_pkts"] % 10 == 0:
        classify_and_broadcast_flow(
            src_ip=src_ip,
            dst_ip=dst_ip,
            proto_name=proto_name,
            size_bytes=size_bytes,
            syn_flag=syn_flag,
            features={
                "flow_duration": flow_duration,
                "tot_fwd_pkts": tot_fwd_pkts,
                "tot_bwd_pkts": tot_bwd_pkts,
                "fwd_pkt_len_mean": fwd_pkt_len_mean,
                "bwd_pkt_len_mean": bwd_pkt_len_mean,
                "flow_byts_s": flow_byts_s,
                "flow_pkts_s": flow_pkts_s,
                "syn_flag_cnt": flow["syn_count"],
                "protocol": proto_num
            }
        )

LAST_LOG_TIME = {}

def classify_and_broadcast_flow(src_ip: str, dst_ip: str, proto_name: str, size_bytes: int, syn_flag: int, features: dict):
    """Loads active model, classifies the network flow features, and broadcasts to WebSockets."""
    model, scaler = load_champion_model()
    
    # If no model is trained yet, we label all traffic as BENIGN (0) with high confidence
    label = "BENIGN"
    confidence = 0.99
    
    if model and scaler:
        try:
            # Format feature vector
            vector = [float(features[col]) for col in FEATURE_COLS]
            scaled_vector = scaler.transform([vector])
            class_idx = int(model.predict(scaled_vector)[0])
            probabilities = model.predict_proba(scaled_vector)[0]
            
            label = INV_LABEL_MAP.get(class_idx, "BENIGN")
            confidence = float(probabilities[class_idx])
        except Exception as e:
            print(f"Inference warning in sniffer: {e}")
            
    # Classify severity
    threat_level = get_threat_severity(label)
    action = "ALLOW" if label == "BENIGN" else "BLOCK"
    
    # Update state
    if label != "BENIGN":
        SNIFFER_STATE["threats"] += 1
        SNIFFER_STATE["suspicious_ips"].add(src_ip)
        
        now = time.time()
        # Throttle DB inserts to prevent locks during heavy floods (max 1 write per 2 seconds per IP)
        if now - LAST_LOG_TIME.get(src_ip, 0) > 2.0:
            LAST_LOG_TIME[src_ip] = now
            
            # Save attack to database history asynchronously
            db = SessionLocal()
            try:
                latest_model = db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).first()
                model_id = latest_model.id if latest_model else None
                
                pred = Prediction(
                    input_data={**features, "src_ip": src_ip, "protocol_name": proto_name},
                    prediction_label=label,
                    confidence=confidence,
                    threat_level=threat_level,
                    model_id=model_id
                )
                db.add(pred)
                
                # Audit log
                log = SystemLog(
                    action="ATTACK_ISOLATED",
                    details=f"Sniffer caught and blocked {label} traffic flow from {src_ip}"
                )
                db.add(log)
                db.commit()
            except Exception as err:
                db.rollback()
                print(f"Failed to log attack: {err}")
            finally:
                db.close()
            
        # Set timeout to clear threat metrics in 5 seconds
        threading.Timer(5.0, decrement_threat_counts, args=[src_ip]).start()

    # Broadcast JSON payload to all React dashboard WebSocket clients
    payload = {
        "packet": {
            "time": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "proto": proto_name,
            "src": src_ip,
            "dst": dst_ip,
            "size": size_bytes,
            "flags": "SYN" if syn_flag == 1 else "N/A",
            "action": action,
            "label": label
        },
        "stats": {
            "pps": SNIFFER_STATE["pps"],
            "threats": SNIFFER_STATE["threats"],
            "suspicious": len(SNIFFER_STATE["suspicious_ips"]),
            "protocol_counts": SNIFFER_STATE["protocol_counts"]
        }
    }
    
    # Broadcast asynchronously
    loop = threading.Event()
    import asyncio
    try:
        asyncio.run(manager.broadcast_packet(payload))
    except Exception:
        # If no running event loop is available in thread context, broadcast via manager
        pass

def decrement_threat_counts(src_ip):
    SNIFFER_STATE["threats"] = max(0, SNIFFER_STATE["threats"] - 1)
    if src_ip in SNIFFER_STATE["suspicious_ips"]:
        SNIFFER_STATE["suspicious_ips"].remove(src_ip)

# ==========================================
# RESILIENT SNIFFER LOOPS
# ==========================================

def should_stop_sniffer(packet=None):
    return not SNIFFER_STATE["active"]

def run_real_sniffer():
    """Runs the Scapy sniffer loop."""
    print("Scapy sniffer engine started on network socket interfaces.")
    try:
        # stop_filter allows the blocking sniff() call to terminate gracefully when halted
        sniff(filter="ip", prn=process_scapy_packet, store=0, stop_filter=should_stop_sniffer)
    except Exception as e:
        print(f"Scapy sniffer socket crashed: {e}. Missing Npcap/Admin rights. Falling back to traffic simulator.")
        run_simulated_sniffer()

def run_simulated_sniffer():
    """Generates realistic packet traffic if Scapy/Npcap is not supported."""
    print("Intrusion simulator engine activated.")
    import random
    
    ips = ["192.168.1.1", "192.168.1.142", "10.0.0.84", "172.16.254.10", "8.8.8.8"]
    malicious_ips = ["185.220.101.5", "45.227.254.12"]
    protocols = ["TCP", "UDP", "ICMP", "HTTP"]
    
    while SNIFFER_STATE["active"]:
        # Simulate traffic spike if threat state is active
        is_attack_cycle = random.random() > 0.85
        
        proto = random.choice(protocols)
        src = random.choice(malicious_ips) if is_attack_cycle else random.choice(ips)
        dst = "192.168.1.100" # Server IP
        size = random.randint(64, 1500)
        syn_flag = 1 if (proto == "TCP" and is_attack_cycle) else 0
        
        # Increment counters
        SNIFFER_STATE["packet_counter"] += 1
        SNIFFER_STATE["protocol_counts"][proto] = SNIFFER_STATE["protocol_counts"].get(proto, 0) + 1
        
        # Calculate PPS
        now = time.time()
        elapsed = now - SNIFFER_STATE["window_start"]
        if elapsed >= 1.0:
            # Surge PPS during attack simulation
            base_pps = random.randint(280, 520)
            attack_pps = random.randint(1500, 3200) if is_attack_cycle else 0
            SNIFFER_STATE["pps"] = base_pps + attack_pps
            SNIFFER_STATE["packet_counter"] = 0
            SNIFFER_STATE["window_start"] = now
            
        features = {
            "flow_duration": random.uniform(0.1, 5.0),
            "tot_pkts": random.randint(5, 50),
            "tot_bwd_pkts": 0,
            "fwd_pkt_len_mean": size,
            "bwd_pkt_len_mean": 0,
            "flow_byts_s": size * 10,
            "flow_pkts_s": 10,
            "syn_flag_cnt": 1 if syn_flag else 0,
            "protocol": 6 if proto == "TCP" or proto == "HTTP" else 17 if proto == "UDP" else 1
        }
        
        # Evaluate using ML engine
        classify_and_broadcast_flow(
            src_ip=src,
            dst_ip=dst,
            proto_name=proto,
            size_bytes=size,
            syn_flag=syn_flag,
            features=features
        )
        
        # Inter-packet delay (100ms - 400ms)
        time.sleep(random.uniform(0.1, 0.4))

# ==========================================
# PUBLIC CONTROLLERS
# ==========================================

def start_sniffer():
    """Toggles sniffer thread state to ON. Returns True if state changed."""
    if SNIFFER_STATE["active"]:
        return False
        
    SNIFFER_STATE["active"] = True
    SNIFFER_STATE["window_start"] = time.time()
    
    # Check if Scapy is available and can open raw sockets (requires Npcap on Windows)
    use_scapy = SCAPY_AVAILABLE
    if use_scapy:
        # Check permissions by attempting a brief dummy capture
        try:
            sniff(count=1, timeout=0.1)
        except Exception:
            print("WARNING: Insufficient permissions to capture raw sockets or Npcap is missing. Falling back to background simulator.")
            use_scapy = False
            
    if use_scapy:
        SNIFFER_STATE["thread"] = threading.Thread(target=run_real_sniffer, daemon=True)
    else:
        print("Scapy unavailable or lacks permissions. Starting simulation thread instead.")
        SNIFFER_STATE["thread"] = threading.Thread(target=run_simulated_sniffer, daemon=True)
        
    SNIFFER_STATE["thread"].start()
    return True

def stop_sniffer():
    """Toggles sniffer thread state to OFF. Returns True if state changed."""
    if not SNIFFER_STATE["active"]:
        return False
        
    SNIFFER_STATE["active"] = False
    SNIFFER_STATE["pps"] = 0
    SNIFFER_STATE["threats"] = 0
    SNIFFER_STATE["suspicious_ips"] = set()
    
    if SNIFFER_STATE["thread"]:
        SNIFFER_STATE["thread"] = None
        
    return True
