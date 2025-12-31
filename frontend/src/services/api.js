const API_BASE_URL = 'http://localhost:5000';

export const api = {
    // Get risk summary for a household
    async getRiskSummary(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/summary/${householdId}`);
        if (!response.ok) {
            throw new Error('Household not found');
        }
        return response.json();
    },

    // Get risk explanation
    async getRiskExplanation(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/explain/${householdId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch risk explanation');
        }
        return response.json();
    },

    // Get weak links / critical members
    async getWeakLinks(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/weak-links/${householdId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch weak links');
        }
        return response.json();
    },

    // Get full analysis with all members (for simulation dropdown)
    async getFullAnalysis(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/analyze/${householdId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch analysis');
        }
        return response.json();
    },

    // Simulate income loss
    async simulateRisk(householdId, affectedMember) {
        const response = await fetch(`${API_BASE_URL}/risk/simulate/${householdId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ affected_member: affectedMember }),
        });
        if (!response.ok) {
            throw new Error('Simulation failed');
        }
        return response.json();
    },

    // Get recommendations
    async getRecommendations(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/recommendations/${householdId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }
        return response.json();
    },

    // Get loan evaluation
    async getLoanEvaluation(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/loan-evaluation/${householdId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch loan evaluation');
        }
        return response.json();
    },

    // Create a new household
    async createHousehold(householdData) {
        const response = await fetch(`${API_BASE_URL}/household/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(householdData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create household');
        }
        return response.json();
    },

    // Delete a household
    async deleteHousehold(householdId) {
        const response = await fetch(`${API_BASE_URL}/household/${householdId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete household');
        }
        return response.json();
    },

    // Get graph data for visualization
    async getGraphData(householdId) {
        const response = await fetch(`${API_BASE_URL}/risk/graph-data/${householdId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch graph data');
        }
        return response.json();
    },
};

export default api;
