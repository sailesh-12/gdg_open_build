import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generatePDF } from '../../utils/pdfExport';
import api from '../../services/api';
import DashboardNavigation from './DashboardNavigation';
import '../../styles/Dashboard.css';

const DashboardLayout = () => {
    const { householdId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const analysisData = await api.getFullAnalysis(householdId).catch(() => null);
                if (analysisData?.members) {
                    setAllMembers(analysisData.members);
                } else if (analysisData?.graph_data?.nodes) {
                    setAllMembers(analysisData.graph_data.nodes);
                }
            } catch (err) {
                console.error('Failed to fetch members:', err);
            }
        };

        fetchMembers();
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
        } catch (error) {
            alert('Failed to generate PDF: ' + error.message);
        } finally {
            setDownloadingPDF(false);
        }
    };

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
                            disabled={downloadingPDF}
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

            <div className="dashboard-layout">
                <DashboardNavigation
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
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

                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

