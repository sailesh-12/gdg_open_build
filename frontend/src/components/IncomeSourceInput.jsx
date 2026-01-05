import { useState } from 'react';

const IncomeSourceInput = ({ memberIndex, memberRole, onIncomeSources }) => {
    const [useAdvanced, setUseAdvanced] = useState(false);
    const [incomeSources, setIncomeSources] = useState([
        { type: 'job', stability: 0.7, volatility: 0.3, is_primary: true, amount_band: 'medium' }
    ]);

    const handleToggleAdvanced = (checked) => {
        setUseAdvanced(checked);
        if (!checked) {
            // Revert to simple mode - pass null to use income_stability instead
            onIncomeSources(memberIndex, null);
        } else {
            // Send current income sources
            onIncomeSources(memberIndex, incomeSources);
        }
    };

    const handleAddSource = () => {
        const newSource = {
            type: 'freelance',
            stability: 0.5,
            volatility: 0.5,
            is_primary: false,
            amount_band: 'low'
        };
        const updated = [...incomeSources, newSource];
        setIncomeSources(updated);
        onIncomeSources(memberIndex, updated);
    };

    const handleRemoveSource = (index) => {
        if (incomeSources.length > 1) {
            const updated = incomeSources.filter((_, i) => i !== index);
            setIncomeSources(updated);
            onIncomeSources(memberIndex, updated);
        }
    };

    const handleSourceChange = (sourceIndex, field, value) => {
        const updated = [...incomeSources];
        if (field === 'stability' || field === 'volatility') {
            updated[sourceIndex][field] = parseFloat(value);
        } else if (field === 'is_primary') {
            // Only one primary source allowed
            updated.forEach((src, i) => {
                src.is_primary = i === sourceIndex;
            });
        } else {
            updated[sourceIndex][field] = value;
        }
        setIncomeSources(updated);
        onIncomeSources(memberIndex, updated);
    };

    if (memberRole !== 'earner') {
        return null; // Only earners have income sources
    }

    return (
        <div className="income-sources-section">
            <div className="advanced-toggle">
                <input
                    type="checkbox"
                    id={`advanced-income-${memberIndex}`}
                    checked={useAdvanced}
                    onChange={(e) => handleToggleAdvanced(e.target.checked)}
                />
                <label htmlFor={`advanced-income-${memberIndex}`}>
                    <span className="toggle-label">Multiple Income Sources (Advanced)</span>
                    <span className="toggle-hint">Specify detailed income breakdown</span>
                </label>
            </div>

            {useAdvanced && (
                <div className="income-sources-list">
                    <div className="sources-header">
                        <h4>Income Sources</h4>
                        <button
                            type="button"
                            onClick={handleAddSource}
                            className="add-source-btn"
                        >
                            + Add Source
                        </button>
                    </div>

                    {incomeSources.map((source, index) => (
                        <div key={index} className="income-source-row">
                            <div className="source-fields">
                                <div className="form-group-sm">
                                    <label>Type</label>
                                    <select
                                        value={source.type}
                                        onChange={(e) => handleSourceChange(index, 'type', e.target.value)}
                                    >
                                        <option value="job">Job/Salary</option>
                                        <option value="freelance">Freelance</option>
                                        <option value="business">Business</option>
                                        <option value="rental">Rental</option>
                                        <option value="pension">Pension</option>
                                    </select>
                                </div>

                                <div className="form-group-sm">
                                    <label>Stability ({source.stability})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={source.stability}
                                        onChange={(e) => handleSourceChange(index, 'stability', e.target.value)}
                                    />
                                </div>

                                <div className="form-group-sm">
                                    <label>Volatility ({source.volatility})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={source.volatility}
                                        onChange={(e) => handleSourceChange(index, 'volatility', e.target.value)}
                                    />
                                </div>

                                <div className="form-group-sm">
                                    <label>Amount Band</label>
                                    <select
                                        value={source.amount_band}
                                        onChange={(e) => handleSourceChange(index, 'amount_band', e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="form-group-sm checkbox-sm">
                                    <input
                                        type="checkbox"
                                        id={`primary-${memberIndex}-${index}`}
                                        checked={source.is_primary}
                                        onChange={() => handleSourceChange(index, 'is_primary', true)}
                                    />
                                    <label htmlFor={`primary-${memberIndex}-${index}`}>Primary</label>
                                </div>
                            </div>
                            {incomeSources.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSource(index)}
                                    className="remove-source-btn"
                                    title="Remove income source"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IncomeSourceInput;
