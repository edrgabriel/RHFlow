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

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
