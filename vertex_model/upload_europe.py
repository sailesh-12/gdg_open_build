from google.cloud import aiplatform

# Using europe-west4 to bypass us-central1 quota limits
aiplatform.init(
    project="gdgmlmodel",
    location="europe-west4"
)

model = aiplatform.Model.upload(
    display_name="anchorrisk-fragility-model",
    # Using the same container - Vertex AI can pull from any regional registry
    serving_container_image_uri=
    "us-central1-docker.pkg.dev/gdgmlmodel/anchorrisk-repo/anchorrisk-ml",
    serving_container_predict_route="/predict",
    serving_container_health_route="/",
    serving_container_ports=[8080]
)

print("MODEL RESOURCE NAME:", model.resource_name)
print("\nNow run deploy_europe.py to deploy this model")
