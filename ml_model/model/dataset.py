import random
import pandas as pd

random.seed(42)

def generate_household():
    # --- Household structure ---
    num_members = random.randint(2, 6)
    num_earners = random.randint(1, min(2, num_members))

    dependents = num_members - num_earners
    dependency_ratio = round(dependents / num_earners, 2)

    # --- Core attributes ---
    income_stability = round(random.uniform(0.3, 0.95), 2)
    avg_support_strength = round(random.uniform(0.4, 0.9), 2)
    expense_rigidity = round(random.uniform(0.3, 0.85), 2)
    medical_risk = round(random.uniform(0.0, 0.8), 2)

    single_point_failure = 1 if num_earners == 1 else 0
    dependency_concentration = round(min(1.0, dependency_ratio / 3), 2)

    # --- Stress amplification ---
    shock_amplification = round(
        (dependency_concentration * 0.4) +
        (medical_risk * 0.3) +
        (expense_rigidity * 0.3),
        2
    )

    # --- Continuous fragility score (TARGET) ---
    fragility_score = (
        dependency_concentration * 0.35 +
        shock_amplification * 0.30 +
        (1 - income_stability) * 0.25 +
        single_point_failure * 0.10
    )

    fragility_score = round(min(1.0, max(0.0, fragility_score)), 2)

    return {
        "num_members": num_members,
        "num_earners": num_earners,
        "dependency_ratio": dependency_ratio,
        "income_stability": income_stability,
        "avg_support_strength": avg_support_strength,
        "expense_rigidity": expense_rigidity,
        "medical_risk": medical_risk,
        "single_point_failure": single_point_failure,
        "dependency_concentration": dependency_concentration,
        "shock_amplification": shock_amplification,
        "fragility_score": fragility_score
    }

def generate_dataset(n_samples=10000):
    return pd.DataFrame([generate_household() for _ in range(n_samples)])

# ---- Generate dataset ----
df = generate_dataset(10000)

# Save to CSV
df.to_csv("synthetic_household_fragility_data.csv", index=False)

print(df.head())
print("\nDataset shape:", df.shape)
