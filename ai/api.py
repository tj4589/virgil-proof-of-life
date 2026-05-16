from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.ensemble import IsolationForest
import random
import uvicorn

app = FastAPI(title="GhostDetect ML Service")

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
    attendance_score: float = 90.0       # 0-100; < 20 = strong ghost signal
    days_since_verification: float = 14.0 # 0-999; > 90 = suspicious


# ---------------------------------------------------------------------------
# 6-feature IsolationForest
# Features: [nin_count, account_count, salary_zscore, missing_score,
#            attendance_score, days_since_verification]
# ---------------------------------------------------------------------------
rng = np.random.default_rng(42)
model = IsolationForest(n_estimators=150, contamination=0.12, random_state=42)

X_train: List[List[float]] = []

# Normal workers — tight clusters around expected values
for _ in range(5000):
    X_train.append([
        1,
        1,
        float(rng.normal(0, 0.4)),
        0,
        float(np.clip(rng.normal(90, 8), 60, 100)),
        float(np.clip(rng.normal(14, 7), 1, 60)),
    ])

# Ghost / anomalous workers — four distinct fraud archetypes
for _ in range(700):
    pattern = random.choice(["duplicate_account", "inactive_ghost", "salary_fraud", "mixed"])

    if pattern == "duplicate_account":
        X_train.append([
            float(random.choice([1, 2])),
            float(random.randint(2, 5)),
            float(rng.normal(0.4, 0.5)),
            float(random.choice([0, 1])),
            float(np.clip(rng.normal(35, 20), 0, 100)),
            float(np.clip(rng.normal(100, 50), 0, 999)),
        ])
    elif pattern == "inactive_ghost":
        X_train.append([
            1,
            1,
            float(rng.normal(0, 0.4)),
            float(random.choice([1, 2])),
            float(np.clip(rng.normal(5, 5), 0, 20)),
            float(np.clip(rng.normal(250, 60), 90, 999)),
        ])
    elif pattern == "salary_fraud":
        X_train.append([
            float(random.choice([1, 2])),
            1,
            float(rng.normal(3.2, 1.0)),
            0,
            float(np.clip(rng.normal(75, 15), 40, 100)),
            float(np.clip(rng.normal(25, 15), 1, 90)),
        ])
    else:  # mixed — subtle combination the rules alone might miss
        X_train.append([
            float(random.choice([1, 2, 3])),
            float(random.choice([1, 2, 3])),
            float(rng.normal(1.8, 0.8)),
            float(random.choice([0, 1, 2])),
            float(np.clip(rng.normal(22, 12), 0, 60)),
            float(np.clip(rng.normal(180, 60), 60, 999)),
        ])

