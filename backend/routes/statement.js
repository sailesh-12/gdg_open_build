const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parseStatementWithGemini } = require("../services/statementParser");
const { hashIdentifier, hashMembers, hashSupports } = require("../utils/hashService");
const driver = require("../db/neo4j");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "statement-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF and image files are allowed"));
        }
    },
});

/**
 * POST /statement/upload
 * Upload and parse a bank statement using Gemini AI
 */
router.post("/upload", upload.single("statement"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log("Processing uploaded file:", req.file.filename);

        // Parse the statement with Gemini
        const parseResult = await parseStatementWithGemini(req.file.path);

        // Clean up the uploaded file after processing
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        if (!parseResult.success) {
            return res.status(500).json({ error: parseResult.error });
        }

        res.json({
            success: true,
            data: parseResult.data,
        });
    } catch (error) {
        console.error("Error processing statement:", error);
        res.status(500).json({ error: "Failed to process bank statement" });
    }
});

/**
 * POST /statement/create-household
 * Create a household from parsed bank statement data
 */
router.post("/create-household", async (req, res) => {
    const session = driver.session();
    const { householdName, members, parsedData } = req.body;

    console.log("========== CREATE HOUSEHOLD FROM STATEMENT ==========");
    console.log("📥 Received request body:");
    console.log("  - householdName:", householdName);
    console.log("  - members count:", members?.length);
    console.log("  - members:", JSON.stringify(members, null, 2));
    console.log("  - parsedData present:", !!parsedData);
    console.log("  - detectedIncomeSources count:", parsedData?.detectedIncomeSources?.length);
    console.log("  - detectedIncomeSources:", JSON.stringify(parsedData?.detectedIncomeSources, null, 2));

    if (!householdName || !members || members.length === 0) {
        console.log("❌ Validation failed: Missing household name or members");
        return res.status(400).json({ error: "Household name and members are required" });
    }

    try {
        // Generate household ID from name
        const householdId = householdName.toLowerCase().replace(/\s+/g, "-");
        const hashedHouseholdId = hashIdentifier(householdId);
        console.log("🔐 Household ID:", householdId, "-> Hashed:", hashedHouseholdId);

        // Check if household already exists
        const existingHousehold = await session.run(
            `MATCH (h:Household {id: $householdId}) RETURN h`,
            { householdId: hashedHouseholdId }
        );

        if (existingHousehold.records.length > 0) {
            console.log("⚠️ Household already exists:", householdName);
            return res.status(409).json({
                error: `Household "${householdName}" already exists. Please use a different name or search for the existing household.`,
                householdId: householdId
            });
        }

        // Prepare members with income sources from parsed data
        console.log("\n📋 Processing members with income sources...");
        const membersWithIncome = members.map((m, index) => {
            console.log(`  Member ${index}: ${m.name} (role: ${m.role}, relationship: ${m.relationship})`);

            const memberData = {
                id: m.name.toLowerCase().replace(/\s+/g, "-"),
                role: m.role || "dependent",
                is_applicant: index === 0, // First member (account holder) is applicant
            };

            // If member is account holder and we have detected income sources, add them
            if (m.relationship === "Self" && parsedData?.detectedIncomeSources && parsedData.detectedIncomeSources.length > 0) {
                memberData.income_sources = parsedData.detectedIncomeSources;
                console.log(`    ✅ Assigned ${parsedData.detectedIncomeSources.length} income sources to ${m.name}`);
            } else if (m.role === "earner") {
                // Fallback: use simple income_stability for other earners
                memberData.income_stability = 0.5;
                console.log(`    ⚠️ No income sources for earner ${m.name}, using default stability 0.5`);
            } else {
                console.log(`    ℹ️ Dependent ${m.name} - no income sources needed`);
            }

            return memberData;
        });

        console.log("\n🔐 Hashing members...");
        const hashedMembers = hashMembers(membersWithIncome);
        console.log("  Hashed members:", hashedMembers.map(m => ({ id: m.id.substring(0, 8) + "...", role: m.role })));

        // Create supports (earners support dependents)
        const earners = membersWithIncome.filter((m) => m.role === "earner");
        const dependents = membersWithIncome.filter((m) => m.role === "dependent");
        console.log(`\n🔗 Creating support relationships: ${earners.length} earners -> ${dependents.length} dependents`);

        const supports = [];
        earners.forEach((earner) => {
            dependents.forEach((dep) => {
                supports.push({
                    from: earner.id,
                    to: dep.id,
                    strength: 0.7,
                });
            });
        });

        const hashedSupports = hashSupports(supports);
        console.log(`  Created ${hashedSupports.length} support relationships`);

        // Create Household
        console.log("\n🏠 Creating household in database...");
        await session.run(`CREATE (h:Household {id: $householdId})`, {
            householdId: hashedHouseholdId,
        });
        console.log("  ✅ Household created:", hashedHouseholdId.substring(0, 8) + "...");

        // Create Members with income sources
        console.log("\n👥 Creating members in database...");
        for (let i = 0; i < hashedMembers.length; i++) {
            const m = hashedMembers[i];
            const originalMember = membersWithIncome[i];

            // Calculate income stability from sources or use direct value
            let incomeStability = 0;
            if (originalMember.income_sources && Array.isArray(originalMember.income_sources) && originalMember.income_sources.length > 0) {
                // Calculate average stability from income sources
                const sum = originalMember.income_sources.reduce((acc, src) => acc + (src.stability || 0.5), 0);
                incomeStability = sum / originalMember.income_sources.length;
                console.log(`  Member ${i}: ${m.id.substring(0, 8)}... (income_stability: ${incomeStability.toFixed(2)}, ${originalMember.income_sources.length} income sources)`);
            } else {
                incomeStability = m.income_stability || 0;
                console.log(`  Member ${i}: ${m.id.substring(0, 8)}... (income_stability: ${incomeStability}, no income sources array)`);
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
                    householdId: hashedHouseholdId,
                }
            );
            console.log(`    ✅ Person ${m.id.substring(0, 8)}... created and linked to household`);

            // Create IncomeSource nodes if income_sources array exists
            if (originalMember.income_sources && Array.isArray(originalMember.income_sources)) {
                console.log(`    📊 Creating ${originalMember.income_sources.length} income sources for this member...`);
                for (let j = 0; j < originalMember.income_sources.length; j++) {
                    const incomeSource = originalMember.income_sources[j];
                    console.log(`      Source ${j}: type=${incomeSource.type}, stability=${incomeSource.stability}, primary=${incomeSource.is_primary}`);
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
                    console.log(`      ✅ IncomeSource ${j} created and linked to person`);
                }
            } else {
                console.log(`    ℹ️ No income sources to create for this member`);
            }
        }

        // Create SUPPORTS relationships
        console.log("\n🔗 Creating support relationships...");
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
        console.log(`  ✅ ${hashedSupports.length} support relationships created`);

        console.log("\n========== HOUSEHOLD CREATION COMPLETE ==========");
        console.log(`✅ Household: ${householdId}`);
        console.log(`✅ Members created: ${members.length}`);
        console.log(`✅ Income sources created: ${parsedData?.detectedIncomeSources?.length || 0}`);
        console.log("=================================================\n");

        res.status(201).json({
            success: true,
            message: "Household created from bank statement",
            householdId: householdId,
            membersCreated: members.length,
            incomeSourcesCreated: parsedData?.detectedIncomeSources?.length || 0
        });
    } catch (error) {
        console.error("❌ Error creating household from statement:", error);
        res.status(500).json({ error: "Failed to create household" });
    } finally {
        await session.close();
    }
});

module.exports = router;
