const neo4j = require('neo4j-driver');
require('dotenv').config();

// Local Neo4j connection
const LOCAL_URI = 'neo4j://127.0.0.1:7687';
const LOCAL_USER = 'neo4j';
const LOCAL_PASSWORD = 'Lastminute';

async function exportData() {
    console.log('Connecting to local Neo4j...');
    const driver = neo4j.driver(LOCAL_URI, neo4j.auth.basic(LOCAL_USER, LOCAL_PASSWORD));

    try {
        await driver.verifyConnectivity();
        console.log('✓ Connected to local Neo4j!\n');

        const session = driver.session();

        // Get all node counts
        console.log('=== DATABASE SUMMARY ===\n');
        const countResult = await session.run(`
            MATCH (n) 
            RETURN labels(n)[0] as label, count(n) as count
            ORDER BY count DESC
        `);

        if (countResult.records.length === 0) {
            console.log('⚠ No data found in database!');
            await session.close();
            await driver.close();
            return;
        }

        console.log('Nodes:');
        countResult.records.forEach(rec => {
            console.log(`  ${rec.get('label')}: ${rec.get('count').toNumber()}`);
        });

        // Get relationship counts
        const relResult = await session.run(`
            MATCH ()-[r]->() 
            RETURN type(r) as type, count(r) as count
            ORDER BY count DESC
        `);

        console.log('\nRelationships:');
        if (relResult.records.length === 0) {
            console.log('  (none)');
        } else {
            relResult.records.forEach(rec => {
                console.log(`  ${rec.get('type')}: ${rec.get('count').toNumber()}`);
            });
        }

        // Export all nodes as Cypher statements
        console.log('\n=== GENERATING CYPHER EXPORT ===\n');

        const allNodes = await session.run(`
            MATCH (n)
            RETURN labels(n) as labels, properties(n) as props, elementId(n) as id
        `);

        const allRels = await session.run(`
            MATCH (a)-[r]->(b)
            RETURN elementId(a) as fromId, elementId(b) as toId, type(r) as type, properties(r) as props
        `);

        // Generate Cypher
        let cypher = '// === NODES ===\n';
        const idMap = new Map();

        allNodes.records.forEach((rec, idx) => {
            const labels = rec.get('labels').join(':');
            const props = rec.get('props');
            const id = rec.get('id');
            idMap.set(id, `n${idx}`);

            const propsStr = JSON.stringify(props).replace(/"/g, "'").replace(/'/g, '"');
            cypher += `CREATE (n${idx}:${labels} ${propsStr});\n`;
        });

        cypher += '\n// === RELATIONSHIPS ===\n';
        allRels.records.forEach(rec => {
            const fromVar = idMap.get(rec.get('fromId'));
            const toVar = idMap.get(rec.get('toId'));
            const type = rec.get('type');
            const props = rec.get('props');

            if (fromVar && toVar) {
                const propsStr = Object.keys(props).length > 0
                    ? ` ${JSON.stringify(props).replace(/"/g, "'").replace(/'/g, '"')}`
                    : '';
                cypher += `MATCH (a), (b) WHERE elementId(a) = '${rec.get('fromId')}' AND elementId(b) = '${rec.get('toId')}' CREATE (a)-[:${type}${propsStr}]->(b);\n`;
            }
        });

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const exportPath = path.join(__dirname, 'neo4j-export.cypher');
        fs.writeFileSync(exportPath, cypher);

        console.log(`✓ Export saved to: ${exportPath}`);
        console.log(`  Total: ${allNodes.records.length} nodes, ${allRels.records.length} relationships`);
        console.log('\n=== NEXT STEPS ===');
        console.log('1. Open Neo4j Aura console: https://console.neo4j.io');
        console.log('2. Click "Query" on your instance');
        console.log('3. Copy and run the Cypher from neo4j-export.cypher');

        await session.close();
        await driver.close();

    } catch (error) {
        console.error('Error:', error.message);
        await driver.close();
    }
}

exportData();
