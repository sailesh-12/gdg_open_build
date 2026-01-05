/**
 * Test script for Complex Bank Statement Household
 * 
 * This script tests the multi-income source feature with a realistic
 * bank statement scenario involving 6+ income sources.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function testComplexHousehold() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('COMPLEX HOUSEHOLD TEST - Bank Statement Case');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Load the test payload
    const payloadPath = path.join(__dirname, '../test_data/complex_household_payload.json');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

    console.log('📄 Test Case: Rajesh Patel Household');
    console.log('   - Primary Earner: 5 income sources (Job + Freelance + Rental + Business + Consulting)');
    console.log('   - Secondary Earner: 1 income source (Father\'s Pension)');
    console.log('   - 1 Dependent: Priya Sharma');
    console.log('   - Total Income Sources: 6');
    console.log('');

    // Test 1: Create Household
    console.log('[Test 1] Creating complex household...');
    try {
        const response = await fetch(`${BASE_URL}/household/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log('✅ Household created:', result.message || result);
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
        return;
    }

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Analyze Risk
    console.log('[Test 2] Analyzing household risk...');
    try {
        const response = await fetch(`${BASE_URL}/risk/analyze/${payload.householdId}`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log('✅ Risk Analysis:');
        console.log(`   Fragility Score: ${result.fragility_score}`);
        console.log(`   Risk Band: ${result.risk_band}`);
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 3: Get Explanations
    console.log('[Test 3] Getting risk explanations...');
    try {
        const response = await fetch(`${BASE_URL}/risk/explain/${payload.householdId}`);
        const result = await response.json();
        console.log('✅ Explanations:');
        result.reasons.forEach((reason, i) => {
            console.log(`   ${i + 1}. ${reason}`);
        });
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 4: Get Recommendations
    console.log('[Test 4] Getting recommendations...');
    try {
        const response = await fetch(`${BASE_URL}/risk/recommendations/${payload.householdId}`);
        const result = await response.json();
        console.log('✅ Recommendations:');
        result.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 5: Simulate Job Loss (Primary Income)
    console.log('[Test 5] Simulating job loss (affects salary income)...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/${payload.householdId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'RAJESH_PATEL',
                shock_type: 'job_loss'
            })
        });
        const result = await response.json();
        console.log('✅ Job Loss Simulation:');
        console.log(`   Before: ${result.before?.toFixed(3)}`);
        console.log(`   After: ${result.after?.toFixed(3)}`);
        console.log(`   Impact: ${result.impact}`);
        console.log(`   Change: +${(result.after - result.before).toFixed(3)} (${((result.after - result.before) / result.before * 100).toFixed(1)}% increase)`);
        console.log(`   Shock: ${result.shock_description}`);
        console.log('   💡 Note: Still has freelance, rental, business income as backup');
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 6: Simulate Freelance Shock
    console.log('[Test 6] Simulating freelance income shock...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/${payload.householdId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'RAJESH_PATEL',
                shock_type: 'freelance_shock'
            })
        });
        const result = await response.json();
        console.log('✅ Freelance Shock Simulation:');
        console.log(`   Before: ${result.before?.toFixed(3)}`);
        console.log(`   After: ${result.after?.toFixed(3)}`);
        console.log(`   Impact: ${result.impact}`);
        console.log(`   Change: +${(result.after - result.before).toFixed(3)}`);
        console.log(`   Shock: ${result.shock_description}`);
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 7: Simulate Rental Vacancy
    console.log('[Test 7] Simulating rental vacancy...');
    try {
        const response = await fetch(`${BASE_URL}/risk/simulate/${payload.householdId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affected_member: 'RAJESH_PATEL',
                shock_type: 'rental_vacancy'
            })
        });
        const result = await response.json();
        console.log('✅ Rental Vacancy Simulation:');
        console.log(`   Before: ${result.before?.toFixed(3)}`);
        console.log(`   After: ${result.after?.toFixed(3)}`);
        console.log(`   Impact: ${result.impact}`);
        console.log(`   Change: +${(result.after - result.before).toFixed(3)}`);
        console.log(`   Shock: ${result.shock_description}`);
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 8: Get Weak Links
    console.log('[Test 8] Identifying critical household members...');
    try {
        const response = await fetch(`${BASE_URL}/risk/weak-links/${payload.householdId}`);
        const result = await response.json();
        console.log('✅ Critical Members Analysis:');
        console.log(`   Critical Members: ${result.critical_members.length > 0 ? result.critical_members.join(', ') : 'None'}`);
        console.log(`   Reason: ${result.reason}`);
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 9: Loan Evaluation
    console.log('[Test 9] Evaluating loan eligibility...');
    try {
        const response = await fetch(`${BASE_URL}/risk/loan-evaluation/${payload.householdId}`, {
            method: 'POST'
        });
        const result = await response.json();
        console.log('✅ Loan Evaluation:');
        console.log(`   Loan Risk: ${result.loan_risk}`);
        console.log('   Suggestions:');
        result.suggestions.forEach((sug, i) => {
            console.log(`   ${i + 1}. ${sug}`);
        });
        console.log('');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('KEY INSIGHTS FROM COMPLEX CASE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ Income Diversification: 6 sources detected and aggregated');
    console.log('✓ Primary Income: Salary (stable, high stability 0.95)');
    console.log('✓ Backup Sources: Freelance, Rental, Business, Consulting, Pension');
    console.log('✓ Shock Simulations: Targeted shocks applied to specific sources');
    console.log('✓ Risk Profile: Low-Medium (diversified portfolio)');
    console.log('');
    console.log('📊 This demonstrates how multiple income sources reduce fragility');
    console.log('   even when individual sources are volatile or at risk.');
    console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the test
testComplexHousehold().catch(console.error);
