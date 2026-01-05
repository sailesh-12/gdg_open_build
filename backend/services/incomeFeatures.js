/**
 * Income Feature Aggregation Service
 * 
 * Handles aggregation of multiple income sources into single metrics
 * for ML feature extraction while maintaining backward compatibility.
 */

/**
 * Calculate average income stability across all sources
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} Average stability (0.0 - 1.0)
 */
function calculateAvgIncomeStability(incomeSources) {
    if (!incomeSources || !Array.isArray(incomeSources) || incomeSources.length === 0) {
        return 0.5; // Default fallback
    }

    const sum = incomeSources.reduce((acc, src) => acc + (src.stability || 0.5), 0);
    return sum / incomeSources.length;
}

/**
 * Calculate income diversification score
 * Higher score = more concentrated (single source)
 * Lower score = more diversified (multiple sources)
 * 
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} Diversification score (0.0 - 1.0)
 */
function calculateIncomeDiversification(incomeSources) {
    if (!incomeSources || !Array.isArray(incomeSources) || incomeSources.length === 0) {
        return 0; // No sources = no diversification
    }

    // Returns 1.0 for single source, 0.5 for 2 sources, 0.33 for 3, etc.
    return 1 / incomeSources.length;
}

/**
 * Calculate primary income risk (1 - primary source stability)
 * Higher value = higher risk
 * 
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} Primary income risk (0.0 - 1.0)
 */
function calculatePrimaryIncomeRisk(incomeSources) {
    if (!incomeSources || !Array.isArray(incomeSources) || incomeSources.length === 0) {
        return 0.5; // Default risk
    }

    // Find the primary income source
    const primary = incomeSources.find(src => src.is_primary === true);

    if (primary) {
        return 1 - (primary.stability || 0.5);
    }

    // If no primary marked, use the most stable as implicit primary
    const mostStable = incomeSources.reduce((max, src) =>
        (src.stability || 0) > (max.stability || 0) ? src : max
        , incomeSources[0]);

    return 1 - (mostStable.stability || 0.5);
}

/**
 * Get maximum volatility across all sources
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} Maximum volatility (0.0 - 1.0)
 */
function calculateMaxIncomeVolatility(incomeSources) {
    if (!incomeSources || !Array.isArray(incomeSources) || incomeSources.length === 0) {
        return 0.5; // Default volatility
    }

    return Math.max(...incomeSources.map(src => src.volatility || 0.5));
}

/**
 * Aggregate all income features for a member
 * This is the main function called before ML feature extraction
 * 
 * @param {Object} member - Member object with optional income_sources array
 * @returns {Object} Aggregated income features
 */
function aggregateIncomeFeatures(member) {
    // Check if member has new multi-source income data
    if (member.income_sources && Array.isArray(member.income_sources) && member.income_sources.length > 0) {
        return {
            avg_income_stability: calculateAvgIncomeStability(member.income_sources),
            income_diversification: calculateIncomeDiversification(member.income_sources),
            primary_income_risk: calculatePrimaryIncomeRisk(member.income_sources),
            max_income_volatility: calculateMaxIncomeVolatility(member.income_sources),
            has_multiple_sources: member.income_sources.length > 1,
            num_income_sources: member.income_sources.length
        };
    } else {
        // Backward compatible fallback: use legacy income_stability field
        const stability = member.income_stability !== undefined ? member.income_stability : 0.5;
        return {
            avg_income_stability: stability,
            income_diversification: 0, // Single implicit source
            primary_income_risk: 1 - stability,
            max_income_volatility: 0.5, // Assume moderate volatility
            has_multiple_sources: false,
            num_income_sources: stability > 0 ? 1 : 0 // 0 if no income
        };
    }
}

/**
 * Apply income shock simulation to income sources
 * @param {Array} incomeSources - Original income sources
 * @param {string} shockType - Type of shock (job_loss, freelance_shock, rental_vacancy)
 * @returns {Array} Modified income sources after shock
 */
function applyIncomeShock(incomeSources, shockType) {
    if (!incomeSources || !Array.isArray(incomeSources)) {
        return [];
    }

    switch (shockType) {
        case 'job_loss':
            // Disable all job-type income sources
            return incomeSources.map(src =>
                src.type === 'job'
                    ? { ...src, stability: 0, volatility: 1.0 }
                    : src
            );

        case 'freelance_shock':
            // Reduce freelance stability by 40%
            return incomeSources.map(src =>
                src.type === 'freelance'
                    ? { ...src, stability: Math.max(0, src.stability * 0.6), volatility: Math.min(1.0, (src.volatility || 0.5) + 0.3) }
                    : src
            );

        case 'rental_vacancy':
            // Set rental volatility to maximum
            return incomeSources.map(src =>
                src.type === 'rental'
                    ? { ...src, volatility: 1.0, stability: Math.max(0, src.stability * 0.5) }
                    : src
            );

        default:
            return incomeSources;
    }
}

/**
 * Get human-readable income insights for explanations
 * @param {Object} incomeFeatures - Aggregated income features
 * @returns {Array<string>} Array of insight strings
 */
function getIncomeInsights(incomeFeatures) {
    const insights = [];

    if (incomeFeatures.has_multiple_sources) {
        if (incomeFeatures.income_diversification < 0.5) {
            insights.push("Risk reduced due to diversified income sources");
        } else if (incomeFeatures.income_diversification === 0.5) {
            insights.push("Moderate income diversification from dual sources");
        }
    }

    if (incomeFeatures.primary_income_risk > 0.7) {
        insights.push("High fragility due to dependence on a single primary income");
    }

    if (incomeFeatures.max_income_volatility > 0.8) {
        insights.push("High income volatility increases financial stress");
    }

    if (incomeFeatures.avg_income_stability < 0.3) {
        insights.push("Low average income stability increases vulnerability");
    }

    return insights;
}

module.exports = {
    calculateAvgIncomeStability,
    calculateIncomeDiversification,
    calculatePrimaryIncomeRisk,
    calculateMaxIncomeVolatility,
    aggregateIncomeFeatures,
    applyIncomeShock,
    getIncomeInsights
};
