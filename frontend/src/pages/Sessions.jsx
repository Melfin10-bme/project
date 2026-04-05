import { useState, useEffect } from 'react';
import { Shield, Trash2, Clock, User, AlertTriangle } from 'lucide-react';
import { getSessions, revokeSession } from '../services/api';

function Sessions({ showToast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      showToast(error.message || 'Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to force logout this session?')) return;

    try {
      await revokeSession(sessionId);
      showToast('Session revoked successfully');
      fetchSessions();
    } catch (error) {
      showToast('Failed to revoke session', 'error');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400',
      doctor: 'bg-blue-500/20 text-blue-400',
      lab_technician: 'bg-green-500/20 text-green-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-slate-500/20 text-slate-400'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Session Management</h1>
        <p className="text-slate-400 text-sm mt-1">View and manage active user sessions</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm">
            Admins can view all active sessions and force logout any session. This is useful for security purposes when users leave their accounts logged in.
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">User</th>
              <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Role</th>
              <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Created</th>
              <th className="text-left text-slate-400 text-sm font-medium px-4 py-3">Last Activity</th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading sessions...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No active sessions found
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-white font-medium">{session.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getRoleBadge(session.role)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(session.lastActivity).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Revoke session"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Sessions;