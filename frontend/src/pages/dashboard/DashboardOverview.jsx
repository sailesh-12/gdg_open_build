import { Link, useParams } from 'react-router-dom';

const DashboardOverview = () => {
    const { householdId } = useParams();

    const sections = [
        {
            path: 'summary',
            icon: '⚠️',
            title: 'Risk Summary',
            description: 'View the overall fragility score and risk band assessment for this household.'
        },
        {
            path: 'network',
            icon: '🔗',
            title: 'Dependency Network',
            description: 'Visualize household members, their roles, and support relationships in an interactive graph.'
        },
        {
            path: 'explanation',
            icon: '📋',
            title: 'Risk Factors',
            description: 'Explore the detailed factors contributing to the household\'s financial fragility.'
        },
        {
            path: 'critical-members',
            icon: '👥',
            title: 'Critical Members',
            description: 'Identify household members whose loss would have significant financial impact.'
        },
        {
            path: 'simulation',
            icon: '🧪',
            title: 'What-If Simulation',
            description: 'Run scenarios to simulate the impact of income loss for specific household members.'
        },
        {
            path: 'recommendations',
            icon: '💡',
            title: 'Recommendations',
            description: 'Review actionable recommendations to reduce financial fragility and mitigate risks.'
        },
        {
            path: 'loan-evaluation',
            icon: '💰',
            title: 'Loan Assessment',
            description: 'Evaluate loan approval risk level and recommended safeguards for this household.'
        }
    ];

    return (
        <div className="page-container">
            <div className="dashboard-section">
                <h2 className="section-header">Risk Analysis Overview</h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                    Select a section below to view detailed risk analysis for household <strong>{householdId}</strong>.
                    Each section provides comprehensive insights into different aspects of financial fragility assessment.
                </p>

                <div className="overview-grid">
                    {sections.map((section) => (
                        <Link
                            key={section.path}
                            to={`/dashboard/${householdId}/${section.path}`}
                            className="overview-card"
                        >
                            <div className="overview-card-icon">{section.icon}</div>
                            <div className="overview-card-title">{section.title}</div>
                            <div className="overview-card-description">{section.description}</div>
                            <div className="overview-card-arrow">
                                View Details →
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
