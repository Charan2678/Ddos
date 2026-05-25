import socket
import time
import random
import threading

# The target is your own machine's network interface
TARGET_IP = socket.gethostbyname(socket.gethostname())
TARGET_PORT = 80

def udp_flood():
    print(f"Launching simulated UDP Flood against {TARGET_IP}...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    bytes_to_send = random._urandom(1024) # 1KB payload
    
    # Send 5000 packets rapidly to trigger the ML detection
    for _ in range(5000):
        try:
            sock.sendto(bytes_to_send, (TARGET_IP, TARGET_PORT))
        except:
            pass
            
    print("UDP Flood simulation complete!")

if __name__ == "__main__":
    if TARGET_IP.startswith("127."):
        print("Error: Could not resolve your LAN IP. Ensure you are connected to Wi-Fi.")
    else:
        print(f"Your LAN IP is: {TARGET_IP}")
        print("Firing packets in 3 seconds... Make sure your sniffer is ON!")
        time.sleep(3)
        
        # Launch 5 concurrent threads of UDP spam
        threads = []
        for i in range(5):
            t = threading.Thread(target=udp_flood)
            t.start()
            threads.append(t)
            
        for t in threads:
            t.join()
            
        print("\nAttack finished. Check your DDoS Shield History!")
