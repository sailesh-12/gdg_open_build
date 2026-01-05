const { getMLRisk } = require("../mLService/service");
const { computeGraphMetrics, extractApplicant } = require("./graphService");
const { aggregateIncomeFeatures, getIncomeInsights } = require("./incomeFeatures");
const driver = require("../db/neo4j");

function cleanPayload(members, supports) {
  // Edge case: Handle null/undefined inputs
  if (!members || !Array.isArray(members)) {
    members = [];
  }
  if (!supports || !Array.isArray(supports)) {
    supports = [];
  }

  // Filter out invalid supports (null values, self-loops, invalid strength)
  const validSupports = supports.filter(
    (s) => s && s.from && s.to && s.from !== s.to &&
      typeof s.strength === 'number' && s.strength >= 0 && s.strength <= 1
  );

  // Ensure all members have valid roles and income_stability
  const validMembers = members
    .filter(m => m && m.id) // Filter out null/undefined members
    .map((m) => ({
      id: m.id,
      role: (m.role === "earner" || m.role === "dependent") ? m.role : "dependent",
      income_stability: (typeof m.income_stability === 'number' && m.income_stability >= 0 && m.income_stability <= 1)
        ? m.income_stability
        : 0.5,
      income_sources: m.income_sources || [] // Preserve income sources
    }));

  return { members: validMembers, supports: validSupports };
}

// Add a helper function to calculate the mean
function calculateMean(array) {
  if (!array || !array.length) return 0;
  const validValues = array.filter(v => typeof v === 'number' && !isNaN(v));
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function extract_features(data) {
  const members = data.members || [];
  const supports = data.supports || [];

  const num_members = members.length;
  const earners = members.filter((m) => m && m.role === "earner");
  const num_earners = Math.max(1, earners.length); // Prevent division by zero

  const dependency_ratio = (num_members - num_earners) / num_earners;

  const income_stability = calculateMean(
    earners.map((m) => m && typeof m.income_stability === 'number' ? m.income_stability : 0.5)
  );

  const avg_support_strength =
    supports && supports.length > 0
      ? calculateMean(
        supports.map((s) => (s && s.from && s.to && typeof s.strength === 'number') ? s.strength : 0.5)
      )
      : 0.5;

  const expense_rigidity = 0.6; // assumed / heuristic
  const medical_risk = 0.4; // assumed / heuristic

  const single_point_failure = num_earners === 1 ? 1 : 0;
  const dependency_concentration = Math.min(1.0, dependency_ratio / 3);

  const shock_amplification =
    dependency_concentration * 0.4 +
    medical_risk * 0.3 +
    expense_rigidity * 0.3;

  return [
    num_members,
    num_earners,
    dependency_ratio,
    income_stability,
    avg_support_strength,
    expense_rigidity,
    medical_risk,
    single_point_failure,
    dependency_concentration,
    shock_amplification,
  ];
}

async function buildRiskContext(householdId) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (h:Household {id: $householdId})<-[:BELONGS_TO]-(p:Person)
      OPTIONAL MATCH (p)-[r:SUPPORTS]->(d:Person)
      RETURN 
        collect(DISTINCT p) AS members,
        collect(DISTINCT {
          from: p.id,
          to: d.id,
          strength: r.strength
        }) AS supports
      `,
      { householdId }
    );

    if (!result.records.length) return null;

    const members = result.records[0]
      .get("members")
      .map((p) => p.properties);

    const supports = result.records[0].get("supports") || []; // Default to an empty array if supports is null

    console.log("\n📊 Members retrieved from database:");
    members.forEach((m, i) => {
      console.log(`  Member ${i}: id=${m.id?.substring(0, 8)}..., role=${m.role}, income_stability=${m.income_stability}`);
    });

    if (!members || members.length === 0) {
      throw new Error("No members found for the household");
    }

    // Fetch income sources for each member
    const incomeResult = await session.run(
      `
      MATCH (h:Household {id: $householdId})<-[:BELONGS_TO]-(p:Person)
      OPTIONAL MATCH (p)-[:EARNS_FROM]->(is:IncomeSource)
      RETURN p.id AS personId, collect(is) AS sources
      `,
      { householdId }
    );

    const incomeSourcesByPerson = {};
    incomeResult.records.forEach(rec => {
      const personId = rec.get("personId");
      const sources = rec.get("sources").map(is => is ? is.properties : null).filter(is => is !== null);
      incomeSourcesByPerson[personId] = sources;
    });

    // Enrich members with income sources and aggregate features
    const enrichedMembers = members.map(m => {
      const memberIncomeSources = incomeSourcesByPerson[m.id] || [];
      if (memberIncomeSources.length > 0) {
        m.income_sources = memberIncomeSources;
        const incomeFeatures = aggregateIncomeFeatures(m);
        m.income_stability = incomeFeatures.avg_income_stability;
        m.income_features = incomeFeatures; // Store for later use in explanations
      }
      return m;
    });

    console.log("\n📊 After enrichment - Member summary:");
    const earnerCount = enrichedMembers.filter(m => m.role === "earner").length;
    const dependentCount = enrichedMembers.filter(m => m.role === "dependent").length;
    console.log(`  Earners: ${earnerCount}, Dependents: ${dependentCount}`);

    console.log("Raw members:", enrichedMembers);
    console.log("Raw supports:", supports);

    // Clean the payload
    const cleanedPayload = cleanPayload(enrichedMembers, supports);
    console.log("Cleaned payload sent to ML service:", cleanedPayload);

    const ml = await getMLRisk(cleanedPayload);
    const graphMetrics = computeGraphMetrics(enrichedMembers, supports);
    const applicant = extractApplicant(enrichedMembers);

    // Generate income insights for all members
    const incomeInsights = enrichedMembers
      .filter(m => m.income_features)
      .flatMap(m => getIncomeInsights(m.income_features));

    return {
      householdId,
      fragility_score: ml.fragility_score || 0,
      risk_band: ml.risk_band || "UNKNOWN",
      features: ml.features || {},
      graph_metrics: graphMetrics,
      applicant,
      income_insights: incomeInsights, // NEW: Include income diversity insights
      members: enrichedMembers // Include full member data with income sources
    };
  } finally {
    session.close();
  }
}

module.exports = { buildRiskContext };
