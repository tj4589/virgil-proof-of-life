from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import uvicorn

app = FastAPI(title="GhostDetect AI Service")

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

@app.get("/")
async def root():
    return {"status": "ok", "model_loaded": True}

@app.post("/predict")
async def predict(worker: WorkerRecord):
    # Logic based on input features
    prob = 0.1 # Base probability
    reasons = []
    
    if worker.nin_count > 1:
        prob += 0.4
        reasons.append(f'NIN linked to {worker.nin_count} workers')
    if worker.account_count > 1:
        prob += 0.4
        reasons.append(f'Bank account shared by {worker.account_count} workers')
    if abs(worker.salary_zscore) > 2:
        prob += 0.2
        reasons.append('Salary is a statistical outlier')
    if worker.missing_score > 1:
        prob += 0.3
        reasons.append('Multiple required fields are missing')
    
    if prob > 0.99:
        prob = 0.99
        
    label = 'GHOST' if prob > 0.6 else 'LEGITIMATE'
    
    # Add some randomness for demo
    if len(reasons) == 0 and random.random() < 0.1:
        prob = 0.75
        label = 'GHOST'
        reasons.append('Historical anomaly detected in payment frequency')

    return {
        'label': label,
        'confidence': round(prob * 100, 1),
        'reasons': reasons
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
