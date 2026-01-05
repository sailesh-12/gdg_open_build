import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const HouseholdSelector = () => {
    const [householdId, setHouseholdId] = useState('');
    const [error, setError] = useState('');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!householdId.trim()) {
            setError('Please enter a valid household ID');
            return;
        }
        setError('');
        navigate(`/dashboard/${householdId.trim()}`);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="gov-page">
            {/* Header */}
            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-brand">
                        <span className="gov-brand-text">AnchorRisk Financial Analysis System</span>
                    </div>
                    <div className="gov-header-actions">
                        <span className="gov-user-info">
                            User: {user?.displayName || user?.email}
                        </span>
                        <button onClick={handleLogout} className="gov-button-secondary gov-button">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="gov-main">
                {/* Page Title */}
                <section className="gov-page-title-section">
                    <h1 className="gov-page-title">Household Risk Analysis Portal</h1>
                    <p className="gov-page-subtitle">
                        Search for existing households or register new households to assess financial fragility using machine learning analysis.
                    </p>
                </section>

                {/* Search Form */}
                <section className="gov-search-section">
                    <h2 className="gov-search-title">Search Household Records</h2>
                    <form onSubmit={handleSubmit} className="gov-form">
                        {error && <div className="gov-form-error">{error}</div>}

                        <div className="gov-form-group">
                            <label htmlFor="householdId" className="gov-form-label">
                                Household ID
                            </label>
                            <input
                                type="text"
                                id="householdId"
                                className="gov-form-input"
                                value={householdId}
                                onChange={(e) => setHouseholdId(e.target.value)}
                                placeholder="Enter household ID (e.g., H001, H002)"
                            />
                            <span className="gov-form-helper">
                                Enter the unique household identifier to view risk assessment results
                            </span>
                        </div>

                        <div className="gov-form-actions">
                            <button type="submit" className="gov-button">
                                Search Household
                            </button>
                        </div>
                    </form>

                    <div className="gov-divider">
                        <span>or</span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/create" className="gov-button gov-button-secondary" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
                            Register Manually
                        </Link>
                        <Link to="/upload-statement" className="gov-button" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)' }}>
                            📄 Upload Bank Statement
                        </Link>
                    </div>
                </section>

                {/* System Capabilities */}
                <section className="gov-info-section">
                    <h2 className="gov-section-title">System Capabilities</h2>
                    <ul className="gov-info-list">
                        <li>Machine learning-based financial fragility assessment</li>
                        <li>Graph-based household dependency analysis</li>
                        <li>Identification of critical household members</li>
                        <li>What-if scenario simulation for income shock modeling</li>
                        <li>Automated loan risk evaluation with recommended safeguards</li>
                        <li>Comprehensive risk explanations and mitigation recommendations</li>
                    </ul>
                </section>

                {/* System Statistics */}
                <section className="gov-info-section">
                    <h2 className="gov-section-title">System Performance Metrics</h2>
                    <table className="gov-stats-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Model Accuracy</td>
                                <td>90.2%</td>
                            </tr>
                            <tr>
                                <td>Average Analysis Time</td>
                                <td>Less than 2 seconds</td>
                            </tr>
                            <tr>
                                <td>Households Analyzed</td>
                                <td>50,000+</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </main>

            {/* Footer */}
            <footer className="gov-footer">
                <div className="gov-footer-content">
                    <span className="gov-footer-text">
                        AnchorRisk © 2024 | Household Financial Risk Analysis System
                    </span>
                    <div className="gov-footer-badge">
                        <span>Bank-Grade Security | 256-bit Encryption</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HouseholdSelector;
