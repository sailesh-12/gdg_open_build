import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import WeakLinks from '../../components/dashboard/WeakLinks';

const CriticalMembersPage = () => {
    const { householdId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [weakLinks, setWeakLinks] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const weakLinksData = await api.getWeakLinks(householdId);
                setWeakLinks(weakLinksData);
            } catch (err) {
                setError(err.message || 'Failed to load critical members data');
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
                    <p>Loading critical members analysis...</p>
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
            <WeakLinks data={weakLinks} />
        </div>
    );
};

export default CriticalMembersPage;
