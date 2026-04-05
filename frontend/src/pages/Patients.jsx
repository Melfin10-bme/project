import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, User, Mail, Phone, Calendar, Trash2, Edit, ChevronRight, Volume2, Pill } from 'lucide-react';
import { getPatients, deletePatient, getTests, updatePatientTreatment } from '../services/api';
import { speak } from '../components/TextToSpeech';

function Patients({ showToast }) {
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [treatingPatient, setTreatingPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', email: '', phone: '', address: ''
  });
  const [treatmentData, setTreatmentData] = useState({
    treatmentStatus: 'pending',
    treatmentStartDate: '',
    treatmentEndDate: '',
    treatmentNotes: '',
    antibiotics: ''
  });

  const fetchData = async () => {
    try {
      const [patientsData, testsData] = await Promise.all([getPatients(), getTests()]);
      setPatients(patientsData);
      setTests(testsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPatientTests = (patientId) => {
    return tests.filter(t => t.patientId === patientId);
  };

  const getLatestResult = (patientId) => {
    const patientTests = getPatientTests(patientId);
    if (patientTests.length === 0) return null;
    return patientTests[patientTests.length - 1];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        const { updatePatient } = await import('../services/api');
        await updatePatient(editingPatient.id, formData);
        showToast('Patient updated successfully!');
      } else {
        const { createPatient } = await import('../services/api');
        await createPatient(formData);
        showToast('Patient created successfully!');
      }
      setShowModal(false);
      setEditingPatient(null);
      setFormData({ name: '', age: '', gender: 'Male', email: '', phone: '', address: '' });
      fetchData();
    } catch (error) {
      showToast('Error saving patient', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      await deletePatient(id);
      showToast('Patient deleted successfully!');
      fetchData();
    } catch (error) {
      showToast('Error deleting patient', 'error');
    }
  };

  const openTreatmentModal = (patient) => {
    setTreatingPatient(patient);
    setTreatmentData({
      treatmentStatus: patient.treatmentStatus || 'pending',
      treatmentStartDate: patient.treatmentStartDate || '',
      treatmentEndDate: patient.treatmentEndDate || '',
      treatmentNotes: patient.treatmentNotes || '',
      antibiotics: patient.antibiotics || ''
    });
    setShowTreatmentModal(true);
  };

  const handleTreatmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePatientTreatment(treatingPatient.id, treatmentData);
      showToast('Treatment updated successfully!');
      setShowTreatmentModal(false);
      setTreatingPatient(null);
      fetchData();
    } catch (error) {
      showToast('Error updating treatment', 'error');
    }
  };

  const getTreatmentBadge = (status) => {
    const styles = {
      pending: 'bg-slate-500/20 text-slate-400',
      in_progress: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      failed: 'Failed'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || 'Pending'}
      </span>
    );
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || ''
    });
    setShowModal(true);
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const guideText = "Welcome to the Patients page. Here you can manage all patient records. Use the search bar to find patients by name, email, or phone. Click Add Patient to create a new patient record. Click on a patient row to view their profile and test history. You can also edit or delete patient records using the buttons on each row.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-slate-400 text-sm mt-1">Manage patient records and test history</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => speak(guideText)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
            title="Listen to guide"
          >
            <Volume2 className="w-4 h-4" />
            Guide
          </button>
          <button
            onClick={() => { setEditingPatient(null); setFormData({ name: '', age: '', gender: 'Male', email: '', phone: '', address: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="skeleton h-6 w-3/4 rounded mb-3"></div>
              <div className="skeleton h-4 w-1/2 rounded mb-4"></div>
              <div className="skeleton h-4 w-full rounded"></div>
            </div>
          ))
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const latestTest = getLatestResult(patient.id);
            return (
              <div key={patient.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-700/50 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{patient.name}</h3>
                      <p className="text-sm text-slate-400">{patient.age} years • {patient.gender}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openTreatmentModal(patient)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Treatment">
                      <Pill className="w-4 h-4 text-purple-400" />
                    </button>
                    <button onClick={() => openEditModal(patient)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(patient.id)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Latest Test Result */}
                {latestTest && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Latest Test</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        latestTest.prediction === 'Positive'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {latestTest.prediction}
                      </span>
                    </div>
                  </div>
                )}

                {/* Treatment Status */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Treatment</span>
                  {getTreatmentBadge(patient.treatmentStatus)}
                </div>

                <Link
                  to={`/patients/${patient.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-300 transition-colors"
                >
                  View Profile
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <User className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-400">No patients found</h3>
            <p className="text-slate-500 mt-1">Add a new patient or adjust your search</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPatient ? 'Edit Patient' : 'Add New Patient'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-700 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                >
                  {editingPatient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Treatment Modal */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Treatment for {treatingPatient?.name}
            </h2>
            <form onSubmit={handleTreatmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={treatmentData.treatmentStatus}
                  onChange={(e) => setTreatmentData({ ...treatmentData, treatmentStatus: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={treatmentData.treatmentStartDate}
                    onChange={(e) => setTreatmentData({ ...treatmentData, treatmentStartDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={treatmentData.treatmentEndDate}
                    onChange={(e) => setTreatmentData({ ...treatmentData, treatmentEndDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Antibiotics</label>
                <input
                  type="text"
                  value={treatmentData.antibiotics}
                  onChange={(e) => setTreatmentData({ ...treatmentData, antibiotics: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  placeholder="e.g., Amoxicillin, Clarithromycin"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={treatmentData.treatmentNotes}
                  onChange={(e) => setTreatmentData({ ...treatmentData, treatmentNotes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-primary-600"
                  rows={3}
                  placeholder="Treatment notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTreatmentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors"
                >
                  Save Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;