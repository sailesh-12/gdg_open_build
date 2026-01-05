/**
 * Cleanup script to delete all households and persons in Neo4j
 * Run: node scripts/cleanup-all-data.js
 * 
 * WARNING: This will delete ALL data. Use only for development/testing.
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

async function cleanup() {
    const session = driver.session();

    try {
        console.log('\n=== Cleaning up Neo4j ===\n');

        // Count before deletion
        const beforeHouseholds = await session.run('MATCH (h:Household) RETURN count(h) AS count');
        const beforePersons = await session.run('MATCH (p:Person) RETURN count(p) AS count');

        console.log(`Found ${beforeHouseholds.records[0].get('count')} households`);
        console.log(`Found ${beforePersons.records[0].get('count')} persons`);

        // Delete all
        await session.run('MATCH (h:Household) DETACH DELETE h');
        await session.run('MATCH (p:Person) DETACH DELETE p');

        console.log('\n✅ All data deleted!\n');
        console.log('You can now create fresh households with the current HASH_SALT.');

    } finally {
        await session.close();
        await driver.close();
    }
}

cleanup().catch(console.error);
