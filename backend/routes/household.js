const express = require("express");
const driver = require("../db/neo4j");
const { hashIdentifier, hashMembers, hashSupports } = require("../utils/hashService");

const router = express.Router();

router.post("/create", async (req, res) => {
  const session = driver.session();
  const { householdId, members, supports } = req.body;

  // Hash all identifiers before storing
  const hashedHouseholdId = hashIdentifier(householdId);
  const hashedMembers = hashMembers(members);
  const hashedSupports = hashSupports(supports);

  // Debug logging
  console.log(`Creating household: ${householdId} -> ${hashedHouseholdId}`);

  try {
    // Create Household with hashed ID
    await session.run(
      `CREATE (h:Household {id: $householdId})`,
      { householdId: hashedHouseholdId }
    );

    // Create Members with hashed IDs
    let hasApplicant = false;
    for (let i = 0; i < hashedMembers.length; i++) {
      const m = hashedMembers[i];
      const originalMember = members[i]; // For validation message clarity

      if (originalMember.is_applicant) {
        if (hasApplicant) {
          return res.status(400).json({ error: "Only one applicant allowed per household" });
        }
        hasApplicant = true;
      }

      // Determine income_stability: use from income_sources if present, else use direct field
      let incomeStability = 0;
      if (originalMember.income_sources && Array.isArray(originalMember.income_sources) && originalMember.income_sources.length > 0) {
        // Calculate average stability from income sources
        const sum = originalMember.income_sources.reduce((acc, src) => acc + (src.stability || 0.5), 0);
        incomeStability = sum / originalMember.income_sources.length;
      } else {
        // Backward compatible: use legacy field
        incomeStability = originalMember.income_stability || 0;
      }

      await session.run(
        `
        MERGE (p:Person {id: $id})
        ON CREATE SET p.role = $role, p.income_stability = $income, p.is_applicant = coalesce($is_applicant, false)
        ON MATCH SET p.role = $role, p.income_stability = $income, p.is_applicant = coalesce($is_applicant, false)
        WITH p
        MATCH (h:Household {id: $householdId})
        MERGE (p)-[:BELONGS_TO]->(h)
        `,
        {
          id: m.id,
          role: m.role,
          income: incomeStability,
          is_applicant: m.is_applicant || false,
          householdId: hashedHouseholdId
        }
      );

      // Create IncomeSource nodes if income_sources array exists
      if (originalMember.income_sources && Array.isArray(originalMember.income_sources)) {
        for (const incomeSource of originalMember.income_sources) {
          await session.run(
            `
            CREATE (is:IncomeSource {
              type: $type,
              stability: $stability,
              volatility: $volatility,
              is_primary: $is_primary,
              amount_band: $amount_band
            })
            WITH is
            MATCH (p:Person {id: $personId})
            CREATE (p)-[:EARNS_FROM]->(is)
            `,
            {
              type: incomeSource.type || 'job',
              stability: incomeSource.stability || 0.5,
              volatility: incomeSource.volatility || 0.5,
              is_primary: incomeSource.is_primary || false,
              amount_band: incomeSource.amount_band || 'medium',
              personId: m.id
            }
          );
        }
      }
    }

    // Create SUPPORTS relationships with hashed IDs
    for (let s of hashedSupports) {
      await session.run(
        `
        MATCH (a:Person {id: $from}),
              (b:Person {id: $to})
        CREATE (a)-[:SUPPORTS {strength: $strength}]->(b)
        `,
        s
      );
    }

    res.status(201).json({ message: "Household stored" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neo4j error" });
  } finally {
    await session.close();
  }
});

router.delete("/:id", async (req, res) => {
  const session = driver.session();
  const householdId = hashIdentifier(req.params.id);

  try {
    await session.run(
      `
      MATCH (h:Household {id: $householdId})<-[:BELONGS_TO]-(p:Person)
      DETACH DELETE p, h
      `,
      { householdId }
    );

    res.json({ message: "Household deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  } finally {
    await session.close();
  }
});


module.exports = router;
