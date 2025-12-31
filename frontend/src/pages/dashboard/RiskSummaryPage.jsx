import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import RiskSummary from '../../components/dashboard/RiskSummary';

const RiskSummaryPage = () => {
    const { householdId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const summaryData = await api.getRiskSummary(householdId);
                setSummary(summaryData);
            } catch (err) {
                setError(err.message || 'Failed to load risk summary');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [householdId]);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading risk summary...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="error-state">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <RiskSummary data={summary} />
        </div>
    );
};

export default RiskSummaryPage;
