/**
 * Hash Service - Provides SHA-256 hashing for sensitive identifiers
 * 
 * This module hashes householdId, person.id, and other sensitive identifiers
 * using a server-side salt for security. The hashing is:
 * - Deterministic (same input always produces same output)
 * - One-way (cannot be reversed)
 * - Salted (unique to this deployment)
 */

const crypto = require('crypto');

// Server-side salt - MUST be set in production via environment variable
const SALT = process.env.HASH_SALT || 'default-dev-salt-change-in-production';

/**
 * Hash a single identifier using SHA-256 with salt
 * @param {string|number} identifier - The identifier to hash
 * @returns {string|null} - 64-character hex hash, or null/undefined if input is falsy
 */
function hashIdentifier(identifier) {
    if (!identifier && identifier !== 0) return identifier;

    return crypto
        .createHash('sha256')
        .update(SALT + String(identifier))
        .digest('hex');
}

/**
 * Hash all member IDs in an array
 * @param {Array} members - Array of member objects with 'id' property
 * @returns {Array} - Members with hashed IDs, other properties preserved
 */
function hashMembers(members) {
    if (!members || !Array.isArray(members)) return members;

    return members.map(member => ({
        ...member,
        id: hashIdentifier(member.id)
    }));
}

/**
 * Hash support relationship IDs (from/to)
 * @param {Array} supports - Array of support objects with 'from' and 'to' properties
 * @returns {Array} - Supports with hashed from/to IDs, strength preserved
 */
function hashSupports(supports) {
    if (!supports || !Array.isArray(supports)) return supports;

    return supports.map(support => ({
        ...support,
        from: hashIdentifier(support.from),
        to: hashIdentifier(support.to)
    }));
}

module.exports = {
    hashIdentifier,
    hashMembers,
    hashSupports
};
