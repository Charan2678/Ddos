import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Activity, 
  Play, 
  FileSpreadsheet, 
  History as HistoryIcon, 
  ShieldCheck, 
  LogOut,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Live Monitor', path: '/app/live-monitoring', icon: Activity, adminOnly: false },
    { name: 'Inference Panel', path: '/app/predict', icon: Play, adminOnly: false },
    { name: 'Reports', path: '/app/reports', icon: FileSpreadsheet, adminOnly: false },
    { name: 'History Logs', path: '/app/history', icon: HistoryIcon, adminOnly: false },
    { name: 'Admin Console', path: '/app/admin', icon: ShieldCheck, adminOnly: true },
  ];

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-premium">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none text-slate-800">DDoS Shield</h1>
            <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">ML Detection</span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm border-l-4 border-blue-600 pl-3'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3 px-2 py-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 uppercase">
            {user?.username?.substring(0, 2) || 'OP'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-none mb-1">
              {user?.username || 'Operator'}
            </p>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
              isAdmin 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              {isAdmin ? 'System Admin' : 'Security Analyst'}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-100"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
