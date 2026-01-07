const { PredictionServiceClient } = require("@google-cloud/aiplatform").v1;

// Initialize the Vertex AI client with credentials from environment
const getClientConfig = () => {
  const config = {
    apiEndpoint: `${process.env.VERTEX_LOCATION || "europe-west4"}-aiplatform.googleapis.com`
  };

  // If GOOGLE_APPLICATION_CREDENTIALS_JSON is provided (for Render/cloud deployment)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      config.credentials = credentials;
    } catch (error) {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:", error.message);
    }
  }
  // If GOOGLE_APPLICATION_CREDENTIALS path is provided (for local development)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return config;
};

const client = new PredictionServiceClient(getClientConfig());

// Construct the endpoint resource name
const ENDPOINT = `projects/${process.env.VERTEX_PROJECT_ID || "gdgmlmodel"}/locations/${process.env.VERTEX_LOCATION || "europe-west4"}/endpoints/${process.env.VERTEX_ENDPOINT_ID || "5547513350176374784"}`;

async function getMLRisk(householdPayload) {
  try {
    // Validate members exist
    if (!householdPayload || !householdPayload.members || householdPayload.members.length === 0) {
      console.error("Validation Error: No members found in household payload");
      throw new Error("NO_MEMBERS_FOUND: The household has no members to analyze. Please ensure at least one member exists.");
    }

    console.log("Payload sent to Vertex AI:", JSON.stringify(householdPayload, null, 2));

    // Format the instance for Vertex AI
    const instance = {
      structValue: {
        fields: {
          members: {
            listValue: {
              values: householdPayload.members.map(m => ({
                structValue: {
                  fields: {
                    id: { stringValue: m.id },
                    role: { stringValue: m.role },
                    income_stability: { numberValue: m.income_stability ?? 0.5 }
                  }
                }
              }))
            }
          },
          supports: {
            listValue: {
              values: (householdPayload.supports || []).map(s => ({
                structValue: {
                  fields: {
                    from: { stringValue: s.from },
                    to: { stringValue: s.to },
                    strength: { numberValue: s.strength ?? 0.5 }
                  }
                }
              }))
            }
          }
        }
      }
    };

    const [response] = await client.predict({
      endpoint: ENDPOINT,
      instances: [instance],
    });

    console.log("Vertex AI response:", JSON.stringify(response, null, 2));

    // Extract the prediction from the response
    const prediction = response.predictions?.[0];

    if (!prediction) {
      throw new Error("No prediction returned from Vertex AI");
    }

    // Parse the prediction (handle both struct and direct value formats)
    let result;
    if (prediction.structValue) {
      const fields = prediction.structValue.fields;
      result = {
        fragility_score: fields.fragility_score?.numberValue ?? 0,
        risk_band: fields.risk_band?.stringValue ?? "UNKNOWN",
        features: {}
      };

      // Extract features if present
      if (fields.features?.structValue?.fields) {
        const featFields = fields.features.structValue.fields;
        for (const [key, val] of Object.entries(featFields)) {
          result.features[key] = val.numberValue ?? val.boolValue ?? val.stringValue;
        }
      }
    } else {
      // Fallback: try to use the prediction directly
      result = prediction;
    }

    return result;
  } catch (error) {
    console.error("Error calling Vertex AI:", error.message);
    if (error.details) {
      console.error("Error details:", error.details);
    }
    throw new Error("ML_SERVICE_UNAVAILABLE");
  }
}

module.exports = { getMLRisk };


