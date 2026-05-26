# 🛡️ DDoS Shield — Real-Time Network Defence System

A full-stack cybersecurity application that captures live network packets, classifies attack vectors using trained Machine Learning models, and surfaces threats in real time through an interactive dashboard.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure **JWT-based authentication** (login / register)
- **Role-based access control** — Operators see only their own data; Admins have full visibility
- Passwords hashed with **bcrypt**
- **Secure Password Reset** via automated SMTP email delivery with expiring JWT tokens

### 📡 Live Network Monitoring
- Real-time **packet capture** using Scapy across all network interfaces
- **WebSocket live feed** delivering sub-second packet telemetry to the dashboard
- Live traffic graph with instant spike detection

### 🤖 ML-Powered Threat Detection
- **XGBoost**, **Random Forest**, **SVM**, **KNN**, and **Logistic Regression** models trained on labelled attack datasets
- Detects **5+ attack classes**: SYN Flood, UDP Flood, ICMP Flood, HTTP Flood, and Benign traffic
- Displays **confidence scores**, threat severity ratings, and exact **Detection Engine (Champion Model)** for every prediction
- Model accuracy: **99.8%** | Detection latency: **< 1 second**

### 📊 Dashboard & Analytics
- At-a-glance stats: Packets Captured, Threats Detected, Model Accuracy
- Historical threat charts and traffic visualisation
- Real-time threat feed with classification results

### 📁 Batch Prediction & PDF Reporting
- **Batch CSV Analysis**: Upload a network capture CSV file to instantly evaluate thousands of flows through the Champion ML model.
- **Threat Isolation**: Automatically isolates and flags malicious Source IPs, classifying them by attack type (SYN Flood, UDP Flood, etc.).
- **Client-Side Report Generation**: Instantly download professional, multi-page **PDF Reports** or **CSV logs** directly from your browser containing threat breakdowns, AI confidence scores, and origin IPs without hitting the backend.

### 📝 Scan History
- Full log of all past scans and detections
- Filter and search through historical threat records

### 📄 Audit Reports
- Generate **PDF and CSV** security reports scoped to a session or time range
- One-click download from the Reports page

### 🧠 ML Training Panel
- Trigger model **retraining** from the UI
- View training metrics: accuracy, precision, recall, F1 score
- Compare performance across multiple ML algorithms

### 👤 Admin Panel
- Manage all registered users
- View system-wide scans and threat logs
- Admin-only controls for model management

---

## 🧠 How the AI Model Works (Beginner's Guide)

To understand how the Machine Learning model detects DDoS attacks, imagine two computers talking to each other over the internet is just like two people having a conversation over the phone.

### Network Header Terminology
* **Protocol:** The "language" or "rules" used to speak. (e.g., TCP is like a reliable registered letter; UDP is like shouting through a megaphone).
* **Flow Duration:** How long the entire interaction lasted, measured in microseconds.
* **SYN Flag Count:** The digital equivalent of saying "Hello?" to start a phone call. A "SYN Flood" attack is when a hacker says "Hello?" millions of times but never starts the conversation, freezing the server.
* **Total Fwd Packets (Forward):** The total number of sentences YOU sent to the server.
* **Total Bwd Packets (Backward):** The total number of sentences the SERVER sent back to you.
* **Fwd Packets / sec:** How fast you are talking (e.g., A normal user sends 5 packets/sec; a DDoS bot sends 50,000 packets/sec).
* **Flow Bytes / sec:** The speed/weight of the data transfer, similar to water flowing through a pipe.
* **Fwd Packet Len Mean:** The *average size* of the messages you are sending.
* **Bwd Packet Len Mean:** The *average size* of the messages the server replies with.

### The Random Forest Decision Engine
The AI (like our Champion **Random Forest** model) evaluates all these numbers simultaneously. For example, if it sees a Flow Duration of just `0.2` microseconds, `0` Backward Packets, and a Forward Packets/sec rate of `28,000`, the AI instantly recognizes: *"A normal human doesn't talk this fast and hang up immediately without receiving a reply. This is a UDP Flood Attack!"* By learning these patterns across thousands of data points, the AI can detect anomalous attacks with 99.8% accuracy.

---

## 🗂️ Project Structure

```
DDoS/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── security.py       # JWT & auth logic
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── routes/           # API route handlers
│   │   └── utils/            # ML utilities & helpers
│   ├── models/               # Trained ML model files
│   ├── datasets/             # Training datasets
│   ├── reports/              # Generated PDF/CSV reports
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React + Vite frontend
│   └── src/
│       └── pages/
│           ├── LandingPage.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── LiveMonitoring.jsx
│           ├── Prediction.jsx
│           ├── History.jsx
│           ├── Reports.jsx
│           ├── MLTraining.jsx
│           ├── ForgotPassword.jsx
│           ├── ResetPassword.jsx
│           └── AdminPanel.jsx
│
└── attack_test.py            # Script to simulate attack traffic
```

---

## 🚀 How to Run

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Git**

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/ddos-shield.git
cd ddos-shield
```

---

### Step 2 — Set Up the Backend

```bash
# Create and activate virtual environment
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt
```

---

### Step 3 — Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
SECRET_KEY=your_secret_key_here
# PostgreSQL Configuration (Recommended for Production)
DATABASE_URL=postgresql://postgres:00000000@localhost:5432/ddos_shield
ACCESS_TOKEN_EXPIRE_MINUTES=60
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

**Database Configuration Note:**
The application uses **PostgreSQL** by default if the `DATABASE_URL` is provided. If you do not have PostgreSQL installed, you can simply remove or comment out the `DATABASE_URL` line from your `.env` file. The backend will intelligently fall back to using a local **SQLite** database (`ddos_system.db`) which requires zero setup!

---

### Step 4 — Initialise the Database

```bash
cd backend
python init_db.py
```

---

### Step 5 — Start the Backend Server

```bash
# From the backend/ directory
uvicorn app.main:app --reload
```

> Backend runs at: `http://localhost:8000`  
> API docs available at: `http://localhost:8000/docs`

---

### Step 6 — Set Up and Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs at: `http://localhost:5173`

---

### Step 7 — Open the App

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

- Click **Get Started** to register a new account
- Log in and navigate to the **Dashboard**
- Use **Live Monitoring** to start capturing packets
- Upload a CSV on the **Prediction** page to run ML inference
- Generate a report from the **Reports** page

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Uvicorn, SQLAlchemy |
| Database | PostgreSQL |
| ML Models | XGBoost, Random Forest, scikit-learn |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Reports | ReportLab (PDF), Pandas (CSV) |
| Packet Capture | Scapy |
| Real-time | WebSockets |

---

## 👨‍💻 Author

Built by **Charan Neerukonda and R Ravi**
