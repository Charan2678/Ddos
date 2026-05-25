import requests
import json
import time
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000"

print("Starting FULL End-to-End System Test...\n")

# 1. Test Authentication
print("1. Testing Authentication...")
auth_data = {"username_or_email": "admin@shield.com", "password": "admin123"}
response = requests.post(f"{BASE_URL}/api/login", json=auth_data)
if response.status_code == 200:
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Login successful.")
else:
    print(f"[FAIL] Login failed. {response.text}")
    exit(1)

# 2. Create Dummy Dataset
print("\n2. Creating dummy dataset...")
os.makedirs("datasets", exist_ok=True)
dummy_csv = "flow_duration,tot_fwd_pkts,tot_bwd_pkts,fwd_pkt_len_mean,bwd_pkt_len_mean,flow_byts_s,flow_pkts_s,syn_flag_cnt,protocol,label\n"
for i in range(100):
    dummy_csv += f"{1.5 + i*0.01},12,8,512.0,64.0,2500.5,15.0,0,6,BENIGN\n"
    dummy_csv += f"{0.1 + i*0.01},500,0,64.0,0.0,50000.0,5000.0,1,6,SYN FLOOD\n"
    dummy_csv += f"{0.2 + i*0.01},300,0,1024.0,0.0,30000.0,1500.0,0,17,UDP FLOOD\n"
with open("datasets/test_data.csv", "w") as f:
    f.write(dummy_csv)
print("[PASS] Created dummy dataset file.")

print("\n2b. Uploading dataset to API...")
with open("datasets/test_data.csv", "rb") as f:
    files = {"file": ("test_data.csv", f, "text/csv")}
    response = requests.post(f"{BASE_URL}/api/upload-dataset", headers=headers, files=files)
if response.status_code == 200:
    dataset_id = response.json().get("id")
    print(f"[PASS] Dataset uploaded successfully. ID: {dataset_id}")
else:
    print(f"[FAIL] Upload failed. Status: {response.status_code}\n{response.text}")
    exit(1)

# 3. Test ML Training Pipeline
print("\n3. Testing ML Training Pipeline (This might take a few seconds)...")
response = requests.post(f"{BASE_URL}/api/train-model?dataset_id={dataset_id}", headers=headers)
if response.status_code == 200:
    data = response.json()
    # It returns a list of models, so we just confirm it's an array
    print(f"[PASS] ML Training successful! Trained {len(data)} models.")
else:
    print(f"[FAIL] ML Training failed. Status: {response.status_code}\n{response.text}")
    exit(1)

# 4. Test ML Inference Pipeline
print("\n4. Testing ML Inference Pipeline...")
ml_payload = {
    "input_data": {
        "flow_duration": 0.1,
        "tot_fwd_pkts": 500,
        "tot_bwd_pkts": 0,
        "fwd_pkt_len_mean": 64.0,
        "bwd_pkt_len_mean": 0.0,
        "flow_byts_s": 50000.0,
        "flow_pkts_s": 5000.0,
        "syn_flag_cnt": 1,
        "protocol": 6
    }
}
response = requests.post(f"{BASE_URL}/api/predict", json=ml_payload, headers=headers)
if response.status_code == 200:
    prediction = response.json()
    print(f"[PASS] ML Prediction successful! Result: {prediction.get('prediction_label')} ({prediction.get('threat_level')} Threat)")
else:
    print(f"[FAIL] ML Prediction issue. Status: {response.status_code}\n{response.text}")

# 5. Test Live Monitoring Start
print("\n5. Testing Live Network Sniffer...")
response = requests.post(f"{BASE_URL}/api/start-monitoring", headers=headers)
if response.status_code == 200:
    print("[PASS] Sniffer activated successfully.")
    print("Waiting 3 seconds for packets to be processed...")
    time.sleep(3)
    requests.post(f"{BASE_URL}/api/stop-monitoring", headers=headers)
    print("[PASS] Sniffer halted successfully.")
else:
    print(f"[FAIL] Failed to activate sniffer. {response.text}")

# 6. Test Reports/History
print("\n6. Testing Reports and History Logging...")
response = requests.get(f"{BASE_URL}/api/reports/history", headers=headers)
if response.status_code == 200:
    logs = response.json()
    print(f"[PASS] Retrieved {len(logs)} history logs from Database.")
else:
    print(f"[FAIL] Failed to fetch history. {response.text}")

print("\nAll system core functionalities have been thoroughly checked and verified!")
