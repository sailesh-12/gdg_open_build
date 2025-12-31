const LoanEvaluation = ({ data }) => {
    const getStatusClass = (risk) => {
        const classes = {
            LOW: 'status-low',
            MEDIUM: 'status-medium',
            HIGH: 'status-high',
        };
        return classes[risk?.toUpperCase()] || 'status-medium';
    };

    const safeguards = data?.suggestions || data?.safeguards || data?.conditions || [];
    const riskLevel = data?.loan_risk || data?.loanRisk || data?.risk_level || 'UNKNOWN';
    const decision = data?.decision || '';

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Loan Risk Assessment</h2>
            <div className="section-content">
                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loan Approval Risk Level:</strong>
                    </div>
                    <div>
                        <span className={`status-badge ${getStatusClass(riskLevel)}`} style={{ fontSize: '15px' }}>
                            {riskLevel}
                        </span>
                    </div>
                    {decision && (
                        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                            {decision}
                        </p>
                    )}
                </div>

                {safeguards.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                            Recommended Loan Safeguards
                        </h3>
                        <ul className="info-list">
                            {safeguards.map((safeguard, index) => (
                                <li key={index}>
                                    {typeof safeguard === 'string' ? safeguard : safeguard.text}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {safeguards.length === 0 && (
                    <p style={{ color: 'var(--color-success-text)', backgroundColor: 'var(--color-success-bg)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-success)' }}>
                        ✓ No additional safeguards required for loan approval.
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoanEvaluation;