print(f"Training IsolationForest on {len(X_train)} samples across 4 ghost archetypes...")
model.fit(X_train)
print("Model ready — 6-feature anomaly detection active.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _iso_catch_probability(features: np.ndarray) -> float:
    """Return 0-100 probability estimate from IsolationForest decision score.
    Negative decision_function values → more anomalous."""
    raw = model.decision_function(features)[0]
    # Typical range: -0.5 (anomaly) to +0.3 (normal). Map to 0-100 ghost probability.
    prob = max(0.0, min(100.0, 50.0 - raw * 120.0))
    return prob


def _risk_payload(risk_score: float, iso_prob: float, reasons: list) -> dict:
    final_score = min(99.9, risk_score)
    # Lowered threshold from 50 to 35 to be more proactive for demo purposes
    status = "FLAGGED" if final_score >= 35 else "VERIFIED"
    risk_level = "HIGH" if final_score >= 70 else "MEDIUM" if final_score >= 35 else "LOW"
    return {
        "label": "GHOST" if status == "FLAGGED" else "VERIFIED",
        "status": status,
        "risk_level": risk_level,
        "confidence": round(final_score, 1),
        "risk_score": round(final_score, 1),
        "trust_score": round(max(0.0, 100.0 - final_score), 1),
        "anomaly_score": float(round(iso_prob, 1)),
        "isolation_score": float(round(iso_prob, 1)),
        "reasons": reasons,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "ok",
        "model": "IsolationForest",
        "features": 6,
        "training_samples": len(X_train),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "model_ready": True}


@app.post("/predict")
def predict(worker: WorkerRecord):
    features = np.array([[
        worker.nin_count,
        worker.account_count,
        worker.salary_zscore,
        worker.missing_score,
        worker.attendance_score,
        worker.days_since_verification,
    ]])

    iso_prediction = model.predict(features)[0]   # -1 anomaly, 1 normal
    iso_prob = _iso_catch_probability(features)

    # ------------------------------------------------------------------
    # Rule-based scoring — each rule maps to an explicit ghost signal.
    # Contributions are the ground-truth % we report; IsolationForest
    # acts as a catch-all for subtle multi-feature patterns the rules miss.
    # ------------------------------------------------------------------
    rules_score = 0.0
    reasons = []

    # 1. Shared NIN
    if worker.nin_count > 1:
        contrib = min(18, 10 + (worker.nin_count - 2) * 4)
        reasons.append({
            "flag": f"NIN shared by {worker.nin_count} payroll profiles",
            "severity": "high",
            "contribution": contrib,
        })
        rules_score += contrib

    # 2. Shared bank account (strongest single signal)
    if worker.account_count > 1:
        contrib = min(40, 20 + (worker.account_count - 2) * 8)
        reasons.append({
            "flag": f"Bank account linked to {worker.account_count} separate employees",
            "severity": "high",
            "contribution": contrib,
        })
        rules_score += contrib

    # 3. Salary outlier
    if abs(worker.salary_zscore) > 2.0:
        zscore_label = round(worker.salary_zscore, 2)
        contrib = min(18, int(abs(worker.salary_zscore) * 4))
        reasons.append({
            "flag": f"Salary anomaly detected — Z-score {zscore_label} vs workforce mean",
            "severity": "medium" if abs(worker.salary_zscore) < 3.0 else "high",
            "contribution": contrib,
        })
        rules_score += contrib

    # 4. Missing mandatory fields
    if worker.missing_score > 0:
        contrib = worker.missing_score * 6
        reasons.append({
            "flag": f"{worker.missing_score} mandatory HR field{'s' if worker.missing_score > 1 else ''} absent from profile",
            "severity": "medium",
            "contribution": contrib,
        })
        rules_score += contrib

    # 5. Attendance anomaly (< 20% marks inactive / ghost status)
    if worker.attendance_score < 20:
        contrib = 30 if worker.attendance_score < 10 else 22
        reasons.append({
            "flag": f"Attendance critically low at {round(worker.attendance_score, 1)}%",
            "severity": "high",
            "contribution": contrib,
        })
        rules_score += contrib
    elif worker.attendance_score < 40:
        contrib = 8
        reasons.append({
            "flag": f"Below-average attendance ({round(worker.attendance_score, 1)}%) recorded",
            "severity": "medium",
            "contribution": contrib,
        })
        rules_score += contrib

    # 6. Stale biometric / verification date
    if worker.days_since_verification > 180:
        contrib = 25
        reasons.append({
            "flag": f"Biometric verification not updated in {int(worker.days_since_verification)} days",
            "severity": "high",
            "contribution": contrib,
        })
        rules_score += contrib
    elif worker.days_since_verification > 90:
        contrib = 8
        reasons.append({
            "flag": f"Last verified {int(worker.days_since_verification)} days ago — verification overdue",
            "severity": "medium",
            "contribution": contrib,
        })
        rules_score += contrib

    # ------------------------------------------------------------------
    # IsolationForest catch-all: fires ONLY when no strong rules triggered
    # This prevents double-counting while still catching subtle anomalies.
    # ------------------------------------------------------------------
    if rules_score < 25 and iso_prediction == -1 and iso_prob > 55:
        ml_contrib = round(min(28, iso_prob - 40), 1)
        reasons.append({
            "flag": "Multivariate anomaly cluster detected by ML (no single dominant rule)",
            "severity": "medium",
            "contribution": ml_contrib,
        })
        rules_score += ml_contrib

    payload = _risk_payload(rules_score, iso_prob, reasons)
    print(
        "[AI DEBUG] single score "
        f"features={features.tolist()[0]} iso={round(iso_prob, 2)} "
        f"risk={payload['risk_score']} status={payload['status']} "
        f"reasons={len(reasons)}"
    )
    return payload


@app.post("/predict/batch")
def predict_batch(workers: List[WorkerRecord]):
    if not workers:
        return []

    # Vectorize feature extraction
    features = np.array([
        [
            w.nin_count,
            w.account_count,
            w.salary_zscore,
            w.missing_score,
            w.attendance_score,
            w.days_since_verification
        ] for w in workers
    ])

    # Bulk ML prediction (Lightning fast compared to 1-by-1)
    iso_preds = model.predict(features)
    iso_raw_scores = model.decision_function(features)
    
    results = []
    for i, worker in enumerate(workers):
        iso_prediction = iso_preds[i]
        raw = iso_raw_scores[i]
        iso_prob = max(0.0, min(100.0, 50.0 - raw * 120.0))

        rules_score = 0.0
        reasons = []

        if worker.nin_count > 1:
            contrib = min(18, 10 + (worker.nin_count - 2) * 4)
            reasons.append({"flag": f"NIN shared by {worker.nin_count} payroll profiles", "severity": "high", "contribution": contrib})
            rules_score += contrib

        if worker.account_count > 1:
            contrib = min(40, 20 + (worker.account_count - 2) * 8)
            reasons.append({"flag": f"Bank account linked to {worker.account_count} separate employees", "severity": "high", "contribution": contrib})
            rules_score += contrib

        if abs(worker.salary_zscore) > 2.0:
            contrib = min(18, int(abs(worker.salary_zscore) * 4))
            reasons.append({"flag": f"Salary anomaly detected — Z-score {round(worker.salary_zscore, 2)} vs workforce mean", "severity": "medium" if abs(worker.salary_zscore) < 3.0 else "high", "contribution": contrib})
            rules_score += contrib

        if worker.missing_score > 0:
            contrib = worker.missing_score * 6
            reasons.append({"flag": f"{worker.missing_score} mandatory HR field{'s' if worker.missing_score > 1 else ''} absent from profile", "severity": "medium", "contribution": contrib})
            rules_score += contrib

        if worker.attendance_score < 20:
            contrib = 30 if worker.attendance_score < 10 else 22
            reasons.append({"flag": f"Attendance critically low at {round(worker.attendance_score, 1)}%", "severity": "high", "contribution": contrib})
            rules_score += contrib
        elif worker.attendance_score < 40:
            contrib = 8
            reasons.append({"flag": f"Below-average attendance ({round(worker.attendance_score, 1)}%) recorded", "severity": "medium", "contribution": contrib})
            rules_score += contrib

        if worker.days_since_verification > 180:
            contrib = 25
            reasons.append({"flag": f"Biometric verification not updated in {int(worker.days_since_verification)} days", "severity": "high", "contribution": contrib})
            rules_score += contrib
        elif worker.days_since_verification > 90:
            contrib = 8
            reasons.append({"flag": f"Last verified {int(worker.days_since_verification)} days ago — verification overdue", "severity": "medium", "contribution": contrib})
            rules_score += contrib

        if rules_score < 25 and iso_prediction == -1 and iso_prob > 55:
            ml_contrib = round(min(28, iso_prob - 40), 1)
            reasons.append({"flag": "Multivariate anomaly cluster detected by ML (no single dominant rule)", "severity": "medium", "contribution": ml_contrib})
            rules_score += ml_contrib

        results.append(_risk_payload(rules_score, iso_prob, reasons))

    flagged = [r for r in results if r["status"] == "FLAGGED"]
    print(
        "[AI DEBUG] batch scored "
        f"records={len(results)} "
        f"anomaly_score_range={round(float(np.min(iso_raw_scores)), 4)}..{round(float(np.max(iso_raw_scores)), 4)} "
        f"mapped_anomaly_range={round(min(r['anomaly_score'] for r in results), 1)}..{round(max(r['anomaly_score'] for r in results), 1)} "
        f"flagged={len(flagged)}"
    )
    if flagged:
        sample = flagged[0]
        print(
            "[AI DEBUG] sample flagged "
            f"risk={sample['risk_score']} trust={sample['trust_score']} "
            f"level={sample['risk_level']} reasons={sample['reasons'][:3]}"
        )
    else:
        max_result = max(results, key=lambda r: r["risk_score"]) if results else None
        print(f"[AI DEBUG] no anomalies flagged. top_result={max_result}")

    return results


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
