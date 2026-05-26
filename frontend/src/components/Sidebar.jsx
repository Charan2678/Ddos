import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Activity, 
  Play, 
  FileSpreadsheet, 
  History as HistoryIcon, 
  ShieldCheck, 
  LogOut,
  ShieldAlert,
  Menu,
  ChevronLeft
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const Sidebar = ({ isOpen = true, setIsOpen }) => {
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
    <aside className={`fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-slate-200 bg-white shadow-premium transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Brand Header */}
      <div className={`flex items-center border-b border-slate-100 ${isOpen ? 'h-20 px-6 justify-between' : 'py-6 px-0 justify-center flex-col space-y-4'}`}>
        {isOpen ? (
          <Link to="/" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center">
              <img src={logoImg} alt="DDoS Shield Logo" className="h-full w-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none text-slate-800">DDoS Shield</h1>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">ML Detection</span>
            </div>
          </Link>
        ) : (
          <Link to="/" className="flex h-8 w-8 items-center justify-center hover:opacity-80 transition-opacity" title="Home">
            <img src={logoImg} alt="Logo" className="h-full w-full object-contain drop-shadow-md" />
          </Link>
        )}

        {/* Toggle Button */}
        {setIsOpen && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md ${
              isOpen ? 'h-9 w-9' : 'h-10 w-10 mt-3'
            }`}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={!isOpen ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${isOpen ? 'space-x-3' : 'justify-center'} ${
                  isActive
                    ? `bg-blue-50 text-blue-600 shadow-sm border-blue-600 ${isOpen ? 'border-l-4 pl-2' : 'border-l-4'}`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className={`border-t border-slate-100 bg-slate-50/50 ${isOpen ? 'p-4' : 'p-3 flex flex-col items-center'}`}>
        {isOpen ? (
          <div className="flex items-center space-x-3 px-2 py-1.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 uppercase">
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
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 uppercase" title={user?.username || 'Operator'}>
            {user?.username?.substring(0, 2) || 'OP'}
          </div>
        )}
        
        <button
          onClick={logout}
          title="Sign Out"
          className={`mt-3 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-100 ${isOpen ? 'w-full space-x-2 px-4 py-2.5' : 'w-10 h-10 p-0 shrink-0'}`}
        >
          <LogOut className="h-4 w-4" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
