import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Dashboard.css';

const BankStatementUpload = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [members, setMembers] = useState([]);
    const [householdName, setHouseholdName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or image file');
            return;
        }
        setFile(selectedFile);
        setError(null);
        setParsedData(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await api.uploadStatement(file);
            if (result.success) {
                setParsedData(result.data);
                setHouseholdName(result.data.suggestedHouseholdName || '');

                const membersList = (result.data.identifiedMembers || []).map((m, index) => ({
                    ...m,
                    id: index,
                    included: true,
                    role: m.suggestedRole || 'dependent',
                }));
                setMembers(membersList);
            }
        } catch (err) {
            setError(err.message || 'Failed to parse bank statement');
        } finally {
            setLoading(false);
        }
    };

    const handleMemberToggle = (index) => {
        setMembers(prev => prev.map((m, i) =>
            i === index ? { ...m, included: !m.included } : m
        ));
    };

    const handleMemberRoleChange = (index, role) => {
        setMembers(prev => prev.map((m, i) =>
            i === index ? { ...m, role } : m
        ));
    };

    const handleCreateHousehold = async () => {
        const includedMembers = members.filter(m => m.included);
        if (includedMembers.length === 0) {
            setError('Please select at least one member');
            return;
        }

        if (!householdName.trim()) {
            setError('Please enter a household name');
            return;
        }

        setCreating(true);
        setError(null);

        // Debug logging
        const payload = {
            householdName: householdName.trim(),
            members: includedMembers.map(m => ({
                name: m.name,
                role: m.role,
                relationship: m.relationship
            })),
            parsedData: parsedData, // Pass full parsed data including detectedIncomeSources
        };

        console.log("========== CREATING HOUSEHOLD ==========");
        console.log("📤 Sending to backend:", JSON.stringify(payload, null, 2));
        console.log("📊 Income sources count:", parsedData?.detectedIncomeSources?.length || 0);
        console.log("👥 Members count:", includedMembers.length);

        try {
            const result = await api.createHouseholdFromStatement(payload);

            console.log("📥 Backend response:", result);

            if (result.success) {
                console.log("✅ Household created successfully:", result.householdId);
                navigate(`/dashboard/${result.householdId}`);
            }
        } catch (err) {
            console.error("❌ Error creating household:", err);
            setError(err.message || 'Failed to create household');
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleBack = () => {
        navigate('/');
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
                            <span>AnchorRisk - Upload Bank Statement</span>
                        </div>
                    </div>
                    <div className="nav-user">
                        <span className="user-email">{user?.email}</span>
                        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
                    </div>
                </div>
            </nav>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Upload Bank Statement</h1>
                    <p>Use AI to automatically extract household details from your bank statement</p>
                </div>

                <div className="create-form">
                    {error && <div className="form-error">{error}</div>}

                    {/* Upload Section */}
                    <div className="form-section">
                        <h3>Bank Statement Upload</h3>
                        <p className="form-hint">Upload a PDF or image of your bank statement for automated analysis using Gemini AI</p>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input').click()}
                            style={{
                                border: dragActive ? '3px dashed var(--color-primary)' : file ? '2px solid var(--color-success)' : '2px dashed var(--color-border)',
                                borderRadius: '4px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: dragActive ? 'var(--color-bg-secondary)' : file ? 'var(--color-success-bg)' : 'var(--color-bg-primary)',
                                transition: 'all 0.3s ease',
                                marginTop: '16px',
                            }}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                                style={{ display: 'none' }}
                            />

                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                                {loading ? '⏳' : file ? '✅' : '📄'}
                            </div>

                            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                                {loading ? 'Analyzing ....' : file ? file.name : 'Drag & drop your bank statement here'}
                            </div>

                            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                {file ? `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse (PDF, PNG, JPG • Max 10MB)'}
                            </div>
                        </div>

                        {file && !parsedData && !loading && (
                            <button
                                onClick={handleUpload}
                                className="form-button"
                                style={{ marginTop: '20px', width: '100%' }}
                            >
                                🤖 Analyzing .....
                            </button>
                        )}
                    </div>

                    {/* Parsed Results */}
                    {parsedData && (
                        <>
                            {/* Income Sources */}
                            <div className="form-section">
                                <h3>Detected Income Sources ({parsedData.detectedIncomeSources?.length || 0})</h3>
                                {parsedData.detectedIncomeSources && parsedData.detectedIncomeSources.length > 0 ? (
                                    <div style={{ marginTop: '20px' }}>
                                        {parsedData.detectedIncomeSources.map((source, idx) => (
                                            <div key={idx} style={{
                                                padding: '16px',
                                                background: source.is_primary ? 'var(--color-success-bg)' : 'var(--color-bg-secondary)',
                                                borderRadius: '8px',
                                                marginBottom: '12px',
                                                border: source.is_primary ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                                            {source.description || `${source.type} Income`}
                                                            {source.is_primary && <span style={{ marginLeft: '8px', fontSize: '12px', background: 'var(--color-success)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>PRIMARY</span>}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', textTransform: 'uppercase' }}>
                                                            {source.type}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>
                                                        {source.amount_band?.toUpperCase()} AMOUNT
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>STABILITY</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '600', color: source.stability > 0.7 ? 'var(--color-success)' : source.stability > 0.4 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                                            {(source.stability * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>VOLATILITY</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '600', color: source.volatility > 0.6 ? 'var(--color-danger)' : source.volatility > 0.3 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                                            {(source.volatility * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                        No income sources detected. Gemini AI will analyze your statement to identify income streams.
                                    </div>
                                )}
                            </div>

                            {/* Household Name */}
                            <div className="form-section">
                                <h3>Household Information</h3>
                                <div className="form-group">
                                    <label htmlFor="householdName">Household ID/Name</label>
                                    <input
                                        type="text"
                                        id="householdName"
                                        value={householdName}
                                        onChange={(e) => setHouseholdName(e.target.value)}
                                        placeholder="Enter household identifier"
                                        disabled={creating}
                                    />
                                </div>
                            </div>

                            {/* Members */}
                            <div className="form-section">
                                <div className="section-header">
                                    <h3>Identified Members ({members.filter(m => m.included).length} selected)</h3>
                                </div>
                                <p className="form-hint">Review and adjust the members extracted from your bank statement</p>

                                {members.map((member, index) => (
                                    <div
                                        key={index}
                                        className={`member-row ${member.included ? '' : ''}`}
                                        style={{
                                            opacity: member.included ? 1 : 0.6,
                                            gridTemplateColumns: 'auto 3fr 1.5fr 1fr',
                                        }}
                                    >
                                        <div className="form-group checkbox-group" style={{ paddingBottom: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={member.included}
                                                onChange={() => handleMemberToggle(index)}
                                                disabled={creating}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>
                                                {member.relationship === 'Self' && '⭐ '}
                                                Member Name
                                            </label>
                                            <div style={{
                                                padding: '10px 12px',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                color: 'var(--color-text-primary)',
                                            }}>
                                                {member.name}
                                                {member.transactionCount > 0 && (
                                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                                        ({member.transactionCount} transactions)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Relationship</label>
                                            <div style={{
                                                padding: '10px 12px',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                color: 'var(--color-text-secondary)',
                                            }}>
                                                {member.relationship || 'Family Member'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Role</label>
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleMemberRoleChange(index, e.target.value)}
                                                disabled={!member.included || creating}
                                            >
                                                <option value="earner">Earner</option>
                                                <option value="dependent">Dependent</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                <div className="form-actions" style={{ marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="cancel-btn"
                                        disabled={creating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateHousehold}
                                        disabled={creating || members.filter(m => m.included).length === 0}
                                        className="submit-btn"
                                    >
                                        {creating && <span className="btn-spinner"></span>}
                                        {creating ? 'Creating Household...' : 'Create Household & View Dashboard'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BankStatementUpload;
