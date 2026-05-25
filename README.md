# 🛡️ DDoS Shield — Real-Time Network Defence System

A full-stack cybersecurity application that captures live network packets, classifies attack vectors using trained Machine Learning models, and surfaces threats in real time through an interactive dashboard.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure **JWT-based authentication** (login / register)
- **Role-based access control** — Operators see only their own data; Admins have full visibility
- Passwords hashed with **bcrypt**

### 📡 Live Network Monitoring
- Real-time **packet capture** using Scapy across all network interfaces
- **WebSocket live feed** delivering sub-second packet telemetry to the dashboard
- Live traffic graph with instant spike detection

### 🤖 ML-Powered Threat Detection
- **XGBoost** and **Random Forest** models trained on labelled attack datasets
- Detects **5+ attack classes**: SYN Flood, UDP Flood, ICMP Flood, HTTP Flood, and Benign traffic
- Displays **confidence scores** and threat severity ratings for every prediction
- Model accuracy: **99.8%** | Detection latency: **< 1 second**

### 📊 Dashboard & Analytics
- At-a-glance stats: Packets Captured, Threats Detected, Model Accuracy
- Historical threat charts and traffic visualisation
- Real-time threat feed with classification results

### 📁 Prediction & Upload
- Upload a **CSV dataset** for batch ML prediction
- View per-row classification results with confidence scores
- Supports custom network capture files

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
DATABASE_URL=sqlite:///./ddos_system.db
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

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
| Database | SQLite (default) |
| ML Models | XGBoost, Random Forest, scikit-learn |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Reports | ReportLab (PDF), Pandas (CSV) |
| Packet Capture | Scapy |
| Real-time | WebSockets |

---

## 👨‍💻 Author

Built by **Charan Neerukonda**
