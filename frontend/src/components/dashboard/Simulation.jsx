import { useState } from 'react';
import api from '../../services/api';

const Simulation = ({ householdId, members }) => {
    const [selectedMember, setSelectedMember] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const memberList = members.map(member => {
        if (typeof member === 'string') return { id: member, role: '' };
        return {
            id: member.id || member.name || member,
            role: member.role || ''
        };
    });

    const handleSimulate = async () => {
        if (!selectedMember) {
            setError('Please select a member to simulate income loss');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.simulateRisk(householdId, selectedMember);
            setResult(data);
        } catch (err) {
            setError(err.message || 'Simulation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (impact) => {
        if (!impact) return 'status-medium';
        const upperImpact = impact.toUpperCase();
        if (upperImpact === 'CATASTROPHIC' || upperImpact === 'SEVERE' || upperImpact === 'HIGH') return 'status-high';
        if (upperImpact === 'MEDIUM' || upperImpact === 'MODERATE') return 'status-medium';
        return 'status-low';
    };

    return (
        <div className="dashboard-section">
            <h2 className="section-header">What-If Scenario Simulation</h2>
            <div className="section-content">
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Simulate the impact of income loss for a household member to assess financial vulnerability:
                </p>

                <form className="dashboard-form" onSubmit={(e) => { e.preventDefault(); handleSimulate(); }}>
                    <div className="form-group">
                        <label htmlFor="member-select" className="form-label">
                            Select Household Member
                        </label>
                        {memberList.length > 0 ? (
                            <select
                                id="member-select"
                                className="form-select"
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">-- Select a member --</option>
                                {memberList.map((member, index) => {
                                    const isApplicant = member.is_applicant || (typeof member === 'object' && member.is_applicant);
                                    return (
                                        <option
                                            key={index}
                                            value={member.id}
                                            style={isApplicant ? { fontWeight: 'bold', backgroundColor: '#e3f2fd' } : {}}
                                        >
                                            {isApplicant ? '★ ' : ''}{member.id} {member.role ? `(${member.role})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <input
                                type="text"
                                id="member-select"
                                className="form-input"
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                                placeholder="Enter member ID (e.g., H4_E1)"
                                disabled={loading}
                            />
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="form-button"
                            disabled={loading || !selectedMember}
                        >
                            {loading ? 'Running Simulation...' : 'Run Simulation'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger)', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                            Simulation Results
                        </h3>
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Scenario</th>
                                    <th>Fragility Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Before Income Loss</strong></td>
                                    <td>{typeof result.before === 'number' ? result.before.toFixed(2) : result.before}</td>
                                </tr>
                                <tr>
                                    <td><strong>After Income Loss</strong></td>
                                    <td>{typeof result.after === 'number' ? result.after.toFixed(2) : result.after}</td>
                                </tr>
                            </tbody>
                        </table>
                        {result.impact && (
                            <div style={{ marginTop: '16px' }}>
                                <strong style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Impact Assessment: </strong>
                                <span className={`status-badge ${getStatusClass(result.impact)}`} style={{ marginLeft: '8px' }}>
                                    {result.impact}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulation;
