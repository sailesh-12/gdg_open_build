const RiskExplanation = ({ data }) => {
    const reasons = data?.reasons || data?.explanations || data?.factors || [];

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Risk Factors Explanation</h2>
            <div className="section-content">
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    The following factors contribute to this household's financial fragility assessment:
                </p>
                {reasons.length > 0 ? (
                    <ul className="info-list">
                        {reasons.map((reason, index) => (
                            <li key={index}>
                                {typeof reason === 'string' ? reason : reason.description || reason.text}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        No specific risk factors have been identified for this household.
                    </p>
                )}
            </div>
        </div>
    );
};

export default RiskExplanation;
