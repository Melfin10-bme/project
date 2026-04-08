import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FlaskConical, User, RefreshCw, Play, Save, AlertCircle, CheckCircle, XCircle, Upload, Image, Volume2 } from 'lucide-react';
import { getPatients, createTest, analyzeSignal, generateRandomSignal, createPatient } from '../services/api';
import { speak } from '../components/TextToSpeech';

function NewTest({ showToast }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatient, setNewPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', email: '', phone: '' });
  const [binarySignal, setBinarySignal] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);

        // Check if patientId was passed
        if (location.state?.patientId) {
          const patient = data.find(p => p.id === location.state.patientId);
          if (patient) setSelectedPatient(patient);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [location.state]);

  const handleGenerateRandom = async () => {
    try {
      const result = await generateRandomSignal();
      setBinarySignal(result.binarySignal);
      setAnalysis(result.analysis);
      showToast('Random signal generated!');
    } catch (error) {
      showToast('Error generating signal', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Create FormData to upload image
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tests/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.signal) {
        setBinarySignal(result.signal);
        setAnalysis(result.analysis);
        showToast('Image analyzed successfully!');
      }
    } catch (error) {
      showToast('Error analyzing image', 'error');
    }
    setUploadingImage(false);
  };

  const handleAnalyze = async () => {
    if (!binarySignal.trim()) {
      showToast('Please enter a binary signal or generate one', 'warning');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeSignal(binarySignal);
      setAnalysis(result.analysis);
    } catch (error) {
      showToast('Error analyzing signal', 'error');
    }
    setAnalyzing(false);
  };

  const handleSaveTest = async () => {
    if (!selectedPatient) {
      showToast('Please select a patient', 'warning');
      return;
    }

    if (!binarySignal.trim()) {
      showToast('Please enter or generate a binary signal', 'warning');
      return;
    }

    setSaving(true);
    try {
      // Create test
      const test = await createTest({
        patientId: selectedPatient.id,
        binarySignal: binarySignal,
        imageUrl: ''
      });

      showToast('Test saved successfully!');
      navigate(`/patients/${selectedPatient.id}`);
    } catch (error) {
      showToast('Error saving test', 'error');
    }
    setSaving(false);
  };

  const handleCreatePatient = async () => {
    if (!patientForm.name || !patientForm.age) {
      showToast('Please fill in patient name and age', 'warning');
      return;
    }

    try {
      const patient = await createPatient(patientForm);
      setSelectedPatient(patient);
      setNewPatient(false);
      showToast('Patient created successfully!');
    } catch (error) {
      showToast('Error creating patient', 'error');
    }
  };

  const guideText = "Welcome to New Test page. Here you can create a new H. pylori detection test. First, select an existing patient or create a new patient. Enter the patient's name, age, gender, email, and phone. Then, you can either upload an image of the nanopaper test, or click Generate Random to create a random signal for testing. The system will analyze the signal and show the prediction: Positive means H. pylori infection detected, Negative means no infection. You can also see the confidence level and the nanopaper color. Click Save to save the test to the database.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">New Test</h1>
          <p className="text-slate-400 text-sm mt-1">Run a new H. pylori detection test</p>
        </div>
        <button
          onClick={() => speak(guideText)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          title="Listen to guide"
        >
          <Volume2 className="w-4 h-4" />
          Guide
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Select Patient</h2>

          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setNewPatient(false); setSelectedPatient(null); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                !newPatient ? 'bg-primary-700 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Existing Patient
            </button>
            <button
              onClick={() => { setNewPatient(true); setSelectedPatient(null); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                newPatient ? 'bg-primary-700 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              New Patient
            </button>
          </div>

          {!newPatient ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                    selectedPatient?.id === patient.id
                      ? 'bg-primary-700/50 border border-primary-600/50'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-700/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{patient.name}</p>
                    <p className="text-xs text-slate-400">{patient.age} years • {patient.gender}</p>
                  </div>
                </button>
              ))}
              {patients.length === 0 && (
                <p className="text-center text-slate-400 py-4">No patients. Create a new one.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Patient Name *"
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-primary-600"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Age *"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-primary-600"
                />
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-primary-600"
              />
              <button
                onClick={handleCreatePatient}
                className="w-full py-2 bg-primary-700 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
              >
                Create Patient
              </button>
            </div>
          )}
        </div>

        {/* Test Type Selection */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Test Type</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="py-3 bg-teal-600 text-white rounded-xl font-medium"
            >
              Nanopaper Test
            </button>
            <button
              type="button"
              onClick={() => showToast('Coming soon!', 'info')}
              className="py-3 bg-slate-700 text-slate-400 rounded-xl font-medium"
            >
              Blood Test
            </button>
            <button
              type="button"
              onClick={() => showToast('Coming soon!', 'info')}
              className="py-3 bg-slate-700 text-slate-400 rounded-xl font-medium"
            >
              Stool Test
            </button>
            <button
              type="button"
              onClick={() => showToast('Coming soon!', 'info')}
              className="py-3 bg-slate-700 text-slate-400 rounded-xl font-medium"
            >
              Breath Test
            </button>
          </div>
        </div>

        {/* Signal Input */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Binary Signal Input</h2>

          <div className="space-y-4">
            {/* Generate Random Button */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGenerateRandom}
                className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Random
              </button>
              <label className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploadingImage ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
                Upload Image
              </label>
            </div>

            {/* Signal Input */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Binary Signal (comma-separated 0s and 1s)</label>
              <textarea
                value={binarySignal}
                onChange={(e) => setBinarySignal(e.target.value)}
                placeholder="0,1,0,0,1,1,0,..."
                className="w-full h-32 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:border-primary-600 resize-none"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !binarySignal.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-700 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {analyzing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Analyze Signal
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Analysis Results</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prediction */}
            <div className="bg-slate-700/50 rounded-xl p-5 text-center">
              <div className="flex justify-center mb-3">
                {analysis.prediction === 'Positive' ? (
                  <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm mb-1">Prediction</p>
              <p className={`text-2xl font-bold ${
                analysis.prediction === 'Positive' ? 'text-red-400' : 'text-green-400'
              }`}>
                {analysis.prediction}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {analysis.prediction === 'Positive' ? 'H. pylori Detected' : 'No Infection Detected'}
              </p>
            </div>

            {/* Confidence */}
            <div className="bg-slate-700/50 rounded-xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-primary-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">Confidence</p>
              <p className="text-2xl font-bold text-white">{analysis.confidence}%</p>
              <p className="text-xs text-slate-500 mt-1">Model confidence level</p>
            </div>

            {/* Nanopaper Color */}
            <div className="bg-slate-700/50 rounded-xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className={`w-14 h-14 rounded-full ${
                  analysis.nanopaper_color === 'Yellow' ? 'bg-amber-400' : 'bg-amber-800'
                }`}></div>
              </div>
              <p className="text-slate-400 text-sm mb-1">Nanopaper Color</p>
              <p className="text-2xl font-bold text-white">{analysis.nanopaper_color}</p>
              <p className="text-xs text-slate-500 mt-1">
                {analysis.nanopaper_color === 'Yellow' ? 'Normal (No Infection)' : 'Abnormal (Infection Present)'}
              </p>
            </div>
          </div>

          {/* Signal Visualization */}
          <div className="mt-6 bg-slate-700/50 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Signal Visualization</p>
            <div className="flex flex-wrap gap-0.5">
              {binarySignal.split(',').slice(0, 80).map((bit, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-4 rounded-sm ${
                    bit.trim() === '1' ? 'bg-primary-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            {binarySignal.split(',').length > 80 && (
              <p className="text-xs text-slate-500 mt-2">Showing first 80 bits of {binarySignal.split(',').length}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveTest}
              disabled={saving || !selectedPatient}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Test Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTest;