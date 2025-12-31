const RiskSummary = ({ data }) => {
    if (!data) return null;

    const getStatusClass = (band) => {
        const classes = {
            LOW: 'status-low',
            MEDIUM: 'status-medium',
            HIGH: 'status-high',
        };
        return classes[band?.toUpperCase()] || 'status-medium';
    };

    const score = data.score ?? data.fragility_score ?? 0;
    const riskBand = data.risk_band || data.riskBand || 'UNKNOWN';

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Risk Assessment Summary</h2>
            <div className="risk-score-display">
                <div className="risk-score-value" style={{ color: riskBand === 'HIGH' ? 'var(--color-danger)' : riskBand === 'LOW' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {typeof score === 'number' ? score.toFixed(2) : score}
                </div>
                <div className="risk-score-details">
                    <div className="risk-score-label">Fragility Score (0-1 scale)</div>
                    <div className="risk-score-description">
                        <span className={`status-badge ${getStatusClass(riskBand)}`}>
                            Risk Level: {riskBand}
                        </span>
                    </div>
                    {data.summary && (
                        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                            {data.summary}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiskSummary;
