import pandas as pd
from xgboost import XGBRegressor 
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# Load synthetic dataset
df = pd.read_csv("synthetic_household_fragility_data.csv")

# Split features and target
X = df.drop("fragility_score", axis=1)
y = df["fragility_score"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# XGBRegressor (hackathon-safe config)
model = XGBRegressor(
    n_estimators=150,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)

print(f"MAE: {mae:.4f}")

# Save model
joblib.dump(model, "fragility_model.pkl")
print("Model saved as fragility_model.pkl")
