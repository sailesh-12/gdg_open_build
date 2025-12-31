import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import LoanEvaluation from '../../components/dashboard/LoanEvaluation';

const LoanEvaluationPage = () => {
    const { householdId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loanEvaluation, setLoanEvaluation] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const loanData = await api.getLoanEvaluation(householdId);
                setLoanEvaluation(loanData);
            } catch (err) {
                setError(err.message || 'Failed to load loan evaluation');
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
                    <p>Loading loan evaluation...</p>
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
            <LoanEvaluation data={loanEvaluation} />
        </div>
    );
};

export default LoanEvaluationPage;
