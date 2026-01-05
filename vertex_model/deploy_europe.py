from google.cloud import aiplatform
import sys

aiplatform.init(
    project="gdgmlmodel",
    location="europe-west4"
)

# Get the model resource name from command line or use the latest
if len(sys.argv) > 1:
    model_resource_name = sys.argv[1]
else:
    # List models and get the most recent one
    models = aiplatform.Model.list(
        filter='display_name="anchorrisk-fragility-model"',
        order_by="create_time desc"
    )
    if not models:
        print("ERROR: No model found in europe-west4. Run upload_europe.py first.")
        sys.exit(1)
    model_resource_name = models[0].resource_name
    print(f"Using model: {model_resource_name}")

model = aiplatform.Model(model_resource_name)

endpoint = model.deploy(
    machine_type="n1-standard-2",
    min_replica_count=1,
    max_replica_count=1
)

endpoint = aiplatform.Endpoint(endpoint.resource_name)
print(endpoint.list_models())
print("ENDPOINT RESOURCE NAME:", endpoint.resource_name)
