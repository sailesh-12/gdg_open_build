from google.cloud import aiplatform

aiplatform.init(
    project="gdgmlmodel",
    location="us-central1"
)

model = aiplatform.Model.upload(
    display_name="anchorrisk-fragility-model",
    serving_container_image_uri=
    "us-central1-docker.pkg.dev/gdgmlmodel/anchorrisk-repo/anchorrisk-ml",
    serving_container_predict_route="/predict",
    serving_container_health_route="/",
    serving_container_ports=[8080]
)

print("MODEL RESOURCE NAME:", model.resource_name)
