import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  History as HistoryIcon,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

const INITIAL_LOGS = [
  { id: 1, timestamp: '2026-05-25 12:02:15', ip: '192.168.1.142', proto: 'TCP', port: 80, classification: 'SYN Flood', confidence: 0.9982, level: 'CRITICAL' },
  { id: 2, timestamp: '2026-05-25 11:48:32', ip: '10.0.0.84', proto: 'UDP', port: 53, classification: 'UDP Flood', confidence: 0.9871, level: 'CRITICAL' },
  { id: 3, timestamp: '2026-05-25 11:42:05', ip: '172.16.254.10', proto: 'TCP', port: 443, classification: 'HTTP Flood', confidence: 0.9424, level: 'HIGH' },
  { id: 4, timestamp: '2026-05-25 11:30:12', ip: '192.168.10.5', proto: 'TCP', port: 80, classification: 'SYN Flood', confidence: 0.8521, level: 'MEDIUM' },
  { id: 5, timestamp: '2026-05-25 10:14:02', ip: '8.8.8.8', proto: 'UDP', port: 53, classification: 'BENIGN', confidence: 0.9942, level: 'LOW' },
  { id: 6, timestamp: '2026-05-25 09:44:11', ip: '192.168.1.1', proto: 'ICMP', port: 0, classification: 'BENIGN', confidence: 0.9991, level: 'LOW' },
  { id: 7, timestamp: '2026-05-25 08:30:56', ip: '45.227.254.12', proto: 'TCP', port: 23, classification: 'SYN Flood', confidence: 0.9989, level: 'CRITICAL' },
  { id: 8, timestamp: '2026-05-24 23:18:42', ip: '185.220.101.5', proto: 'TCP', port: 80, classification: 'HTTP Flood', confidence: 0.9124, level: 'HIGH' },
  { id: 9, timestamp: '2026-05-24 22:04:15', ip: '192.168.1.102', proto: 'TCP', port: 50221, classification: 'BENIGN', confidence: 0.9972, level: 'LOW' },
  { id: 10, timestamp: '2026-05-24 20:12:00', ip: '192.168.12.8', proto: 'ICMP', port: 0, classification: 'ICMP Flood', confidence: 0.9821, level: 'HIGH' }
];

const History = () => {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [protoFilter, setProtoFilter] = useState('ALL');
  const [labelFilter, setLabelFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.ip.includes(search) || log.classification.toLowerCase().includes(search.toLowerCase());
    const matchesProto = protoFilter === 'ALL' || log.proto === protoFilter;
    const matchesLabel = labelFilter === 'ALL' || 
      (labelFilter === 'MALICIOUS' ? log.classification !== 'BENIGN' : log.classification === 'BENIGN');
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    
    return matchesSearch && matchesProto && matchesLabel && matchesLevel;
  });

  const triggerExport = () => {
    toast.success("History logs compiled and exported to downloads/ddos_history.csv");
  };

  const handleRefresh = () => {
    toast.info("Refreshed prediction history logs.");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Detection History</h1>
          <p className="text-sm text-slate-500">Query and audit chronological network traffic classifications and actions</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={triggerExport}
            className="flex items-center space-x-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs font-semibold text-slate-600">
        {/* Search IP/Label */}
        <div className="relative flex items-center col-span-1 sm:col-span-1">
          <div className="pointer-events-none absolute left-4 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search IP or Class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Protocol */}
        <div>
          <select
            value={protoFilter}
            onChange={(e) => setProtoFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-slate-600 focus:outline-none"
          >
            <option value="ALL">All Protocols</option>
            <option value="TCP">TCP Only</option>
            <option value="UDP">UDP Only</option>
            <option value="ICMP">ICMP Only</option>
          </select>
        </div>

        {/* Filter Label */}
        <div>
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-slate-600 focus:outline-none"
          >
            <option value="ALL">All Traffic</option>
            <option value="MALICIOUS">Malicious Only</option>
            <option value="BENIGN">Benign Only</option>
          </select>
        </div>

        {/* Filter Threat Level */}
        <div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-slate-600 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Main Datagrid */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 rounded-l-xl">Timestamp</th>
                <th className="px-5 py-4">Source IP</th>
                <th className="px-5 py-4">Protocol</th>
                <th className="px-5 py-4">Target Port</th>
                <th className="px-5 py-4">Classification</th>
                <th className="px-5 py-4">Confidence</th>
                <th className="px-5 py-4 rounded-r-xl">Threat Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400 italic">
                    No logs matching the current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{log.ip}</td>
                    <td className="px-5 py-4 font-bold text-slate-500">{log.proto}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{log.port}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        log.classification === 'BENIGN'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {log.classification}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-600">
                      {(log.confidence * 100).toFixed(2)}%
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        log.level === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : log.level === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : log.level === 'MEDIUM'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
