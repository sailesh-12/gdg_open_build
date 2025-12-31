const Recommendations = ({ data }) => {
    const items = data?.recommendations || data?.actions || data?.suggestions || [];

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Recommendations for Risk Mitigation</h2>
            <div className="section-content">
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Based on the analysis, the following actions are recommended to reduce financial fragility:
                </p>
                {items.length > 0 ? (
                    <ol className="numbered-list">
                        {items.map((item, index) => (
                            <li key={index}>
                                {typeof item === 'string' ? item : item.text || item.description}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p style={{ color: 'var(--color-success-text)', backgroundColor: 'var(--color-success-bg)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-success)' }}>
                        ✓ No immediate actions required. This household demonstrates acceptable risk levels.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Recommendations;
