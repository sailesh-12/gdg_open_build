import { formatId } from '../../utils/formatId';

const WeakLinks = ({ data }) => {
    const members = data?.critical_members || data?.weak_links || data?.weakLinks || data?.members || [];
    const reason = data?.reason || '';

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Critical Household Members</h2>
            <div className="section-content">
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    These members represent key risks due to their role in household financial stability:
                </p>
                {members.length > 0 ? (
                    <>
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Member ID</th>
                                    <th>Role</th>
                                    <th>Impact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member, index) => {
                                    const memberId = typeof member === 'string' ? member : (member.id || member.name);
                                    const role = typeof member === 'object' ? (member.role || 'N/A') : 'N/A';
                                    const impact = typeof member === 'object' ? (member.impact || 'High') : 'High';
                                    const isApplicant = typeof member === 'object' && member.is_applicant;
                                    return (
                                        <tr key={index} style={isApplicant ? { backgroundColor: 'rgba(0, 64, 133, 0.05)' } : {}}>
                                            <td>
                                                {isApplicant && <span style={{ color: '#004085', marginRight: '6px', fontWeight: 'bold' }}>★</span>}
                                                <span title={memberId}>{formatId(memberId)}</span>
                                                {isApplicant && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        fontSize: '11px',
                                                        color: '#fff',
                                                        backgroundColor: '#004085',
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        fontWeight: '600'
                                                    }}>
                                                        APPLICANT
                                                    </span>
                                                )}
                                            </td>
                                            <td>{role}</td>
                                            <td>
                                                <span className={`status-badge ${impact === 'High' ? 'status-high' : impact === 'Medium' ? 'status-medium' : 'status-low'}`}>
                                                    {impact}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {reason && (
                            <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                {reason}
                            </p>
                        )}
                    </>
                ) : (
                    <p style={{ color: 'var(--color-success-text)', backgroundColor: 'var(--color-success-bg)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-success)' }}>
                        ✓ {reason || 'No critical members detected. This household has balanced dependency distribution.'}
                    </p>
                )}
            </div>
        </div >
    );
};

export default WeakLinks;
