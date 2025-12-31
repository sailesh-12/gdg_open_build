import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { generatePDF } from '../utils/pdfExport';
import RiskSummary from '../components/dashboard/RiskSummary';
import RiskExplanation from '../components/dashboard/RiskExplanation';
import WeakLinks from '../components/dashboard/WeakLinks';
import Simulation from '../components/dashboard/Simulation';
import Recommendations from '../components/dashboard/Recommendations';
import LoanEvaluation from '../components/dashboard/LoanEvaluation';
import GraphVisualization from '../components/dashboard/GraphVisualization';
import '../styles/Dashboard.css';

const RiskDashboard = () => {
    const { householdId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [weakLinks, setWeakLinks] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loanEvaluation, setLoanEvaluation] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch all data including full analysis for member list
                const [summaryData, explanationData, weakLinksData, recommendationsData, loanData, analysisData] =
                    await Promise.all([
                        api.getRiskSummary(householdId),
                        api.getRiskExplanation(householdId),
                        api.getWeakLinks(householdId),
                        api.getRecommendations(householdId),
                        api.getLoanEvaluation(householdId),
                        api.getFullAnalysis(householdId).catch(() => null), // Optional - might not exist
                    ]);

                setSummary(summaryData);
                setExplanation(explanationData);
                setWeakLinks(weakLinksData);
                setRecommendations(recommendationsData);
                setLoanEvaluation(loanData);

                // Extract members from analysis data if available
                if (analysisData?.members) {
                    setAllMembers(analysisData.members);
                } else if (analysisData?.graph_data?.nodes) {
                    setAllMembers(analysisData.graph_data.nodes);
                }
            } catch (err) {
                setError(err.message || 'Failed to load household data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [householdId]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            const applicant = allMembers.find(m => m.is_applicant);
            const applicantId = applicant?.id || applicant?.label || null;

            await generatePDF(householdId, applicantId);
            // Success - PDF downloaded
        } catch (error) {
            alert('Failed to generate PDF: ' + error.message);
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading household analysis...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-state">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h2>Household Not Found</h2>
                    <p>{error}</p>
                    <button onClick={handleBack} className="back-btn">
                        ← Try Another Household
                    </button>
                </div>
            </div>
        );
    }

    // Get members for simulation - use all members if available, otherwise critical members
    const criticalMembers = weakLinks?.critical_members || [];
    const membersForSimulation = allMembers.length > 0 ? allMembers : criticalMembers;

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="dashboard-nav-content">
                    <div className="nav-left">
                        <button onClick={handleBack} className="back-link">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back to Search
                        </button>
                        <div className="nav-brand">
                            <span>AnchorRisk Analysis System</span>
                        </div>
                    </div>
                    <div className="nav-user">
                        <button
                            onClick={handleDownloadPDF}
                            className="gov-button"
                            disabled={downloadingPDF || loading}
                            style={{ marginRight: '12px' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" style={{ marginRight: '6px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {downloadingPDF ? 'Generating...' : 'Download PDF'}
                        </button>
                        <span className="user-email">{user?.email}</span>
                        <button onClick={handleLogout} className="logout-btn">
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Household: <span className="household-id">{householdId}</span></h1>
                    <p>Financial Fragility Risk Assessment Report</p>
                    {allMembers.length > 0 && (() => {
                        const applicant = allMembers.find(m => m.is_applicant);
                        const applicantId = applicant?.id || applicant?.label;
                        return applicantId ? (
                            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(0, 64, 133, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '4px' }}>
                                <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>Loan Applicant: </strong>
                                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{applicantId}</span>
                                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '12px' }}>
                                    (Risk analysis considers household context for this applicant)
                                </span>
                            </div>
                        ) : null;
                    })()}
                </div>

                <RiskSummary data={summary} />

                <GraphVisualization householdId={householdId} />

                <div className="dashboard-grid">
                    <RiskExplanation data={explanation} />
                    <WeakLinks data={weakLinks} />
                    <Simulation householdId={householdId} members={membersForSimulation} />
                    <Recommendations data={recommendations} />
                    <LoanEvaluation data={loanEvaluation} />
                </div>
            </main>
        </div>
    );
};

export default RiskDashboard;
