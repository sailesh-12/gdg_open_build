import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HouseholdSelector from './pages/HouseholdSelector';
import CreateHousehold from './pages/CreateHousehold';
import BankStatementUpload from './pages/BankStatementUpload';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import RiskSummaryPage from './pages/dashboard/RiskSummaryPage';
import GraphVisualizationPage from './pages/dashboard/GraphVisualizationPage';
import RiskExplanationPage from './pages/dashboard/RiskExplanationPage';
import CriticalMembersPage from './pages/dashboard/CriticalMembersPage';
import SimulationPage from './pages/dashboard/SimulationPage';
import RecommendationsPage from './pages/dashboard/RecommendationsPage';
import LoanEvaluationPage from './pages/dashboard/LoanEvaluationPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HouseholdSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateHousehold />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-statement"
            element={
              <ProtectedRoute>
                <BankStatementUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:householdId"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="summary" element={<RiskSummaryPage />} />
            <Route path="network" element={<GraphVisualizationPage />} />
            <Route path="explanation" element={<RiskExplanationPage />} />
            <Route path="critical-members" element={<CriticalMembersPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="loan-evaluation" element={<LoanEvaluationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
