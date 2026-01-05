/**
 * Debug script to check what household IDs are stored in Neo4j
 * Run: node scripts/check-neo4j-ids.js
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');
const { hashIdentifier } = require('../utils/hashService');

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

async function checkIds() {
    const session = driver.session();

    try {
        console.log('\n=== HASH_SALT Check ===');
        console.log('HASH_SALT is set:', !!process.env.HASH_SALT);

        console.log('\n=== Testing H4 hash ===');
        const h4Hash = hashIdentifier('H4');
        console.log(`H4 -> ${h4Hash}`);

        console.log('\n=== Households in Neo4j ===');
        const households = await session.run('MATCH (h:Household) RETURN h.id AS id');

        if (households.records.length === 0) {
            console.log('NO HOUSEHOLDS FOUND IN DATABASE!');
        } else {
            households.records.forEach(r => {
                const id = r.get('id');
                console.log(`  ${id}`);
                if (id === h4Hash) {
                    console.log('    ^ This matches H4 hash!');
                }
            });
        }

        console.log('\n=== Persons in Neo4j ===');
        const persons = await session.run('MATCH (p:Person) RETURN p.id AS id LIMIT 10');

        if (persons.records.length === 0) {
            console.log('NO PERSONS FOUND IN DATABASE!');
        } else {
            persons.records.forEach(r => {
                console.log(`  ${r.get('id')}`);
            });
        }

    } finally {
        await session.close();
        await driver.close();
    }
}

checkIds().catch(console.error);
