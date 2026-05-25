import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar, 
  Filter, 
  Clock, 
  Loader2, 
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Reports = () => {
  const [compiling, setCompiling] = useState(false);
  const [dateRange, setDateRange] = useState('24h');
  const [reportType, setReportType] = useState('pdf');
  const [scope, setScope] = useState('all');

  const [reportsList, setReportsList] = useState([
    { id: 1, title: 'DDoS Attack Summary Report - May 24', date: '2026-05-24 18:30:12', creator: 'admin', type: 'PDF', size: '1.4 MB' },
    { id: 2, title: 'Intrusion Detection Telemetry Log - May 24', date: '2026-05-24 10:15:45', creator: 'analyst', type: 'CSV', size: '28.4 MB' },
    { id: 3, title: 'Model Accuracy Evaluation Report - Q2', date: '2026-05-22 09:00:00', creator: 'admin', type: 'PDF', size: '3.1 MB' },
    { id: 4, title: 'SYN Anomaly Audit Feed - May 20', date: '2026-05-20 14:24:18', creator: 'analyst', type: 'CSV', size: '8.2 MB' }
  ]);

  // Handle Compile Report
  const handleCompileReport = (e) => {
    e.preventDefault();
    setCompiling(true);

    setTimeout(() => {
      const typeLabel = reportType.toUpperCase();
      const scopeLabel = scope === 'all' ? 'Full Security Summary' : scope === 'ml' ? 'ML Metrics Audit' : 'Threat logs feed';
      
      const newReport = {
        id: Date.now(),
        title: `${scopeLabel} (${dateRange.toUpperCase()}) - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        creator: 'admin',
        type: typeLabel,
        size: typeLabel === 'PDF' ? '1.8 MB' : '420 KB'
      };

      setReportsList(prev => [newReport, ...prev]);
      setCompiling(false);
      toast.success("Security report compiled successfully!");
    }, 1800);

    // Backend integration
    try {
      // axios.post('http://localhost:8000/api/generate-report', { range: dateRange, format: reportType, scope });
    } catch (e) {
      console.warn("Backend offline, using local compiler mock.");
    }
  };

  // Mock download action
  const triggerDownload = (report) => {
    toast.success(`Download started: ${report.title}.${report.type.toLowerCase()}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Reports</h1>
        <p className="text-sm text-slate-500">Compile audit records, threat statistics, and classifier accuracies into documents</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Report Compiler Controller */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Generate New Report</span>
          </h3>

          <form onSubmit={handleCompileReport} className="space-y-5">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Document Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportType('pdf')}
                  className={`flex items-center justify-center space-x-2 rounded-xl border p-3.5 text-xs font-bold transition-all ${
                    reportType === 'pdf'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-600'
                      : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('csv')}
                  className={`flex items-center justify-center space-x-2 rounded-xl border p-3.5 text-xs font-bold transition-all ${
                    reportType === 'csv'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-600'
                      : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV Spreadsheet</span>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Report Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Full Audit: Attacks & ML Metrics</option>
                <option value="attacks">Threat Log History Only</option>
                <option value="ml">Classifier Accuracies & Benchmarks</option>
              </select>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Time Interval
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '24h', label: 'Last 24h' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last Month' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateRange(item.id)}
                    className={`rounded-xl border py-2 text-[10px] font-bold transition-all ${
                      dateRange === item.id
                        ? 'border-blue-500 bg-blue-50/30 text-blue-600'
                        : 'border-slate-200 bg-slate-50/20 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compile Submit Button */}
            <button
              type="submit"
              disabled={compiling}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
            >
              {compiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling Audit Data...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Compile Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Reports History List (2 columns) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Compiled Document Registry</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 rounded-l-xl">Document Name</th>
                  <th className="px-5 py-3">Creation Date</th>
                  <th className="px-5 py-3">Compiled By</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3 rounded-r-xl text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsList.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-bold text-slate-700 flex items-center space-x-2.5">
                      <span className={`inline-flex items-center rounded-lg p-1.5 ${
                        report.type === 'PDF' 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        {report.type === 'PDF' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      </span>
                      <span className="truncate block max-w-56" title={report.title}>{report.title}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{report.date}</td>
                    <td className="px-5 py-4 font-medium text-slate-600 uppercase">{report.creator}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{report.size}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => triggerDownload(report)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
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

export default Reports;
