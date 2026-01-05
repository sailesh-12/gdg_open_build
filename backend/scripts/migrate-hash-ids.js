/**
 * Migration Script: Hash Existing Neo4j Identifiers
 * 
 * This script updates all existing Household and Person IDs in Neo4j
 * from plaintext to SHA-256 hashed values.
 * 
 * Run once after implementing hashed identifiers:
 *   node scripts/migrate-hash-ids.js
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');
const { hashIdentifier } = require('../utils/hashService');

// Neo4j connection
const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

async function migrateHouseholdIds() {
    const session = driver.session();

    try {
        console.log('🔄 Migrating Household IDs...');

        // Get all households
        const result = await session.run('MATCH (h:Household) RETURN h.id AS id');
        const households = result.records.map(r => r.get('id'));

        console.log(`   Found ${households.length} households to migrate`);

        for (const oldId of households) {
            // Skip if already looks like a hash (64 hex chars)
            if (oldId && oldId.length === 64 && /^[a-f0-9]+$/.test(oldId)) {
                console.log(`   ⏭️  Skipping ${oldId.substring(0, 8)}... (already hashed)`);
                continue;
            }

            const newId = hashIdentifier(oldId);

            await session.run(
                'MATCH (h:Household {id: $oldId}) SET h.id = $newId',
                { oldId, newId }
            );

            console.log(`   ✅ ${oldId} → ${newId.substring(0, 16)}...`);
        }

        console.log('✅ Household migration complete\n');
    } finally {
        await session.close();
    }
}

async function migratePersonIds() {
    const session = driver.session();

    try {
        console.log('🔄 Migrating Person IDs...');

        // Get all persons
        const result = await session.run('MATCH (p:Person) RETURN p.id AS id');
        const persons = result.records.map(r => r.get('id'));

        console.log(`   Found ${persons.length} persons to migrate`);

        for (const oldId of persons) {
            // Skip if already looks like a hash (64 hex chars)
            if (oldId && oldId.length === 64 && /^[a-f0-9]+$/.test(oldId)) {
                console.log(`   ⏭️  Skipping ${oldId.substring(0, 8)}... (already hashed)`);
                continue;
            }

            const newId = hashIdentifier(oldId);

            await session.run(
                'MATCH (p:Person {id: $oldId}) SET p.id = $newId',
                { oldId, newId }
            );

            console.log(`   ✅ ${oldId} → ${newId.substring(0, 16)}...`);
        }

        console.log('✅ Person migration complete\n');
    } finally {
        await session.close();
    }
}

async function main() {
    console.log('\n========================================');
    console.log('  Neo4j ID Hashing Migration');
    console.log('========================================\n');

    if (!process.env.HASH_SALT || process.env.HASH_SALT === 'default-dev-salt-change-in-production') {
        console.error('⚠️  WARNING: Using default HASH_SALT. Set HASH_SALT in .env for production!');
    }

    try {
        await migrateHouseholdIds();
        await migratePersonIds();

        console.log('🎉 Migration completed successfully!');
        console.log('   All IDs are now hashed in Neo4j.\n');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await driver.close();
    }
}

main();
