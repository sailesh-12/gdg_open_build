from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

# Load trained model
model = joblib.load("fragility_model.pkl")

app = FastAPI(title="Household Risk ML Service")

# -----------------------------
# Health Check (required by Vertex AI)
# -----------------------------
@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# -----------------------------
# Input Schema
# -----------------------------
class HouseholdGraph(BaseModel):
    members: list
    supports: list

# -----------------------------
# Feature Extraction
# -----------------------------
def extract_features(data):
    members = data["members"]
    supports = data["supports"]

    num_members = len(members)
    earners = [m for m in members if m.get("role") == "earner"]
    num_earners = max(1, len(earners))

    dependency_ratio = (num_members - num_earners) / num_earners

    income_stability = np.mean([
        m.get("income_stability", 0.5) for m in earners
    ])

    avg_support_strength = np.mean([
        s.get("strength", 0.5) for s in supports
    ]) if supports else 0.5

    expense_rigidity = 0.6
    medical_risk = 0.4

    single_point_failure = 1 if num_earners == 1 else 0
    dependency_concentration = min(1.0, dependency_ratio / 3)

    all_earner_household = 1 if (num_members == num_earners and num_members > 1) else 0
    
    earner_ids = {m.get("id") for m in earners}
    earner_to_earner_support = [
        s for s in supports 
        if s.get("from") in earner_ids and s.get("to") in earner_ids
    ]
    earner_interdependency = (
        len(earner_to_earner_support) / max(1, len(supports))
        if supports else 0
    )

    if all_earner_household:
        avg_income_risk = 1 - income_stability
        shock_amplification = (
            avg_income_risk * 0.4 +
            earner_interdependency * 0.2 +
            medical_risk * 0.2 +
            expense_rigidity * 0.2
        )
    else:
        shock_amplification = (
            dependency_concentration * 0.4 +
            medical_risk * 0.3 +
            expense_rigidity * 0.3
        )

    return [
        num_members,
        num_earners,
        dependency_ratio,
        income_stability,
        avg_support_strength,
        expense_rigidity,
        medical_risk,
        single_point_failure,
        dependency_concentration,
        shock_amplification
    ]

# -----------------------------
# Prediction Endpoint (custom)
# -----------------------------
@app.post("/analyze-household")
def analyze_household(data: HouseholdGraph):
    features = extract_features(data.dict())
    score = float(model.predict([features])[0])

    return {
        "fragility_score": round(score, 2),
        "features": {
            "dependency_ratio": features[2],
            "single_point_failure": features[7],
            "shock_amplification": features[9],
        },
        "risk_band": (
            "LOW" if score < 0.3 else
            "MEDIUM" if score < 0.6 else
            "HIGH"
        )
    }

# -----------------------------
# Vertex AI Prediction Endpoint
# -----------------------------
class VertexAIRequest(BaseModel):
    instances: list

@app.post("/predict")
def predict(request: VertexAIRequest):
    predictions = []
    for instance in request.instances:
        features = extract_features(instance)
        score = float(model.predict([features])[0])
        predictions.append({
            "fragility_score": round(score, 2),
            "features": {
                "dependency_ratio": features[2],
                "single_point_failure": features[7],
                "shock_amplification": features[9],
            },
            "risk_band": (
                "LOW" if score < 0.3 else
                "MEDIUM" if score < 0.6 else
                "HIGH"
            )
        })
    return {"predictions": predictions}
