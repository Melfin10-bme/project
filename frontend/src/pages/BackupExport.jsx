import { useState } from 'react';
import { exportBackup, exportPatientsCSV } from '../services/api';

function BackupExport({ showToast }) {
  const [loading, setLoading] = useState(false);

  const handleExportJSON = async () => {
    setLoading(true);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup exported successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Export failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const data = await exportPatientsCSV();
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('Patients CSV exported successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Export failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Backup & Export</h1>
        <p className="text-slate-400">Export system data for backup or analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON Backup */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary-700/50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Full Backup (JSON)</h3>
              <p className="text-slate-400 text-sm">Export all system data</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Download a complete backup of all patients, tests, users, and reports in JSON format.
          </p>
          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export Backup'}
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-700/50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Patients CSV</h3>
              <p className="text-slate-400 text-sm">Export patient data</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Export all patient information to a CSV file for analysis in Excel or other tools.
          </p>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackupExport;