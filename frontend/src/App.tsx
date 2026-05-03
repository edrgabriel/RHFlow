import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { EmployeesList } from './pages/EmployeesList';
import { ExamsList } from './pages/ExamsList';
import { LoansList } from './pages/LoansList';
import { VacationsList } from './pages/VacationsList';
import { Reports } from './pages/Reports';
import { TurnoverDashboard } from './pages/TurnoverDashboard';
import { SettingsPanel } from './pages/SettingsPanel';
import { CandidatePortal } from './pages/CandidatePortal';
import { Login } from './pages/Login';
import axios from 'axios';

// Setup global Axios interceptor for JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('rhflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor to handle 401 Unauthorized
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignore 401 if it's the login route
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('rhflow_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('rhflow_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/candidatura/:token" element={<CandidatePortal />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-900 font-sans transition-colors">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                  <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeesList />} />
              <Route path="/exams" element={<ExamsList />} />
              <Route path="/loans" element={<LoansList />} />
              <Route path="/vacations" element={<VacationsList />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/turnover" element={<TurnoverDashboard />} />
              <Route path="/settings" element={<SettingsPanel />} />
            </Routes>
          </main>
        </div>
      </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
