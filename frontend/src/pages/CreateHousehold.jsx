import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import IncomeSourceInput from '../components/IncomeSourceInput';
import '../styles/Dashboard.css';
import '../styles/IncomeSources.css';

const CreateHousehold = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [householdId, setHouseholdId] = useState('');
    const [members, setMembers] = useState([{ id: '', role: 'earner', income_stability: 0.7, is_applicant: false, income_sources: null }]);
    const [supports, setSupports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleAddMember = () => {
        setMembers([...members, { id: '', role: 'dependent', income_stability: 0.5, is_applicant: false, income_sources: null }]);
    };

    const handleRemoveMember = (index) => {
        if (members.length > 1) {
            const newMembers = members.filter((_, i) => i !== index);
            setMembers(newMembers);
            // Also remove any supports referencing this member
            const removedId = members[index].id;
            setSupports(supports.filter(s => s.from !== removedId && s.to !== removedId));
        }
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = field === 'income_stability' ? parseFloat(value) : value;
        setMembers(newMembers);
    };

    const handleApplicantChange = (index, isChecked) => {
        const newMembers = members.map((member, i) => ({
            ...member,
            is_applicant: i === index ? isChecked : false,
        }));
        setMembers(newMembers);
    };

    const handleIncomeSourcesChange = (memberIndex, incomeSources) => {
        const newMembers = [...members];
        newMembers[memberIndex].income_sources = incomeSources;
        setMembers(newMembers);
    };

    const handleAddSupport = () => {
        if (members.length >= 2) {
            setSupports([...supports, { from: '', to: '', strength: 0.5 }]);
        }
    };

    const handleRemoveSupport = (index) => {
        setSupports(supports.filter((_, i) => i !== index));
    };

    const handleSupportChange = (index, field, value) => {
        const newSupports = [...supports];
        newSupports[index][field] = field === 'strength' ? parseFloat(value) : value;
        setSupports(newSupports);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!householdId.trim()) {
            setError('Household ID is required');
            return;
        }

        if (members.some(m => !m.id.trim())) {
            setError('All members must have an ID');
            return;
        }

        // Check for duplicate member IDs
        const memberIds = members.map(m => m.id);
        if (new Set(memberIds).size !== memberIds.length) {
            setError('Member IDs must be unique');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.createHousehold({
                householdId: householdId.trim(),
                members: members.map(m => {
                    const memberData = {
                        id: m.id.trim(),
                        role: m.role,
                        is_applicant: m.is_applicant
                    };
                    // Include income_sources if specified, otherwise use income_stability
                    if (m.income_sources && m.income_sources.length > 0) {
                        memberData.income_sources = m.income_sources;
                    } else {
                        memberData.income_stability = m.income_stability;
                    }
                    return memberData;
                }),
                supports: supports.filter(s => s.from && s.to).map(s => ({
                    from: s.from,
                    to: s.to,
                    strength: s.strength
                }))
            });

            setSuccess('Household created successfully!');
            setTimeout(() => {
                navigate(`/dashboard/${householdId.trim()}`);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to create household');
        } finally {
            setLoading(false);
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
                            <span>AnchorRisk - Register Household</span>
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
                    <h1>Create New Household</h1>
                    <p>Enter household member details to register for financial fragility analysis</p>
                </div>

                <form onSubmit={handleSubmit} className="create-form">
                    {error && <div className="form-error">{error}</div>}
                    {success && <div className="form-success">{success}</div>}

                    {/* Household ID */}
                    <div className="form-section">
                        <h3>Household Information</h3>
                        <div className="form-group">
                            <label htmlFor="householdId">Household ID</label>
                            <input
                                type="text"
                                id="householdId"
                                value={householdId}
                                onChange={(e) => setHouseholdId(e.target.value)}
                                placeholder="e.g., H001"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Members */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Family Members</h3>
                            <button type="button" onClick={handleAddMember} className="add-btn" disabled={loading}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Add Member
                            </button>
                        </div>

                        {members.map((member, index) => (
                            <div key={index} className={`member-row ${member.is_applicant ? 'member-is-applicant' : ''}`}>
                                <div className="form-group">
                                    <label>Member ID {member.is_applicant && <span className="applicant-badge">Applicant</span>}</label>
                                    <input
                                        type="text"
                                        value={member.id}
                                        onChange={(e) => handleMemberChange(index, 'id', e.target.value)}
                                        placeholder={`e.g., ${householdId || 'H001'}_${member.role === 'earner' ? 'E' : 'D'}${index + 1}`}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="earner">Earner</option>
                                        <option value="dependent">Dependent</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Income Stability ({member.income_stability})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={member.income_stability}
                                        onChange={(e) => handleMemberChange(index, 'income_stability', e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <IncomeSourceInput
                                    memberIndex={index}
                                    memberRole={member.role}
                                    onIncomeSources={handleIncomeSourcesChange}
                                />
                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id={`is-applicant-${index}`}
                                        checked={member.is_applicant}
                                        onChange={(e) => handleApplicantChange(index, e.target.checked)}
                                        disabled={loading}
                                    />
                                    <label htmlFor={`is-applicant-${index}`}>Is Applicant</label>
                                </div>
                                {members.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(index)}
                                        className="remove-btn"
                                        disabled={loading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Support Relationships */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Support Relationships</h3>
                            <button
                                type="button"
                                onClick={handleAddSupport}
                                className="add-btn"
                                disabled={loading || members.length < 2}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Add Support Link
                            </button>
                        </div>

                        <p className="form-hint">Define how members financially support each other</p>

                        {supports.length === 0 ? (
                            <div className="empty-supports">No support relationships defined (optional)</div>
                        ) : (
                            supports.map((support, index) => (
                                <div key={index} className="support-row">
                                    <div className="form-group">
                                        <label>From</label>
                                        <select
                                            value={support.from}
                                            onChange={(e) => handleSupportChange(index, 'from', e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="">Select member...</option>
                                            {members.filter(m => m.id).map((m, i) => (
                                                <option key={i} value={m.id}>{m.id} ({m.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="support-arrow">→</div>
                                    <div className="form-group">
                                        <label>To</label>
                                        <select
                                            value={support.to}
                                            onChange={(e) => handleSupportChange(index, 'to', e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="">Select member...</option>
                                            {members.filter(m => m.id && m.id !== support.from).map((m, i) => (
                                                <option key={i} value={m.id}>{m.id} ({m.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Strength ({support.strength})</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={support.strength}
                                            onChange={(e) => handleSupportChange(index, 'strength', e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSupport(index)}
                                        className="remove-btn"
                                        disabled={loading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={handleBack} className="cancel-btn" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <span className="btn-spinner"></span> : 'Create Household'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default CreateHousehold;
