require('dotenv').config();
const neo4j = require('neo4j-driver');

// Test connection to Neo4j (works with both local and Aura)
async function testConnection() {
    console.log('=== Testing Neo4j Connection ===\n');
    console.log('Using configuration:');
    console.log(`URI: ${process.env.NEO4J_URI}`);
    console.log(`USER: ${process.env.NEO4J_USER}`);
    console.log(`PASSWORD: ${process.env.NEO4J_PASSWORD ? '***' + process.env.NEO4J_PASSWORD.slice(-4) : 'NOT SET'}\n`);

    const driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );

    try {
        console.log('Attempting to connect...');
        await driver.verifyConnectivity();
        console.log('✓ Successfully connected to Neo4j!\n');

        const session = driver.session();

        // Test query
        const result = await session.run(`
            MATCH (n) 
            RETURN labels(n)[0] as label, count(n) as count
            ORDER BY count DESC
        `);

        console.log('Database contents:');
        if (result.records.length === 0) {
            console.log('  ⚠ Database is empty!');
        } else {
            result.records.forEach(rec => {
                console.log(`  ${rec.get('label')}: ${rec.get('count').toNumber()}`);
            });
        }

        await session.close();
        await driver.close();

        console.log('\n✓ Connection test passed!');

    } catch (error) {
        console.error('\n✗ Connection failed!');
        console.error('Error:', error.message);
        console.error('\nCommon issues:');
        console.error('1. Wrong password or username');
        console.error('2. Wrong URI format (should be neo4j+s:// for Aura)');
        console.error('3. Neo4j instance is not running');
        console.error('4. Network connectivity issues');
        await driver.close();
        process.exit(1);
    }
}

testConnection();
