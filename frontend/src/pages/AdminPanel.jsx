import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Terminal, 
  Trash2, 
  AlertTriangle,
  RotateCcw,
  UserX,
  UserPlus
} from 'lucide-react';
import { toast } from 'react-toastify';

const INITIAL_USERS = [
  { id: 1, username: 'admin', email: 'admin@shield.com', role: 'System Admin', created: '2026-05-20' },
  { id: 2, username: 'analyst_john', email: 'john@shield.com', role: 'Security Analyst', created: '2026-05-24' },
  { id: 3, username: 'operator_kelly', email: 'kelly@shield.com', role: 'Security Analyst', created: '2026-05-25' }
];

const INITIAL_AUDITS = [
  { id: 1, timestamp: '2026-05-25 12:10:42', actor: 'admin', action: 'SNIFFER_INITIALIZED', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 2, timestamp: '2026-05-25 11:58:12', actor: 'analyst_john', action: 'REPORT_DOWNLOADED', ip: '192.168.1.14', status: 'SUCCESS' },
  { id: 3, timestamp: '2026-05-25 11:02:18', actor: 'admin', action: 'MODEL_RETRAIN_TRIGGERED', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 4, timestamp: '2026-05-24 18:30:15', actor: 'operator_kelly', action: 'OPERATOR_REGISTERED', ip: '192.168.1.28', status: 'SUCCESS' }
];

const AdminPanel = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [audits, setAudits] = useState(INITIAL_AUDITS);

  // User Deletion Handler
  const handleDeleteUser = (userId, username) => {
    if (username === 'admin') {
      toast.error("Cannot revoke main administrator rights.");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success(`Access revoked for operator: ${username}`);
  };

  // Platform Actions
  const handlePurgeCache = () => {
    toast.success("Dataset and reports cache directories purged.");
  };

  const handleWipeHistory = () => {
    const confirm = window.confirm("🚨 WARNING: This action will permanently delete all historic traffic predictions. Do you wish to proceed?");
    if (confirm) {
      toast.success("Prediction logs cleared.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
        <p className="text-sm text-slate-500">Manage security operators, audit configurations, and platform caches</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Operator User Management (2 columns) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Active Operators</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Username</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 rounded-r-xl text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-bold text-slate-800">{u.username}</td>
                    <td className="px-5 py-4 font-medium text-slate-600">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        u.role === 'System Admin' 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{u.created}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={u.username === 'admin'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Revoke operator rights"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Maintenance Controls */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            <span>Platform Controls</span>
          </h3>

          <div className="space-y-4">
            {/* Purge Caches */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Clear Upload Caches</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Deletes local datasets/reports</p>
              </div>
              <button
                onClick={handlePurgeCache}
                className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge</span>
              </button>
            </div>

            {/* Wipe History logs */}
            <div className="border border-red-100 rounded-2xl p-4 bg-red-50/20 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-red-800">Wipe Logs & Predictions</h4>
                <p className="text-[10px] text-red-500 mt-0.5">Destructive: deletes SQL tables</p>
              </div>
              <button
                onClick={handleWipeHistory}
                className="flex items-center space-x-1 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-bold text-white transition-colors shadow-md shadow-red-500/10"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Wipe</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Logs Audit Trail (3 columns span) */}
        <div className="rounded-3xl border border-slate-200/80 bg-slate-900 p-6 shadow-premium lg:col-span-3 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Terminal className="h-5 w-5 text-blue-400" />
            <span className="font-mono text-slate-300">security_audit_trail.log</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400 font-mono">
              <thead className="bg-slate-850 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User/Actor</th>
                  <th className="px-5 py-3">Event Action</th>
                  <th className="px-5 py-3">Origin IP</th>
                  <th className="px-5 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">{a.timestamp}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-300">{a.actor}</td>
                    <td className="px-5 py-3.5 text-blue-400">{a.action}</td>
                    <td className="px-5 py-3.5 text-slate-400">{a.ip}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900 rounded px-1 py-0.5 text-[10px] font-bold">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
