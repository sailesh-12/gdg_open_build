import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import RiskExplanation from '../../components/dashboard/RiskExplanation';

const RiskExplanationPage = () => {
    const { householdId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [explanation, setExplanation] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const explanationData = await api.getRiskExplanation(householdId);
                setExplanation(explanationData);
            } catch (err) {
                setError(err.message || 'Failed to load risk explanation');
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
                    <p>Loading risk explanation...</p>
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
            <RiskExplanation data={explanation} />
        </div>
    );
};

export default RiskExplanationPage;
