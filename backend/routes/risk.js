const express = require("express");
const { getMLRisk } = require("../mLservice/service.js");
const { buildRiskContext } = require("../services/riskContext")
const driver = require("../db/neo4j");
const router = express.Router();


router.post("/analyze/:householdId", async (req, res) => {
  const session = driver.session();
  const householdId = req.params.householdId;

  try {

    const result = await session.run(
      `
      MATCH (h:Household {id: $householdId})<-[:BELONGS_TO]-(p:Person)
      OPTIONAL MATCH (p)-[r:SUPPORTS]->(d:Person)
      RETURN h, collect(p) AS members, collect(r) AS supports
      `,
      { householdId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Household not found" });
    }

    const record = result.records[0];
    const members = record.get("members").map(p => p.properties);
    const supports = record.get("supports").map(r => r.properties);

    const householdPayload = { members, supports };
    console.log("Payload sent to ML service:", householdPayload);

    const mlResult = await getMLRisk(householdPayload);

    res.json({
      householdId,
      ...mlResult
    });

  } catch (err) {
    console.error("Error in /analyze route:", err.message);
    res.status(500).json({ error: "Risk analysis failed" });
  } finally {
    await session.close();
  }
});

/* ---------- SUMMARY ---------- */
router.get("/summary/:id", async (req, res) => {
  try {
    const ctx = await buildRiskContext(req.params.id);
    if (!ctx) return res.status(404).json({ error: "Household not found" });

    const score = ctx.fragility_score || 0;
    const riskBand = ctx.risk_band || "UNKNOWN";

    res.json({
      score: score,
      risk_band: riskBand,
      summary:
        score > 0.6
          ? "Household is highly vulnerable to financial shocks."
          : score >= 0.3
            ? "Household has moderate financial resilience."
            : "Household shows good financial resilience."
    });
  } catch (error) {
    console.error("Error in /summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------- EXPLAIN ---------- */
router.get("/explain/:id", async (req, res) => {
  const ctx = await buildRiskContext(req.params.id);
  const f = ctx.features;

  const reasons = [];
  if (f.single_point_failure)
    reasons.push("Single income source supports the household");

  if (f.dependency_ratio > 2)
    reasons.push("High number of dependents per earner");

  if (f.shock_amplification > 0.6)
    reasons.push("Expenses and medical risk amplify financial stress");
  if (reasons.length === 0) {
    reasons.push("Household structure shows strong financial resilience");
  }


  res.json({ reasons });
});

/* ---------- WEAK LINKS ---------- */
router.get("/weak-links/:id", async (req, res) => {
  try {
    const ctx = await buildRiskContext(req.params.id);
    if (!ctx) return res.status(404).json({ error: "Household not found" });

    const criticalMembers = ctx.graph_metrics?.critical_members || [];

    res.json({
      critical_members: criticalMembers,
      reason:
        criticalMembers.length > 0
          ? "Failure of these members would cause cascading financial stress."
          : "No critical single points of failure detected."
    });
  } catch (error) {
    console.error("Error in /weak-links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------- SIMULATE ---------- */
router.post("/simulate/:id", async (req, res) => {
  const session = driver.session();
  try {
    const householdId = req.params.id;
    const { affected_member } = req.body;

    if (!affected_member) {
      return res.status(400).json({ error: "affected_member is required" });
    }

    // Fetch all household data
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

    if (!result.records.length) {
      return res.status(404).json({ error: "Household not found" });
    }

    const allMembers = result.records[0].get("members").map(p => p.properties);
    const allSupports = result.records[0].get("supports").filter(s => s.from && s.to);

    // Verify affected member exists
    const affectedMemberObj = allMembers.find(m => m.id === affected_member);
    if (!affectedMemberObj) {
      return res.status(400).json({ error: "Member not found in household" });
    }

    // Get the BEFORE score (current state)
    const beforePayload = {
      members: allMembers.map(m => ({
        id: m.id,
        role: m.role || "dependent",
        income_stability: m.income_stability ?? 0.5
      })),
      supports: allSupports.map(s => ({
        from: s.from,
        to: s.to,
        strength: s.strength ?? 0.5
      }))
    };

    const beforeResult = await getMLRisk(beforePayload);
    const beforeScore = beforeResult.fragility_score || 0;

    // Create AFTER scenario: set affected member as dependent with no income
    const afterMembers = allMembers.map(m => {
      if (m.id === affected_member) {
        return {
          ...m,
          role: "dependent",
          income_stability: 0,
        };
      }
      return m;
    });

    // Handle edge case: no members left after hypothetical change
    if (afterMembers.length === 0) {
      return res.json({
        before: beforeScore,
        after: 1.0, // Maximum fragility - household collapses
        impact: "CATASTROPHIC",
        details: {
          affected_member: affected_member,
          is_earner: affectedMemberObj.role === "earner",
          remaining_members: 0
        }
      });
    }

    // Supports remain the same as the member is not removed, just their role/income changes
    const afterPayload = {
      members: afterMembers.map(m => ({
        id: m.id,
        role: m.role || "dependent",
        income_stability: m.income_stability ?? 0.5
      })),
      supports: allSupports.map(s => ({
        from: s.from,
        to: s.to,
        strength: s.strength ?? 0.5
      }))
    };

    const afterResult = await getMLRisk(afterPayload);
    let afterScore = afterResult.fragility_score || 0;

    // If an earner lost income and no earners remain, force afterScore to maximum fragility
    const remainingEarnersAfterLoss = afterMembers.filter(m => m.role === "earner").length;
    if (affectedMemberObj.role === "earner" && remainingEarnersAfterLoss === 0) {
      afterScore = 1.0; // Set to maximum fragility
    }

    // Determine impact level based on score difference
    const scoreDiff = afterScore - beforeScore;
    let impact;
    if (afterScore >= 0.8 || scoreDiff >= 0.25) {
      impact = "SEVERE";
    } else if (scoreDiff >= 0.1) {
      impact = "MODERATE";
    } else if (scoreDiff > 0) {
      impact = "LOW";
    } else {
      impact = "MINIMAL"; // Score decreased or stayed same (unlikely but handle it)
    }

    res.json({
      before: beforeScore,
      after: afterScore,
      impact,
      details: {
        affected_member: affected_member,
        is_earner: affectedMemberObj.role === "earner",
        income_stability: affectedMemberObj.income_stability ?? 0.5,
        remaining_members: afterMembers.length,
        remaining_earners: remainingEarnersAfterLoss,
        score_change: parseFloat(scoreDiff.toFixed(3))
      }
    });
  } catch (error) {
    console.error("Error in /simulate:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
});

/* ---------- RECOMMENDATIONS ---------- */
router.get("/recommendations/:id", async (req, res) => {
  const ctx = await buildRiskContext(req.params.id);
  const f = ctx.features;

  const recommendations = [];

  if (f.single_point_failure)
    recommendations.push("Add a secondary income source");

  if (f.dependency_ratio > 2)
    recommendations.push("Reduce dependency burden");

  if (f.shock_amplification > 0.6)
    recommendations.push("Create emergency fund");

  if (recommendations.length === 0) {
    recommendations.push("No immediate risk-reducing actions required");
  }


  res.json({ recommendations });
});

/* ---------- LOAN EVALUATION ---------- */
router.post("/loan-evaluation/:id", async (req, res) => {
  const ctx = await buildRiskContext(req.params.id);

  const suggestions = [];
  let loan_risk = "LOW"; // Default to LOW

  // Determine initial loan_risk based on fragility_score
  if (ctx.fragility_score > 0.6) {
    loan_risk = "HIGH";
  } else if (ctx.fragility_score >= 0.3) {
    loan_risk = "MEDIUM";
  }

  // Apply initial suggestions based on fragility
  if (loan_risk === "HIGH") {
    suggestions.push("Household has high fragility. Recommend additional collateral or co-applicant.");
    suggestions.push("Reduce loan tenure to minimize exposure.");
  } else if (loan_risk === "MEDIUM") {
    suggestions.push("Household has moderate fragility. Advise on income stability measures.");
    suggestions.push("Review budget for non-essential expenses to free up cash flow.");
    suggestions.push("Explore options to build a small emergency fund.");
  } else { // LOW fragility
    suggestions.push("Household shows good financial resilience. Proceed with standard loan terms.");
  }

  // Check for single point of failure - critical risk
  if (ctx.features.single_point_failure) {
    suggestions.push("Require income backup or guarantor");
    // Only escalate to HIGH if fragility is also concerning
    if (ctx.fragility_score > 0.6) {
      loan_risk = "HIGH"; 
    }
  }

  // Check for chain dependencies - only flag if it's actually risky
  if (ctx.graph_metrics.has_chain_risk && ctx.fragility_score > 0.3) {
    suggestions.push("Mitigate cascading dependency risk");
    suggestions.push("Ensure earners have emergency fund coverage");

    // Add detailed chain risk information only for significant chains
    ctx.graph_metrics.chain_details.forEach(chain => {
      if (chain.chainDepth > 3) {
        suggestions.push(`Member ${chain.earner} has ${chain.chainDepth}-level dependency chain - monitor closely`);
      }
    });

    // Escalate to HIGH only if chain is deep AND fragility is moderate/high
    if (ctx.graph_metrics.max_chain_depth > 3 && ctx.fragility_score > 0.6) {
      loan_risk = "HIGH";
    }
  }

  // Check for high dependency chains only if fragility suggests risk
  if (ctx.graph_metrics.max_chain_depth > 2 && ctx.fragility_score > 0.3) {
    suggestions.push("Consider shorter loan period due to dependency chain depth");
  }

  // Check critical members concentration - only if it's a real concern
  if (ctx.graph_metrics.critical_members.length > 0 && ctx.fragility_score > 0.3) {
    const criticalRatio = ctx.graph_metrics.critical_members.length / ctx.graph_metrics.num_earners;
    if (criticalRatio > 0.7) {
      suggestions.push("High concentration of critical earners - require additional security");
    }
  }

  // If no risks detected, provide positive feedback
  if (suggestions.length === 0) {
    suggestions.push("No additional safeguards required - household shows good financial resilience");
  }

  res.json({
    loan_risk: loan_risk,
    suggestions,
    applicant_id: ctx.applicant ? ctx.applicant.id : null,
    chain_analysis: {
      has_chain_risk: ctx.graph_metrics.has_chain_risk,
      max_chain_depth: ctx.graph_metrics.max_chain_depth,
      chain_details: ctx.graph_metrics.chain_details || []
    }
  });
});

/* ---------- GRAPH DATA FOR VISUALIZATION ---------- */
router.get("/graph-data/:id", async (req, res) => {
  const session = driver.session();
  const householdId = req.params.id;

  try {
    // Fetch household members and support relationships
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

    if (!result.records.length) {
      return res.status(404).json({ error: "Household not found" });
    }

    const members = result.records[0]
      .get("members")
      .map((p) => p.properties);

    const supports = result.records[0].get("supports").filter(s => s.from && s.to);

    // Build risk context for additional metrics
    const ctx = await buildRiskContext(householdId);

    // Format nodes for visualization
    const nodes = members.map(m => ({
      id: m.id,
      label: m.id,
      role: m.role || "dependent",
      income_stability: m.income_stability || 0.5,
      is_critical: ctx?.graph_metrics?.critical_members?.includes(m.id) || false,
      is_applicant: m.is_applicant || false
    }));

    // Format edges for visualization
    const edges = supports.map(s => ({
      source: s.from,
      target: s.to,
      strength: s.strength || 0.5
    }));

    // Calculate composition data
    const earners = members.filter(m => m.role === "earner").length;
    const dependents = members.length - earners;

    // Calculate income stability from earners
    const earnerMembers = members.filter(m => m.role === "earner");
    const incomeStability = earnerMembers.length > 0
      ? earnerMembers.reduce((sum, m) => sum + (m.income_stability || 0.5), 0) / earnerMembers.length
      : 0.5;

    // Calculate support strength from supports
    const supportStrength = supports.length > 0
      ? supports.reduce((sum, s) => sum + (s.strength || 0.5), 0) / supports.length
      : 0.5;

    // Calculate dependency ratio
    const dependencyRatio = earners > 0 ? dependents / earners : 0;

    res.json({
      nodes,
      edges,
      metrics: {
        fragility_score: ctx?.fragility_score || 0,
        dependency_ratio: dependencyRatio,
        income_stability: incomeStability,
        support_strength: supportStrength
      },
      composition: {
        earners,
        dependents
      }
    });

  } catch (err) {
    console.error("Error in /graph-data route:", err.message);
    res.status(500).json({ error: "Failed to fetch graph data" });
  } finally {
    await session.close();
  }
});


module.exports = router;