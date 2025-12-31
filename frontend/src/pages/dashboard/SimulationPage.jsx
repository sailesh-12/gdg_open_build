import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Simulation from '../../components/dashboard/Simulation';

const SimulationPage = () => {
    const { householdId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch full analysis to get member list
                const analysisData = await api.getFullAnalysis(householdId);
                if (analysisData?.members) {
                    setMembers(analysisData.members);
                } else if (analysisData?.graph_data?.nodes) {
                    setMembers(analysisData.graph_data.nodes);
                } else {
                    // Fallback: try to get from weak links
                    const weakLinksData = await api.getWeakLinks(householdId);
                    setMembers(weakLinksData?.critical_members || []);
                }
            } catch (err) {
                setError(err.message || 'Failed to load member data');
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
                    <p>Loading simulation data...</p>
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
            <Simulation householdId={householdId} members={members} />
        </div>
    );
};

export default SimulationPage;
