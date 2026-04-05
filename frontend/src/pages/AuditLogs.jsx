import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';

function AuditLogs({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      showToast(error.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-emerald-700',
      read: 'bg-blue-700',
      update: 'bg-amber-700',
      delete: 'bg-red-700',
      login: 'bg-purple-700',
      logout: 'bg-slate-700',
    };
    return colors[action] || 'bg-slate-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400">Track all system activity and data access</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-400">Loading...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400">No audit logs found</div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{log.username}</div>
                      <div className="text-xs text-slate-500">{log.userId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)} text-white`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{log.resourceType}</div>
                      {log.resourceId && (
                        <div className="text-xs text-slate-500">{log.resourceId.substring(0, 8)}...</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;