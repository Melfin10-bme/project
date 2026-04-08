import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import NewTest from './pages/NewTest';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';
import Chatbot from './components/Chatbot';
import Toast from './components/Toast';
import TextToSpeechButton from './components/TextToSpeech';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import PatientLogin from './pages/PatientLogin';
import PatientPortal from './pages/PatientPortal';
import PatientScanResult from './pages/PatientScanResult';
import BackupExport from './pages/BackupExport';
import AuditLogs from './pages/AuditLogs';
import Sessions from './pages/Sessions';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not logged in, show login/register pages
  if (!user) {
    return (
      <Router>
        <div className="min-h-screen bg-slate-900 dark:bg-slate-900 bg-white">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="/login" element={<Login showToast={showToast} />} />
            <Route path="/register" element={<Register showToast={showToast} />} />
            <Route path="/patient-login" element={<PatientLogin showToast={showToast} />} />
            <Route path="/patient-portal" element={<PatientPortal showToast={showToast} />} />
            {/* Public scan routes - accessible via QR code without login */}
            <Route path="/scan/:patientId" element={<PatientScanResult />} />
            <Route path="/scan/:patientId/:testId" element={<PatientScanResult />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          {/* Top Header */}
          <header className="fixed top-0 right-0 left-auto left-0 z-30 h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6"
            style={{ left: sidebarOpen ? '256px' : '64px' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-white">H. pylori Detection System</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-slate-400 dark:text-slate-400">{user.username} ({user.role})</span>
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
                <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="pt-16 p-6 min-h-screen bg-slate-900">
            <Routes>
              <Route path="/" element={<Dashboard showToast={showToast} />} />
              <Route path="/patients" element={<Patients showToast={showToast} />} />
              <Route path="/patients/:id" element={<PatientProfile showToast={showToast} />} />
              <Route path="/new-test" element={<NewTest showToast={showToast} />} />
              <Route path="/analytics" element={<Analytics showToast={showToast} />} />
              <Route path="/reports" element={<Reports showToast={showToast} />} />
              <Route path="/appointments" element={<Appointments showToast={showToast} />} />
              {(user.role === 'Admin' || user.role === 'Doctor') && (
                <>
                  <Route path="/users" element={<Users showToast={showToast} />} />
                  <Route path="/backup" element={<BackupExport showToast={showToast} />} />
                  <Route path="/audit" element={<AuditLogs showToast={showToast} />} />
                  <Route path="/sessions" element={<Sessions showToast={showToast} />} />
                </>
              )}
            </Routes>
          </main>
        </div>

        {/* Chatbot */}
        <Chatbot />

        {/* Voice Assistant Button */}
        {user && <TextToSpeechButton />}

        {/* Toast Notification */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </Router>
  );
}

export default App;