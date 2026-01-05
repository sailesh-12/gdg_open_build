/**
 * Utility functions for formatting display values
 */

/**
 * Truncate a hash ID for display purposes
 * Shows first 8 characters with optional ellipsis
 * 
 * @param {string} id - The full ID (possibly a 64-char hash)
 * @param {number} length - Number of characters to show (default: 8)
 * @returns {string} - Truncated ID for display
 */
export function formatId(id, length = 8) {
    if (!id) return 'N/A';
    if (typeof id !== 'string') id = String(id);

    // If it looks like a hash (64 hex chars), truncate it
    if (id.length === 64 && /^[a-f0-9]+$/i.test(id)) {
        return `${id.substring(0, length)}…`;
    }

    // Otherwise return as-is
    return id;
}

/**
 * Check if an ID looks like a hash
 * @param {string} id 
 * @returns {boolean}
 */
export function isHashedId(id) {
    return id && typeof id === 'string' && id.length === 64 && /^[a-f0-9]+$/i.test(id);
}
