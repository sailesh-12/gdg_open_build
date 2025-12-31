const axios = require("axios");

async function getMLRisk(householdPayload) {
  try {
    console.log("Payload sent to ML service:", JSON.stringify(householdPayload, null, 2)); // Log the payload
    const response = await axios.post(
      "http://127.0.0.1:8001/analyze-household",
      householdPayload,
    );
    return response.data;
  } catch (error) {
    console.error("Error calling ML service:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw new Error("ML_SERVICE_UNAVAILABLE");
  }
}

module.exports = { getMLRisk };


