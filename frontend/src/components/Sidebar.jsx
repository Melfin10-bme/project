import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  BarChart3,
  FileText,
  Activity,
  Settings,
  LogOut,
  Shield,
  Calendar,
  Bell,
  Download,
  QrCode,
  Clock,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/patients', icon: Users, label: 'Patients' },
  { path: '/appointments', icon: Calendar, label: 'Appointments' },
  { path: '/new-test', icon: FlaskConical, label: 'New Test' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/reports', icon: FileText, label: 'Reports' },
];

const adminNavItems = [
  { path: '/users', icon: Shield, label: 'Users' },
  { path: '/backup', icon: Download, label: 'Backup & Export' },
  { path: '/audit', icon: Activity, label: 'Audit Logs' },
  { path: '/sessions', icon: Clock, label: 'Sessions' },
];

function Sidebar({ isOpen, setIsOpen, user, onLogout }) {
  const isAdmin = user?.role === 'Admin' || user?.role === 'Doctor';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-800 border-r border-slate-700 transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <div>
              <h1 className="text-sm font-bold text-white">H. pylori</h1>
              <p className="text-xs text-slate-400">Detection System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-700/50 text-primary-300 border border-primary-600/50'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}

        {/* Admin-only items */}
        {isAdmin && adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-700/50 text-primary-300 border border-primary-600/50'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600/50">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-primary-400">{user?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;