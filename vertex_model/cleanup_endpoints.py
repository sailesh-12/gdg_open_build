"""Script to list and undeploy all models from endpoints to free up quota."""
from google.cloud import aiplatform

aiplatform.init(
    project="gdgmlmodel",
    location="us-central1"
)

print("=" * 60)
print("Listing all endpoints and their deployed models...")
print("=" * 60)

endpoints = aiplatform.Endpoint.list()

if not endpoints:
    print("No endpoints found.")
else:
    for endpoint in endpoints:
        print(f"\nEndpoint: {endpoint.display_name}")
        print(f"  Resource: {endpoint.resource_name}")
        
        deployed_models = endpoint.gca_resource.deployed_models
        if deployed_models:
            print(f"  Deployed Models: {len(deployed_models)}")
            for dm in deployed_models:
                print(f"    - ID: {dm.id}, Model: {dm.model}")
                print(f"      Machine Type: {dm.dedicated_resources.machine_spec.machine_type if dm.dedicated_resources else 'N/A'}")
                
            # Undeploy all models from this endpoint
            print(f"\n  Undeploying all models from {endpoint.display_name}...")
            for dm in deployed_models:
                try:
                    endpoint.undeploy(deployed_model_id=dm.id)
                    print(f"    ✓ Undeployed model {dm.id}")
                except Exception as e:
                    print(f"    ✗ Failed to undeploy {dm.id}: {e}")
        else:
            print("  Deployed Models: None (empty endpoint)")
            # Delete empty endpoints
            print(f"  Deleting empty endpoint...")
            try:
                endpoint.delete()
                print(f"    ✓ Deleted empty endpoint")
            except Exception as e:
                print(f"    ✗ Failed to delete: {e}")

print("\n" + "=" * 60)
print("Cleanup complete! You can now run deploy_model.py")
print("=" * 60)
