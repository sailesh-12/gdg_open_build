from google.cloud import aiplatform

aiplatform.init(
    project="gdgmlmodel",
    location="us-central1"
)

model = aiplatform.Model(
    "projects/141799515966/locations/us-central1/models/9041986703132196864"
)

endpoint = model.deploy(
    machine_type="n1-standard-2",
    min_replica_count=1,
    max_replica_count=1
)

endpoint = aiplatform.Endpoint(endpoint.resource_name)
print(endpoint.list_models())
print("ENDPOINT RESOURCE NAME:", endpoint.resource_name)
