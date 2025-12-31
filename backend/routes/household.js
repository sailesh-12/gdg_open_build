const express = require("express");
const driver = require("../db/neo4j");

const router = express.Router();

router.post("/create", async (req, res) => {
  const session = driver.session();
  const { householdId, members, supports } = req.body;

  try {
    // Create Household
    await session.run(
      `CREATE (h:Household {id: $householdId})`,
      { householdId }
    );

    // Create Members
    let hasApplicant = false;
    for (let m of members) {
      if (m.is_applicant) {
        if (hasApplicant) {
          return res.status(400).json({ error: "Only one applicant allowed per household" });
        }
        hasApplicant = true;
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
          income: m.income_stability || 0,
          is_applicant: m.is_applicant || false,
          householdId
        }
      );
    }

    // Create SUPPORTS relationships
    for (let s of supports) {
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
  const householdId = req.params.id;

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
