import os
import time
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Import algorithms
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier

# Constants
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# Map labels to integer class numbers
LABEL_MAP = {
    "benign": 0,
    "syn flood": 1,
    "udp flood": 2,
    "icmp flood": 3,
    "http flood": 4
}
INV_LABEL_MAP = {v: k.upper() for k, v in LABEL_MAP.items()}

# Expected features list
FEATURE_COLS = [
    "flow_duration", "tot_fwd_pkts", "tot_bwd_pkts", 
    "fwd_pkt_len_mean", "bwd_pkt_len_mean", "flow_byts_s", 
    "flow_pkts_s", "syn_flag_cnt", "protocol"
]

def preprocess_and_split(file_path: str, test_size: float = 0.2):
    """Loads CSV, cleans data, fits a scaler, maps target labels, and splits train/test."""
    df = pd.read_csv(file_path)
    
    # Normalize column names to lowercase and strip whitespaces
    df.columns = [c.lower().strip() for c in df.columns]
    
    # Drop duplicates to prevent data leakage between train/test splits
    df = df.drop_duplicates()
    
    # Fill any null values with the median of the columns
    for col in FEATURE_COLS:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
            
    # Extract features (X) and labels (y)
    X = df[FEATURE_COLS]
    
    # Convert labels to lowercase strings and strip
    df["label"] = df["label"].astype(str).str.lower().str.strip()
    
    # Map labels to integer classes, fall back to BENIGN (0) for unrecognized classes
    y = df["label"].map(lambda x: LABEL_MAP.get(x, 0)).values
    
    # Fit StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save the fitted scaler! Essential for live predictions scaling.
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    
    return train_test_split(X_scaled, y, test_size=test_size, random_state=42)

def train_and_evaluate_all(X_train, X_test, y_train, y_test):
    """
    Trains the 6 classifiers, records benchmarks, and persists the best performing model.
    """
    # Downsample training set specifically for heavy algorithms (SVM/KNN) to avoid OOM crashes
    # on low-tier development computers or Render servers.
    MAX_HEAVY_SAMPLES = 5000
    if len(X_train) > MAX_HEAVY_SAMPLES:
        indices = np.random.choice(len(X_train), MAX_HEAVY_SAMPLES, replace=False)
        X_train_heavy = X_train[indices]
        y_train_heavy = y_train[indices]
    else:
        X_train_heavy = X_train
        y_train_heavy = y_train

    # Define models dictionary
    models = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000, random_state=42),
            "heavy": False
        },
        "Decision Tree": {
            "model": DecisionTreeClassifier(random_state=42),
            "heavy": False
        },
        "Random Forest": {
            "model": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
            "heavy": False
        },
        "XGBoost": {
            "model": XGBClassifier(n_estimators=100, random_state=42, n_jobs=-1, eval_metric="mlogloss"),
            "heavy": False
        },
        "KNN": {
            "model": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
            "heavy": True
        },
        "SVM": {
            "model": SVC(probability=True, random_state=42),
            "heavy": True
        }
    }

    benchmarks = []
    best_f1 = -1.0
    best_model_name = None
    best_model_obj = None

    for name, config in models.items():
        clf = config["model"]
        is_heavy = config["heavy"]
        
        # Select appropriate training split
        x_tr = X_train_heavy if is_heavy else X_train
        y_tr = y_train_heavy if is_heavy else y_train
        
        # Train and record time
        start_time = time.time()
        clf.fit(x_tr, y_tr)
        train_time = time.time() - start_time
        
        # Test predictions
        y_pred = clf.predict(X_test)
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        # Use average='weighted' to handle multi-class labels properly
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        
        benchmarks.append({
            "name": name,
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "training_time": float(train_time)
        })
        
        # Check if this model is the new Champion
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = clf

    # Save the Champion Model to disk
    if best_model_obj:
        model_path = os.path.join(MODELS_DIR, "best_model.joblib")
        joblib.dump(best_model_obj, model_path)
        
        # Also save a text file tracking which algorithm is the current champion
        with open(os.path.join(MODELS_DIR, "champion_info.txt"), "w") as f:
            f.write(best_model_name)

    return benchmarks, best_model_name
