import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Activity, FileText, Download, Trash2, FlaskConical } from 'lucide-react';
import { getPatient, getTests, getTest, generatePDFReport, generateCSVReport, generatePatientQR, generateTestQR, confirmTest } from '../services/api';

// Helper function to download base64 data
const downloadBase64File = (base64Data, filename, mimeType) => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function PatientProfile({ showToast }) {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientQR, setPatientQR] = useState(null);
  const [testQR, setTestQR] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({ confirmedBy: '', confirmSignature: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientData = await getPatient(id);
        setPatient(patientData);

        // Load patient QR code
        try {
          const qr = await generatePatientQR(id);
          console.log('Patient QR loaded:', qr.qrCode ? 'success' : 'empty');
          setPatientQR(qr.qrCode);
        } catch (e) {
          console.error('Patient QR error:', e);
        }

        const allTests = await getTests(id);
        setTests(allTests.reverse());

        if (allTests.length > 0) {
          setSelectedTest(allTests[0]);
          // Load test QR code
          try {
            const tqr = await generateTestQR(allTests[0].id);
            console.log('Test QR loaded:', tqr.qrCode ? 'success' : 'empty');
            setTestQR(tqr.qrCode);
          } catch (e) {
            console.error('Test QR error:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error loading patient data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleConfirmTest = async () => {
    if (!selectedTest) return;
    try {
      await confirmTest(selectedTest.id, confirmData.confirmedBy, confirmData.confirmSignature);
      showToast('Test confirmed successfully!', 'success');
      setShowConfirmModal(false);
      // Refresh tests
      const allTests = await getTests(id);
      setTests(allTests.reverse());
      setSelectedTest(allTests.find(t => t.id === selectedTest.id));
    } catch (error) {
      showToast(error.message || 'Error confirming test', 'error');
    }
  };

  const handleTestSelect = async (test) => {
    setSelectedTest(test);
    setTestQR(null);
    try {
      const tqr = await generateTestQR(test.id);
      console.log('Test QR loaded on select:', tqr.qrCode ? 'success' : 'empty');
      setTestQR(tqr.qrCode);
    } catch (e) {
      console.error('Test QR error on select:', e);
    }
  };

  const handleGenerateReport = async (format) => {
    if (!selectedTest) return;
    try {
      if (format === 'PDF') {
        const result = await generatePDFReport(id, selectedTest.id);
        const filename = `HPylori_Report_${selectedTest.id.substring(0, 8)}.pdf`;
        downloadBase64File(result.downloadUrl, filename, 'application/pdf');
      } else {
        const result = await generateCSVReport(id, selectedTest.id);
        const filename = `HPylori_Report_${selectedTest.id.substring(0, 8)}.csv`;
        downloadBase64File(result.downloadUrl, filename, 'text/csv');
      }
      showToast(`${format} report generated successfully!`);
    } catch (error) {
      showToast(`Error generating ${format} report`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32 rounded mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 skeleton h-96 rounded-2xl"></div>
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h2 className="text-xl font-medium text-slate-400">Patient not found</h2>
        <Link to="/patients" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">Back to Patients</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/patients" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-700/50 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{patient.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-slate-400">
                <span>{patient.age} years</span>
                <span>•</span>
                <span>{patient.gender}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/new-test"
              state={{ patientId: id }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-xl text-white text-sm font-medium transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              New Test
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {patient.email && (
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{patient.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Since {new Date(patient.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* QR Code Section */}
        {patientQR && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-xl">
            <h3 className="text-sm font-medium text-white mb-2">Patient QR Code</h3>
            <img src={patientQR} alt="Patient QR" className="w-24 h-24" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test History */}
        <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Test History</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tests.length > 0 ? (
              tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => handleTestSelect(test)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    selectedTest?.id === test.id
                      ? 'bg-primary-700/50 border border-primary-600/50'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{new Date(test.analyzedAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      test.prediction === 'Positive'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {test.prediction}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{test.confidence}% confidence</p>
                </button>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4">No tests yet</p>
            )}
          </div>
        </div>

        {/* Test Details */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-5 border border-slate-700">
          {selectedTest ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Test Details</h2>
                <div className="flex gap-2">
                  {/* Confirm button for positive tests that need confirmation */}
                  {selectedTest.needsConfirmation && !selectedTest.confirmed && (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {/* Confirmed badge */}
                  {selectedTest.confirmed && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-700 rounded-lg text-white text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmed
                    </span>
                  )}
                  <button
                    onClick={() => handleGenerateReport('PDF')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleGenerateReport('CSV')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Result Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Prediction</p>
                  <p className={`text-2xl font-bold ${
                    selectedTest.prediction === 'Positive' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {selectedTest.prediction}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-white">{selectedTest.confidence}%</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm mb-1">Nanopaper Color</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${
                      selectedTest.nanopaperColor === 'Yellow' ? 'bg-amber-400' : 'bg-amber-800'
                    }`}></div>
                    <p className="text-lg font-bold text-white">{selectedTest.nanopaperColor}</p>
                  </div>
                </div>
              </div>

              {/* Binary Signal Visualization */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Binary Signal Input</h3>
                  <span className="text-xs text-slate-400">{selectedTest.signalLength} bits</span>
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {selectedTest.binarySignal.split(',').slice(0, 100).map((bit, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-3 rounded-sm ${
                        bit === '1' ? 'bg-primary-400' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                {selectedTest.binarySignal.split(',').length > 100 && (
                  <p className="text-xs text-slate-500 mt-2">... and {selectedTest.binarySignal.split(',').length - 100} more bits</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Test Created</p>
                  <p className="text-slate-200">{new Date(selectedTest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Analyzed At</p>
                  <p className="text-slate-200">{new Date(selectedTest.analyzedAt).toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">Select a test to view details</p>
            </div>
          )}
        </div>

        {/* Test QR Code */}
        {testQR && selectedTest && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-xl">
            <h3 className="text-sm font-medium text-white mb-2">Test QR Code</h3>
            <img src={testQR} alt="Test QR" className="w-24 h-24" />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Test Result</h3>
            <p className="text-slate-400 mb-4">
              You are confirming a positive test result. This action requires a second technician's verification.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmed By (Name/ID)</label>
                <input
                  type="text"
                  value={confirmData.confirmedBy}
                  onChange={(e) => setConfirmData({ ...confirmData, confirmedBy: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Signature/ID</label>
                <input
                  type="text"
                  value={confirmData.confirmSignature}
                  onChange={(e) => setConfirmData({ ...confirmData, confirmSignature: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTest}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientProfile;