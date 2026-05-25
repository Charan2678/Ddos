import os
import csv
import random

# Directory for datasets
os.makedirs("datasets", exist_ok=True)
dest_path = os.path.join("datasets", "sample_ddos_data.csv")

headers = [
    "flow_duration", "tot_fwd_pkts", "tot_bwd_pkts", 
    "fwd_pkt_len_mean", "bwd_pkt_len_mean", "flow_byts_s", 
    "flow_pkts_s", "syn_flag_cnt", "protocol", "label"
]

def generate_dataset(num_rows=10000):
    print(f"Generating {num_rows} network flow records...")
    
    with open(dest_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for _ in range(num_rows):
            # Select traffic class: 50% Benign, 12.5% each for SYN, UDP, ICMP, HTTP floods
            rand = random.random()
            
            if rand < 0.50:
                # BENIGN traffic
                label = "BENIGN"
                protocol = random.choice([6, 17, 1]) # TCP, UDP, ICMP
                duration = random.uniform(100, 50000) # microseconds
                tot_fwd = random.randint(2, 15)
                tot_bwd = random.randint(1, 15)
                fwd_len = random.uniform(20.0, 150.0)
                bwd_len = random.uniform(20.0, 150.0)
                syn_flag = 0
                
            elif rand < 0.625:
                # SYN Flood attack (TCP, High packet rates, SYN flag ON)
                label = "SYN Flood"
                protocol = 6 # TCP only
                duration = random.uniform(5, 500) # Quick bursts
                tot_fwd = random.randint(50, 400)
                tot_bwd = 0
                fwd_len = 64.0 # Constant packet size
                bwd_len = 0.0
                syn_flag = 1
                
            elif rand < 0.75:
                # UDP Flood attack (UDP, High packet rates, no flags)
                label = "UDP Flood"
                protocol = 17 # UDP only
                duration = random.uniform(5, 500)
                tot_fwd = random.randint(60, 500)
                tot_bwd = 0
                fwd_len = random.uniform(100, 1200) # Large payloads
                bwd_len = 0.0
                syn_flag = 0
                
            elif rand < 0.875:
                # ICMP Flood attack (Ping flood)
                label = "ICMP Flood"
                protocol = 1 # ICMP only
                duration = random.uniform(10, 800)
                tot_fwd = random.randint(30, 200)
                tot_bwd = random.randint(0, 10)
                fwd_len = 84.0 # Typical echo request payload
                bwd_len = 84.0
                syn_flag = 0
                
            else:
                # HTTP Flood (TCP port 80, high traffic requests, zero SYN)
                label = "HTTP Flood"
                protocol = 6 # TCP
                duration = random.uniform(2000, 15000) # Longer transaction durations
                tot_fwd = random.randint(20, 150)
                tot_bwd = random.randint(15, 120)
                fwd_len = random.uniform(300, 1500) # Rich GET request sizes
                bwd_len = random.uniform(500, 4000)
                syn_flag = 0
                
            # Derived fields
            flow_pkts_s = (tot_fwd + tot_bwd) / (duration / 1000000.0)
            flow_byts_s = ((tot_fwd * fwd_len) + (tot_bwd * bwd_len)) / (duration / 1000000.0)
            
            row = [
                round(duration, 2),
                tot_fwd,
                tot_bwd,
                round(fwd_len, 2),
                round(bwd_len, 2),
                round(flow_byts_s, 2),
                round(flow_pkts_s, 2),
                syn_flag,
                protocol,
                label
            ]
            
            writer.writerow(row)
            
    print(f"Sample dataset file generated successfully: {dest_path}")

if __name__ == "__main__":
    generate_dataset()
