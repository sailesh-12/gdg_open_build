require('dotenv').config();
const driver = require("../db/neo4j");
const { hashIdentifier, hashMembers, hashSupports } = require("../utils/hashService");

async function createTestHousehold() {
    const session = driver.session();

    try {
        console.log("Creating test household with multiple members...\n");

        // Define test household
        const householdId = "sharma-test-family";
        const hashedHouseholdId = hashIdentifier(householdId);

        // Define members with proper roles
        const members = [
            {
                id: "rajesh-kumar-sharma",
                role: "earner",
                income_stability: 0.9,
                is_applicant: true,
                income_sources: [
                    { type: "job", stability: 0.9, volatility: 0.2, is_primary: true, amount_band: "high" },
                    { type: "freelance", stability: 0.6, volatility: 0.7, is_primary: false, amount_band: "low" }
                ]
            },
            {
                id: "priya-sharma",
                role: "earner",
                income_stability: 0.7,
                is_applicant: false,
                income_sources: [
                    { type: "freelance", stability: 0.7, volatility: 0.5, is_primary: true, amount_band: "medium" }
                ]
            },
            {
                id: "ankit-sharma",
                role: "dependent",
                income_stability: 0,
                is_applicant: false,
                income_sources: []
            },
            {
                id: "meera-devi",
                role: "earner",
                income_stability: 0.95,
                is_applicant: false,
                income_sources: [
                    { type: "pension", stability: 0.95, volatility: 0.1, is_primary: true, amount_band: "low" }
                ]
            }
        ];

        const hashedMembers = hashMembers(members);

        // Define supports
        const supports = [
            { from: "rajesh-kumar-sharma", to: "ankit-sharma", strength: 0.8 },
            { from: "priya-sharma", to: "ankit-sharma", strength: 0.7 },
            { from: "rajesh-kumar-sharma", to: "meera-devi", strength: 0.5 }
        ];

        const hashedSupports = hashSupports(supports);

        // Create Household
        console.log("1️⃣ Creating household:", householdId);
        await session.run(`CREATE (h:Household {id: $householdId})`, {
            householdId: hashedHouseholdId
        });

        // Create Members with income sources
        console.log("\n2️⃣ Creating members:");
        for (let i = 0; i < hashedMembers.length; i++) {
            const m = hashedMembers[i];
            const originalMember = members[i];

            // Calculate income stability
            let incomeStability = 0;
            if (originalMember.income_sources && originalMember.income_sources.length > 0) {
                const sum = originalMember.income_sources.reduce((acc, src) => acc + src.stability, 0);
                incomeStability = sum / originalMember.income_sources.length;
            }

            await session.run(
                `
                MERGE (p:Person {id: $id})
                ON CREATE SET p.role = $role, p.income_stability = $income, p.is_applicant = $is_applicant
                ON MATCH SET p.role = $role, p.income_stability = $income, p.is_applicant = $is_applicant
                WITH p
                MATCH (h:Household {id: $householdId})
                MERGE (p)-[:BELONGS_TO]->(h)
                `,
                {
                    id: m.id,
                    role: m.role,
                    income: incomeStability,
                    is_applicant: m.is_applicant,
                    householdId: hashedHouseholdId
                }
            );

            console.log(`   ✅ ${originalMember.id} (${m.role}, income_stability: ${incomeStability.toFixed(2)})`);

            // Create income sources
            if (originalMember.income_sources && originalMember.income_sources.length > 0) {
                for (const source of originalMember.income_sources) {
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
                            type: source.type,
                            stability: source.stability,
                            volatility: source.volatility,
                            is_primary: source.is_primary,
                            amount_band: source.amount_band,
                            personId: m.id
                        }
                    );
                }
                console.log(`      📊 Created ${originalMember.income_sources.length} income source(s)`);
            }
        }

        // Create supports
        console.log("\n3️⃣ Creating support relationships:");
        for (const s of hashedSupports) {
            await session.run(
                `
                MATCH (a:Person {id: $from}),
                      (b:Person {id: $to})
                CREATE (a)-[:SUPPORTS {strength: $strength}]->(b)
                `,
                s
            );
            console.log(`   ✅ ${s.from.substring(0, 15)}... -> ${s.to.substring(0, 15)}... (strength: ${s.strength})`);
        }

        console.log("\n✅ Test household created successfully!");
        console.log(`\n📝 You can now search for: "${householdId}"`);
        console.log(`   - 3 Earners: Rajesh (job+freelance), Priya (freelance), Meera (pension)`);
        console.log(`   - 1 Dependent: Ankit`);

    } catch (error) {
        console.error("❌ Error creating test household:", error);
    } finally {
        await session.close();
        await driver.close();
    }
}

createTestHousehold();
