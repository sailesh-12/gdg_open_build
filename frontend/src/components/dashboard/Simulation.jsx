import { useState } from 'react';
import api from '../../services/api';
import { formatId } from '../../utils/formatId';

const Simulation = ({ householdId, members }) => {
    const [selectedMember, setSelectedMember] = useState('');
    const [shockType, setShockType] = useState('member_loss'); // NEW: Shock type selector
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Filter members to only include earners and applicants (only they have income to lose)
    const memberList = members
        .map(member => {
            if (typeof member === 'string') return { id: member, role: '', is_applicant: false };
            return {
                id: member.id || member.name || member,
                role: member.role || '',
                is_applicant: member.is_applicant || false
            };
        })
        .filter(member => member.role === 'earner' || member.is_applicant);

    const shockTypes = [
        { value: 'member_loss', label: '💔 Complete Income Loss', description: 'Member completely loses all income' },
        { value: 'job_loss', label: '💼 Job Loss (Stable Income)', description: 'Loss of job/salary income only' },
        { value: 'freelance_shock', label: '💻 Freelance Shock (Irregular Income)', description: '50% reduction in freelance income' },
        { value: 'rental_vacancy', label: '🏠 Rental Income Loss', description: 'Loss of rental property income' },
        { value: 'business_downturn', label: '📉 Business Downturn', description: '40% reduction in business income' },
        { value: 'pension_cut', label: '👴 Pension Reduction', description: '30% cut in pension income' }
    ];

    const handleSimulate = async () => {
        if (!selectedMember) {
            setError('Please select a member to simulate income loss');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.simulateRisk(householdId, selectedMember, shockType); // Pass shock type
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
                            <>
                                <select
                                    id="member-select"
                                    className="form-select"
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">-- Select a member --</option>
                                    {memberList.map((member, index) => {
                                        const isApplicant = member.is_applicant;
                                        const isHashed = member.id?.length === 64;
                                        return (
                                            <option
                                                key={index}
                                                value={member.id}
                                                title={isHashed ? `Full Hash: ${member.id}` : member.id}
                                                style={isApplicant ? { fontWeight: 'bold', backgroundColor: '#e3f2fd' } : {}}
                                            >
                                                {isApplicant ? '★ ' : ''}{formatId(member.id)} {member.role ? `(${member.role})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Member Hash Details */}
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px 16px',
                                    backgroundColor: 'var(--color-bg-secondary, #f8f9fa)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border, #e9ecef)'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: 'var(--color-text-secondary, #6c757d)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '10px'
                                    }}>
                                        Member ID & Hash Reference
                                    </div>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {memberList.map((member, index) => {
                                            const isHashed = member.id?.length === 64;
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 0',
                                                        borderBottom: index < memberList.length - 1 ? '1px solid var(--color-border, #e9ecef)' : 'none',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <span style={{
                                                        fontWeight: '500',
                                                        color: member.is_applicant ? '#1976d2' : 'var(--color-text-primary, #212529)'
                                                    }}>
                                                        {member.is_applicant ? '★ ' : ''}{formatId(member.id, 12)}
                                                        <span style={{
                                                            marginLeft: '6px',
                                                            fontSize: '11px',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: member.role === 'earner' ? '#e8f5e9' : '#fff3e0',
                                                            color: member.role === 'earner' ? '#2e7d32' : '#e65100'
                                                        }}>
                                                            {member.role || 'member'}
                                                        </span>
                                                    </span>
                                                    {isHashed && (
                                                        <code style={{
                                                            fontSize: '10px',
                                                            color: '#6c757d',
                                                            backgroundColor: '#e9ecef',
                                                            padding: '2px 6px',
                                                            borderRadius: '3px',
                                                            fontFamily: 'monospace',
                                                            marginLeft: '8px'
                                                        }}>
                                                            {member.id.substring(0, 8)}...{member.id.substring(56)}
                                                        </code>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
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

                    {/* NEW: Shock Type Selector */}
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label htmlFor="shock-type-select" className="form-label">
                            Select Stress Scenario
                        </label>
                        <select
                            id="shock-type-select"
                            className="form-select"
                            value={shockType}
                            onChange={(e) => setShockType(e.target.value)}
                            disabled={loading}
                        >
                            {shockTypes.map((shock) => (
                                <option key={shock.value} value={shock.value}>
                                    {shock.label}
                                </option>
                            ))}
                        </select>
                        {/* Show description of selected shock type */}
                        <p style={{
                            marginTop: '8px',
                            fontSize: '13px',
                            color: 'var(--color-text-secondary)',
                            fontStyle: 'italic'
                        }}>
                            {shockTypes.find(s => s.value === shockType)?.description}
                        </p>
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
                    <div style={{
                        marginTop: '16px',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.08) 0%, rgba(220, 53, 69, 0.04) 100%)',
                        borderLeft: '4px solid #dc3545',
                        borderRadius: '0 8px 8px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.1)'
                    }}>
                        <span style={{
                            fontSize: '18px',
                            color: '#dc3545',
                            marginTop: '1px'
                        }}>⚠</span>
                        <div>
                            <div style={{
                                fontWeight: '600',
                                color: '#dc3545',
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>
                                Analysis Error
                            </div>
                            <div style={{
                                color: '#721c24',
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                {error}
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                            Simulation Results
                        </h3>

                        {/* Show which shock was applied */}
                        {result.shock_description && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#fff9e6',
                                borderLeft: '4px solid #ffc107',
                                borderRadius: '4px'
                            }}>
                                <strong style={{ fontSize: '13px', color: '#856404' }}>Applied Shock: </strong>
                                <span style={{ fontSize: '13px', color: '#856404' }}>{result.shock_description}</span>
                            </div>
                        )}

                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Scenario</th>
                                    <th>Fragility Score</th>
                                    <th>Risk Band</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Before Shock</strong></td>
                                    <td>{typeof result.before === 'number' ? result.before.toFixed(2) : result.before}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(result.before_risk_band || 'MEDIUM')}`}>
                                            {result.before_risk_band || 'MEDIUM'}
                                        </span>
                                    </td>
                                </tr>
                                <tr style={{ backgroundColor: '#fff3f3' }}>
                                    <td><strong>After Shock</strong></td>
                                    <td>
                                        <strong style={{ color: result.after > result.before ? '#d32f2f' : '#388e3c' }}>
                                            {typeof result.after === 'number' ? result.after.toFixed(2) : result.after}
                                            {typeof result.after === 'number' && typeof result.before === 'number' && (
                                                <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                                                    ({result.after > result.before ? '+' : ''}{(result.after - result.before).toFixed(2)})
                                                </span>
                                            )}
                                        </strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(result.after_risk_band || result.impact)}`}>
                                            {result.after_risk_band || result.impact || 'HIGH'}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {result.impact && (
                            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                                <strong style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Overall Impact Assessment: </strong>
                                <span className={`status-badge ${getStatusClass(result.impact)}`} style={{ marginLeft: '8px', fontSize: '13px' }}>
                                    {result.impact}
                                </span>
                                {result.shock_type && (
                                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                                        Shock Type: {result.shock_type.replace(/_/g, ' ').toUpperCase()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulation;
