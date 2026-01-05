/**
 * Test script for Multiple Income Sources Feature
 * 
 * Run this script to validate:
 * 1. Backward compatibility with legacy households
 * 2. New multi-source income households
 * 3. Income shock simulations
 * 4. Enhanced explanations
 */

const BASE_URL = 'http://localhost:5000';

// Test Case 1: Legacy Household (Backward Compatibility)
const legacyHousehold = {
    householdId: 'TEST_LEGACY',
    members: [
        {
            id: 'E1',
            role: 'earner',
            income_stability: 0.7,
            is_applicant: true
        },
        {
            id: 'D1',
            role: 'dependent'
        }
    ],
    supports: [
        {
            from: 'E1',
            to: 'D1',
            strength: 0.8
        }
    ]
};

// Test Case 2: Multi-Source Income Household
const multiSourceHousehold = {
    householdId: 'TEST_MULTI',
    members: [
        {
            id: 'E1',
            role: 'earner',
            is_applicant: true,
            income_sources: [
                {
                    type: 'job',
                    stability: 0.9,
                    volatility: 0.1,
                    is_primary: true,
                    amount_band: 'high'
                },
                {
                    type: 'freelance',
                    stability: 0.5,
                    volatility: 0.6,
                    is_primary: false,
                    amount_band: 'medium'
                },
                {
                    type: 'rental',
                    stability: 0.7,
                    volatility: 0.3,
                    is_primary: false,
                    amount_band: 'low'
                }
            ]
        },
        {
            id: 'D1',
            role: 'dependent'
        }
    ],
    supports: [
        {
            from: 'E1',
            to: 'D1',
            strength: 0.8
        }
    ]
};

async function runTests() {
    console.log('='.repeat(60));
    console.log('MULTIPLE INCOME SOURCES - TEST SUITE');
    console.log('='.repeat(60));

    // Test 1: Create Legacy Household
    console.log('\n[Test 1] Creating legacy household...');
    try {
        const response = await fetch(`${BASE_URL}/household/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(legacyHousehold)
        });
        const result = await response.json();
        console.log('✅ Legacy household created:', result);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 2: Analyze Legacy Household
    console.log('\n[Test 2] Analyzing legacy household...');
    try {
        const response = await fetch(`${BASE_URL}/risk/analyze/TEST_LEGACY`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log('✅ Risk analysis:', {
            fragility_score: result.fragility_score,
            risk_band: result.risk_band
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 3: Create Multi-Source Household
    console.log('\n[Test 3] Creating multi-source household...');
    try {
        const response = await fetch(`${BASE_URL}/household/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(multiSourceHousehold)
        });
        const result = await response.json();
        console.log('✅ Multi-source household created:', result);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 4: Analyze Multi-Source Household
    console.log('\n[Test 4] Analyzing multi-source household...');
    try {
        const response = await fetch(`${BASE_URL}/risk/analyze/TEST_MULTI`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log('✅ Risk analysis:', {
            fragility_score: result.fragility_score,
            risk_band: result.risk_band
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 5: Get Explanations
    console.log('\n[Test 5] Getting explanations for multi-source household...');
    try {
        const response = await fetch(`${BASE_URL}/risk/explain/TEST_MULTI`);
        const result = await response.json();
        console.log('✅ Explanations:', result.reasons);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 6: Get Recommendations
    console.log('\n[Test 6] Getting recommendations...');
    try {
        const response = await fetch(`${BASE_URL}/risk/recommendations/TEST_MULTI`);
        const result = await response.json();
        console.log('✅ Recommendations:', result.recommendations);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 7: Simulate Job Loss
    console.log('\n[Test 7] Simulating job loss...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/TEST_MULTI`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'E1',
                shock_type: 'job_loss'
            })
        });
        const result = await response.json();
        console.log('✅ Simulation result:', {
            before: result.before,
            after: result.after,
            impact: result.impact,
            shock_description: result.shock_description
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 8: Simulate Freelance Shock
    console.log('\n[Test 8] Simulating freelance shock...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/TEST_MULTI`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'E1',
                shock_type: 'freelance_shock'
            })
        });
        const result = await response.json();
        console.log('✅ Simulation result:', {
            before: result.before,
            after: result.after,
            impact: result.impact,
            shock_description: result.shock_description
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 9: Simulate Rental Vacancy
    console.log('\n[Test 9] Simulating rental vacancy...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/TEST_MULTI`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'E1',
                shock_type: 'rental_vacancy'
            })
        });
        const result = await response.json();
        console.log('✅ Simulation result:', {
            before: result.before,
            after: result.after,
            impact: result.impact,
            shock_description: result.shock_description
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 10: Legacy Simulation (Backward Compatibility)
    console.log('\n[Test 10] Legacy simulation (member loss) on legacy household...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/TEST_LEGACY`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'E1'
                // No shock_type - should use legacy behavior
            })
        });
        const result = await response.json();
        console.log('✅ Legacy simulation:', {
            before: result.before,
            after: result.after,
            impact: result.impact
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE COMPLETE');
    console.log('='.repeat(60));
}

// Run tests
runTests();
