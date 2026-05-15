from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest
import random
import uvicorn

app = FastAPI(title="GhostDetect ML Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkerRecord(BaseModel):
    nin_count: int = 1
    account_count: int = 1
    salary_zscore: float = 0.0
    missing_score: int = 0

# --- ML Model Initialization ---
# We use an Unsupervised Isolation Forest to detect multivariate anomalies
# that simple rule-based heuristics might miss (e.g. slight Z-score + 2 shared accounts).
model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)

# Generate baseline training data (synthetic representation of "normal" workers vs "ghost" workers)
X_train = []
for _ in range(5000):
    # Normal worker
    X_train.append([1, 1, np.random.normal(0, 0.5), 0])
for _ in range(500):
    # Ghost worker anomalies
    X_train.append([
        random.choice([1, 2, 3]), 
        random.choice([1, 2, 4]), 
        np.random.normal(2.5, 1.0), 
        random.choice([0, 1, 2])
    ])

# Pre-train the model in memory
print("Training IsolationForest model on 5,500 baseline records...")
model.fit(X_train)
print("Model trained and ready.")

@app.get("/")
async def root():
    return {"status": "ok", "model_type": "IsolationForest", "trained_samples": len(X_train)}

@app.post("/predict")
async def predict(worker: WorkerRecord):
    # Construct feature vector
    features = np.array([[
        worker.nin_count, 
        worker.account_count, 
        worker.salary_zscore, 
        worker.missing_score
    ]])
    
    # Predict anomaly (-1 is anomaly, 1 is normal)
    prediction = model.predict(features)[0]
    
    # Calculate an anomaly score (lower is more abnormal, so we invert it for a confidence percentage)
    raw_score = model.decision_function(features)[0]
    
    # Convert raw score (-0.5 to 0.5 usually) into a 0-100% confidence scale of being a ghost worker
    # Negative raw_score means highly likely anomaly (ghost)
    base_confidence = 50 - (raw_score * 100)
    prob = max(0.0, min(100.0, base_confidence))
    
    reasons = []
    
    # Enhance explainability using SHAP-like heuristic breakdowns
    if worker.nin_count > 1:
        reasons.append(f'NIN duplicated across {worker.nin_count} profiles (High Risk)')
        prob += 15
    if worker.account_count > 1:
        reasons.append(f'Bank account shared by {worker.account_count} profiles (Critical Risk)')
        prob += 20
    if abs(worker.salary_zscore) > 2.0:
        reasons.append(f'Salary deviates heavily from workforce mean (Z-Score: {round(worker.salary_zscore, 2)})')
        prob += 10
    if worker.missing_score > 0:
        reasons.append(f'Profile is missing {worker.missing_score} mandatory HR fields')
        prob += 5
        
    prob = min(99.9, prob)
    
    # If the IsolationForest explicitly flagged it as -1, ensure it's categorized as a GHOST
    if prediction == -1 and prob < 60:
        prob = 65.0
        reasons.append('Isolation Forest ML algorithm detected complex multivariate anomaly')

    label = 'GHOST' if prob >= 60 else 'VERIFIED'
    
    return {
        'label': label,
        'confidence': round(prob, 1),
        'reasons': reasons
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
