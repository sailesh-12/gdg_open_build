import { useState, useEffect } from 'react';
import api from '../../services/api';

const GraphVisualization = ({ householdId }) => {
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                setLoading(true);
                const data = await api.getGraphData(householdId);
                setGraphData(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (householdId) {
            fetchGraphData();
        }
    }, [householdId]);

    if (loading) {
        return (
            <div className="dashboard-section">
                <h2 className="section-header">Household Dependency Network</h2>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading network visualization...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-section">
                <h2 className="section-header">Household Dependency Network</h2>
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <p>Unable to load network visualization: {error}</p>
                </div>
            </div>
        );
    }

    if (!graphData) return null;

    const totalMembers = graphData.nodes?.length || 0;
    const totalConnections = graphData.edges?.length || 0;
    const earners = graphData.composition?.earners || 0;
    const dependents = graphData.composition?.dependents || 0;
    const metrics = graphData.metrics || {};

    return (
        <div className="dashboard-section">
            <h2 className="section-header">Household Dependency Network</h2>
            <div className="graph-explanation">
                This visualization shows the relationships and dependencies between household members. Nodes represent members (earners in green, dependents in amber), and lines show financial support relationships. Critical members are outlined in red, and the loan applicant is outlined in blue.
            </div>

            {/* Network Statistics Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{totalMembers}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Members</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-success)', marginBottom: '4px' }}>{earners}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Income Earners</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-warning)', marginBottom: '4px' }}>{dependents}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Dependents</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{totalConnections}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Support Links</div>
                </div>
            </div>

            {/* Enhanced Graph Visualization */}
            {graphData.nodes && graphData.nodes.length > 0 && (
                <div className="graph-container" style={{ marginTop: '24px', padding: '24px', background: '#FAFAFA' }}>
                    <svg viewBox="0 0 700 500" style={{ width: '100%', maxWidth: '700px', height: 'auto', display: 'block', margin: '0 auto', background: 'var(--color-bg-primary)' }}>
                        <defs>
                            {/* Arrow marker for directed edges */}
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3, 0 6" fill="#6C757D" />
                            </marker>
                        </defs>

                        {/* Draw edges first (behind nodes) */}
                        {graphData.nodes.map((node, idx) => {
                            const angle = (2 * Math.PI * idx) / graphData.nodes.length - Math.PI / 2;
                            const radius = 160;
                            const cx = 350 + radius * Math.cos(angle);
                            const cy = 250 + radius * Math.sin(angle);

                            return graphData.edges
                                .filter(edge => edge.source === node.id)
                                .map((edge, edgeIdx) => {
                                    const targetIdx = graphData.nodes.findIndex(n => n.id === edge.target);
                                    if (targetIdx === -1) return null;

                                    const targetAngle = (2 * Math.PI * targetIdx) / graphData.nodes.length - Math.PI / 2;
                                    const tx = 350 + radius * Math.cos(targetAngle);
                                    const ty = 250 + radius * Math.sin(targetAngle);

                                    // Edge color based on strength
                                    const edgeColor = edge.strength > 0.7 ? '#10B981' : edge.strength > 0.4 ? '#6366F1' : '#F59E0B';
                                    const strokeWidth = 1 + (edge.strength || 0.5) * 2;

                                    return (
                                        <g key={`edge-${idx}-${edgeIdx}`}>
                                            <line
                                                x1={cx}
                                                y1={cy}
                                                x2={tx}
                                                y2={ty}
                                                stroke={edgeColor}
                                                strokeWidth={strokeWidth}
                                                opacity="0.6"
                                                markerEnd="url(#arrowhead)"
                                            />
                                        </g>
                                    );
                                });
                        })}

                        {/* Draw nodes */}
                        {graphData.nodes.map((node, idx) => {
                            const angle = (2 * Math.PI * idx) / graphData.nodes.length - Math.PI / 2;
                            const radius = 160;
                            const cx = 350 + radius * Math.cos(angle);
                            const cy = 250 + radius * Math.sin(angle);

                            // Node size based on role and criticality
                            const baseRadius = 24;
                            const nodeRadius = node.is_applicant ? baseRadius + 6 : node.is_critical ? baseRadius + 4 : baseRadius;

                            // Colors
                            const fillColor = node.role === 'earner' ? '#10B981' : '#F59E0B';
                            let strokeColor = '#DEE2E6';
                            let strokeWidth = 2;

                            if (node.is_applicant) {
                                strokeColor = '#004085';
                                strokeWidth = 4;
                            } else if (node.is_critical) {
                                strokeColor = '#DC2626';
                                strokeWidth = 3;
                            }

                            return (
                                <g key={node.id}>
                                    {/* Outer glow for applicant */}
                                    {node.is_applicant && (
                                        <>
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={nodeRadius + 8}
                                                fill="none"
                                                stroke="#004085"
                                                strokeWidth="2"
                                                opacity="0.3"
                                            />
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={nodeRadius + 12}
                                                fill="none"
                                                stroke="#004085"
                                                strokeWidth="1"
                                                opacity="0.15"
                                            />
                                        </>
                                    )}
                                    {/* Node circle */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={nodeRadius}
                                        fill={fillColor}
                                        stroke={strokeColor}
                                        strokeWidth={strokeWidth}
                                    />

                                    {/* Inner circle for better contrast */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={nodeRadius - 6}
                                        fill="rgba(255, 255, 255, 0.3)"
                                    />

                                    {/* Role icon */}
                                    <text
                                        x={cx}
                                        y={cy + 5}
                                        textAnchor="middle"
                                        fill="#FFFFFF"
                                        fontSize="16"
                                        fontWeight="bold"
                                    >
                                        {node.role === 'earner' ? '$' : 'D'}
                                    </text>

                                    {/* Node label */}
                                    <text
                                        x={cx}
                                        y={cy + nodeRadius + 18}
                                        textAnchor="middle"
                                        fill="var(--color-text-primary)"
                                        fontSize="13"
                                        fontWeight="600"
                                    >
                                        {node.label}
                                    </text>

                                    {/* Additional labels for special roles */}
                                    {node.is_applicant && (
                                        <>
                                            <rect
                                                x={cx - 40}
                                                y={cy + nodeRadius + 24}
                                                width="80"
                                                height="18"
                                                fill="#004085"
                                                rx="4"
                                            />
                                            <text
                                                x={cx}
                                                y={cy + nodeRadius + 36}
                                                textAnchor="middle"
                                                fill="#FFFFFF"
                                                fontSize="11"
                                                fontWeight="700"
                                            >
                                                ★ APPLICANT ★
                                            </text>
                                        </>
                                    )}
                                    {node.is_critical && !node.is_applicant && (
                                        <text
                                            x={cx}
                                            y={cy + nodeRadius + 32}
                                            textAnchor="middle"
                                            fill="var(--color-danger)"
                                            fontSize="10"
                                            fontWeight="600"
                                        >
                                            CRITICAL
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Enhanced Legend */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '24px', padding: '16px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#10B981', borderRadius: '50%', border: '2px solid #DEE2E6' }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>Earner</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#F59E0B', borderRadius: '50%', border: '2px solid #DEE2E6' }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>Dependent</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: 'transparent', border: '3px solid #DC2626', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>Critical Member</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: 'transparent', border: '3px solid #004085', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>Loan Applicant</span>
                        </div>
                    </div>

                    {/* Connection strength legend */}
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Support Relationship Strength:</div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '30px', height: '3px', backgroundColor: '#10B981' }}></div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Strong (&gt;70%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '30px', height: '2px', backgroundColor: '#6366F1' }}></div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Medium (40-70%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '30px', height: '2px', backgroundColor: '#F59E0B' }}></div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Weak (&lt;40%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Metrics Table */}
            {metrics && Object.keys(metrics).length > 0 && (
                <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '32px', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                        Network Risk Metrics
                    </h3>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Score</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.fragility_score !== undefined && (
                                <tr>
                                    <td><strong>Fragility Score</strong></td>
                                    <td><strong>{(metrics.fragility_score * 100).toFixed(1)}%</strong></td>
                                    <td>Overall household financial vulnerability</td>
                                </tr>
                            )}
                            {metrics.dependency_ratio !== undefined && (
                                <tr>
                                    <td>Dependency Ratio</td>
                                    <td>{metrics.dependency_ratio.toFixed(2)}</td>
                                    <td>Ratio of dependents to earners</td>
                                </tr>
                            )}
                            {metrics.income_stability !== undefined && (
                                <tr>
                                    <td>Income Stability</td>
                                    <td>{(metrics.income_stability * 100).toFixed(1)}%</td>
                                    <td>Reliability of household income sources</td>
                                </tr>
                            )}
                            {metrics.support_strength !== undefined && (
                                <tr>
                                    <td>Support Strength</td>
                                    <td>{(metrics.support_strength * 100).toFixed(1)}%</td>
                                    <td>Quality of support relationships</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default GraphVisualization;
