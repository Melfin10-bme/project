import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientPortal({ showToast }) {
  const navigate = useNavigate();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('patientPortalData');
    if (data) {
      setPortalData(JSON.parse(data));
    } else {
      showToast('Please login first', 'error');
      navigate('/patient-login');
    }
    setLoading(false);
  }, [navigate, showToast]);

  const handleLogout = () => {
    localStorage.removeItem('patientPortalData');
    navigate('/patient-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!portalData) return null;

  const { patient, tests } = portalData;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Patient Portal</h1>
            <p className="text-slate-400 text-sm">View your test results</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Patient Info */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Name</p>
              <p className="text-white">{patient?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Age</p>
              <p className="text-white">{patient?.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Gender</p>
              <p className="text-white">{patient?.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Patient ID</p>
              <p className="text-white text-sm">{patient?.id || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Test Results</h2>

          {tests && tests.length > 0 ? (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-700 rounded-lg p-4 border-l-4"
                  style={{
                    borderLeftColor: test.prediction === 'Positive' ? '#EF4444' : '#10B981'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        {test.prediction === 'Positive' ? 'Infection Detected' : 'No Infection Detected'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        Confidence: {test.confidence}%
                      </p>
                      <p className="text-slate-400 text-sm">
                        Nanopaper Color: {test.nanopaperColor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">{test.analyzedAt}</p>
                      {test.confirmed && (
                        <span className="inline-block mt-2 px-2 py-1 bg-primary-700 text-white text-xs rounded">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No test results found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default PatientPortal;