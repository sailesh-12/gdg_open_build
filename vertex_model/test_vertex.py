from google.cloud import aiplatform

aiplatform.init(project="gdgmlmodel", location="europe-west4")

endpoint = aiplatform.Endpoint(
    "projects/141799515966/locations/europe-west4/endpoints/7591584631049158656"
)

response = endpoint.predict(
    instances=[{
        "members": [
            { "id": "E1", "role": "earner", "income_stability": 0.7 },
            { "id": "D1", "role": "dependent" }
        ],
        "supports": [
            { "from": "E1", "to": "D1", "strength": 0.8 }
        ]
    }]
)

print(response.predictions)
