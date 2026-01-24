const axios = require("axios");

// ML Service URL - Deployed on Render (fallback for local: http://localhost:8080)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://ml-model-anchorrisk.onrender.com";

async function getMLRisk(householdPayload) {
  try {
    // Validate members exist
    if (!householdPayload || !householdPayload.members || householdPayload.members.length === 0) {
      console.error("Validation Error: No members found in household payload");
      throw new Error("NO_MEMBERS_FOUND: The household has no members to analyze. Please ensure at least one member exists.");
    }

    console.log("Payload sent to ML Service:", JSON.stringify(householdPayload, null, 2));

    // Call the local ML service's /analyze-household endpoint
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-household`, {
      members: householdPayload.members.map(m => ({
        id: m.id,
        role: m.role,
        income_stability: m.income_stability ?? 0.5
      })),
      supports: (householdPayload.supports || []).map(s => ({
        from: s.from,
        to: s.to,
        strength: s.strength ?? 0.5
      }))
    });

    console.log("ML Service response:", JSON.stringify(response.data, null, 2));

    const result = response.data;

    if (!result || result.fragility_score === undefined) {
      throw new Error("No valid prediction returned from ML Service");
    }

    return {
      fragility_score: result.fragility_score,
      risk_band: result.risk_band || "UNKNOWN",
      features: result.features || {}
    };
  } catch (error) {
    console.error("Error calling ML Service:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw new Error("ML_SERVICE_UNAVAILABLE");
  }
}

module.exports = { getMLRisk };
