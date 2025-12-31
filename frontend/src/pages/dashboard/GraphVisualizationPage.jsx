import { useParams } from 'react-router-dom';
import GraphVisualization from '../../components/dashboard/GraphVisualization';

const GraphVisualizationPage = () => {
    const { householdId } = useParams();

    return (
        <div className="page-container">
            <GraphVisualization householdId={householdId} />
        </div>
    );
};

export default GraphVisualizationPage;
