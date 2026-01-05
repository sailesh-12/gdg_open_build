"""Simple test using requests library to bypass aiplatform SDK issues."""
import requests
import subprocess
import json

# Get access token
token = subprocess.check_output(
    "gcloud auth print-access-token", 
    shell=True
).decode().strip()

# Endpoint details
endpoint = "https://europe-west4-aiplatform.googleapis.com/v1/projects/141799515966/locations/europe-west4/endpoints/7591584631049158656:predict"

# Test payload
payload = {
    "instances": [{
        "members": [
            {"id": "E1", "role": "earner", "income_stability": 0.7},
            {"id": "D1", "role": "dependent"}
        ],
        "supports": [
            {"from": "E1", "to": "D1", "strength": 0.8}
        ]
    }]
}

# Make request
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("Testing Vertex AI endpoint...")
print(f"Endpoint: {endpoint}")
print(f"Payload: {json.dumps(payload, indent=2)}\n")

response = requests.post(endpoint, headers=headers, json=payload)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print("✅ SUCCESS!")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
else:
    print("❌ ERROR!")
    print(f"Response: {response.text}")
