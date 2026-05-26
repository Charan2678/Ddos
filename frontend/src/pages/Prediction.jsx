import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Upload, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  AlertTriangle,
  HelpCircle,
  FileText,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Prediction = () => {
  const [activeTab, setActiveTab] = useState('manual'); // manual | batch
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Manual Input state
  const [flowDuration, setFlowDuration] = useState('1500');
  const [totFwdPkts, setTotFwdPkts] = useState('24');
  const [totBwdPkts, setTotBwdPkts] = useState('18');
  const [fwdPktLenMean, setFwdPktLenMean] = useState('340');
  const [bwdPktLenMean, setBwdPktLenMean] = useState('210');
  const [flowByts, setFlowByts] = useState('8800');
  const [flowPkts, setFlowPkts] = useState('28');
  const [synFlag, setSynFlag] = useState('0');
  const [protocol, setProtocol] = useState('6'); // 6 for TCP, 17 for UDP

  // Batch states
  const [batchFile, setBatchFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);

  // Form Submit Handler
  const handlePredict = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const inputData = {
      Flow_Duration: parseFloat(flowDuration),
      Tot_Fwd_Pkts: parseInt(totFwdPkts),
      Tot_Bwd_Pkts: parseInt(totBwdPkts),
      Fwd_Pkt_Len_Mean: parseFloat(fwdPktLenMean),
      Bwd_Pkt_Len_Mean: parseFloat(bwdPktLenMean),
      Flow_Byts_s: parseFloat(flowByts),
      Flow_Pkts_s: parseFloat(flowPkts),
      SYN_Flag_Cnt: parseInt(synFlag),
      Protocol: parseInt(protocol)
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/predict', { input_data: inputData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { prediction_label, confidence, threat_level } = response.data;
      
      let action = 'Passed';
      if (threat_level === 'CRITICAL') action = 'Flow Blocked & Port Isolated';
      else if (threat_level === 'HIGH') action = 'IP Blocked & Challenged via CAPTCHA';
      
      setResult({
        label: prediction_label,
        confidence: confidence,
        severity: threat_level,
        action: action,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        inputs: inputData,
        modelName: response.data.model_name,
        modelAlgorithm: response.data.model_algorithm
      });

      if (prediction_label === 'BENIGN') {
        toast.success("Traffic flow classified as clean.");
      } else {
        toast.error(`⚠️ Alert: Malicious ${prediction_label} Flow Identified!`, {
          icon: <AlertTriangle className="text-red-500" />
        });
      }
    } catch (e) {
      toast.error("Prediction failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Batch CSV Prediction Handler
  const handleBatchFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error("Format error. Batch file must be a CSV dataset.");
        return;
      }
      setBatchFile(file);
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://127.0.0.1:8000/api/predict/batch', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const data = response.data;
        setBatchResults({
          fileName: data.file_name,
          scanned: data.total_scanned,
          benign: data.benign_count,
          attacks: data.attack_count,
          types: data.attack_types,
          anomalies: data.anomalies,
          modelName: data.model_name,
          modelAlgorithm: data.model_algorithm
        });
        
        if (data.attack_count > 0) {
          toast.error(`Batch run complete: ${data.attack_count} anomalies isolated.`);
        } else {
          toast.success("Batch run complete: No anomalies found.");
        }
      } catch (err) {
        toast.error("Batch prediction failed: " + (err.response?.data?.detail || err.message));
      } finally {
        setSubmitting(false);
        e.target.value = null; // reset input
      }
    }
  };

  const handleDownloadCSV = () => {
    if (!batchResults || !batchResults.anomalies) return;
    
    const headers = ["Source IP", "Classification", "Threat Level", "Confidence"];
    const rows = batchResults.anomalies.map(a => [
      a.source_ip,
      a.prediction_label,
      a.threat_level,
      `${(a.confidence * 100).toFixed(2)}%`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ddos_anomalies_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!batchResults || !batchResults.anomalies) return;

    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text("DDoS Shield: Network Threat Report", 14, 22);
    
    // Add Subtitle
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 35, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text("Scan Summary", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Target File: ${batchResults.fileName}`, 20, 56);
    doc.text(`Total Flows Scanned: ${batchResults.scanned.toLocaleString()}`, 20, 63);
    
    // Colored stats
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Clean / Benign: ${batchResults.benign.toLocaleString()}`, 110, 56);
    
    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`Malicious Detected: ${batchResults.attacks.toLocaleString()}`, 110, 63);
    
    // Attack breakdown table if exists
    let startY = 85;
    if (batchResults.attacks > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Threat Vector Breakdown", 14, 85);
      
      const breakdownRows = Object.keys(batchResults.types).map(type => [
        type, 
        `${batchResults.types[type]} incidents`
      ]);
      
      autoTable(doc, {
        startY: 90,
        head: [['Attack Classification', 'Volume']],
        body: breakdownRows,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 10 }
      });
      
      startY = doc.lastAutoTable.finalY + 15;
    }
    
    // Anomalies Table
    if (batchResults.anomalies.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Identified Attack Sources", 14, startY);
      
      const anomalyRows = batchResults.anomalies.map(a => [
        a.source_ip,
        a.prediction_label,
        a.threat_level,
        `${(a.confidence * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Source IP', 'Classification', 'Threat Level', 'AI Confidence']],
        body: anomalyRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        styles: { fontSize: 9 }
      });
    }
    
    doc.save(`DDoS_Shield_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inference Console</h1>
        <p className="text-sm text-slate-500">Query the trained champion model with network parameters to classify traffic</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('manual'); setResult(null); }}
          className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
            activeTab === 'manual' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Single Flow Analysis
        </button>
        <button
          onClick={() => { setActiveTab('batch'); setBatchResults(null); }}
          className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
            activeTab === 'batch' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Batch CSV Prediction
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Input Controls */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'manual' ? (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium"
              >
                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Enter Network Header Values</span>
                </h3>

                <form onSubmit={handlePredict} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Protocol</label>
                      <select 
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-semibold text-slate-600 focus:outline-none"
                      >
                        <option value="6">TCP (Protocol 6)</option>
                        <option value="17">UDP (Protocol 17)</option>
                        <option value="1">ICMP (Protocol 1)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Flow Duration (μs)</label>
                      <input 
                        type="number" required value={flowDuration} onChange={(e) => setFlowDuration(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">SYN Flag Count</label>
                      <select 
                        value={synFlag}
                        onChange={(e) => setSynFlag(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-semibold text-slate-600 focus:outline-none"
                      >
                        <option value="0">0 (SYN Flag Off)</option>
                        <option value="1">1 (SYN Flag On)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Fwd Packets / sec</label>
                      <input 
                        type="number" required value={flowPkts} onChange={(e) => setFlowPkts(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Total Fwd Packets</label>
                      <input 
                        type="number" required value={totFwdPkts} onChange={(e) => setTotFwdPkts(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Total Bwd Packets</label>
                      <input 
                        type="number" required value={totBwdPkts} onChange={(e) => setTotBwdPkts(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Flow Bytes / sec</label>
                      <input 
                        type="number" required value={flowByts} onChange={(e) => setFlowByts(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Fwd Packet Len Mean</label>
                      <input 
                        type="number" required value={fwdPktLenMean} onChange={(e) => setFwdPktLenMean(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1.5">Bwd Packet Len Mean</label>
                      <input 
                        type="number" required value={bwdPktLenMean} onChange={(e) => setBwdPktLenMean(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Querying Classifier...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="h-4 w-4" />
                        <span>Evaluate Network Flow</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="batch"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6"
              >
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span>Batch Prediction</span>
                </h3>

                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-slate-50/50 group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBatchFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Batch Network Capture CSV</p>
                      <p className="text-[10px] text-slate-400 mt-1">Estimates predictions for thousands of flows in parallel</p>
                    </div>
                  </div>
                </div>

                {submitting && (
                  <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Evaluating batch matrix features...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prediction Outputs */}
        <div className="lg:col-span-2">
          {/* Manual Result Card */}
          {activeTab === 'manual' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6"
            >
              <div className="text-center pb-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Classification Result</h4>
                <div className="flex justify-center mb-2">
                  {result.label === 'BENIGN' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 animate-pulse">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <h2 className={`text-2xl font-extrabold tracking-tight ${result.label === 'BENIGN' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.label}
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Evaluated at {result.timestamp}</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Detection Engine:</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {result.modelName} ({result.modelAlgorithm})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Model Confidence:</span>
                  <span className="text-slate-800 font-bold">{(result.confidence * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Threat Level:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    result.severity === 'CRITICAL'
                      ? 'bg-red-600 text-white'
                      : result.severity === 'HIGH'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {result.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Defense Action Triggered:</span>
                  <span className={`font-bold block p-2.5 rounded-xl border ${
                    result.label === 'BENIGN' 
                      ? 'bg-emerald-50/30 text-emerald-700 border-emerald-100'
                      : 'bg-red-50/30 text-red-700 border-red-100'
                  }`}>
                    {result.action}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Batch Results Card */}
          {activeTab === 'batch' && batchResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Batch Summary</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center space-x-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-1.5 text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF Report</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Detection Engine:</span>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {batchResults.modelName} ({batchResults.modelAlgorithm})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">File Scanned:</span>
                  <span className="text-slate-800 font-bold max-w-40 truncate">{batchResults.fileName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Total flows:</span>
                  <span className="text-slate-800 font-bold">{batchResults.scanned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Clean Flows:</span>
                  <span className="text-emerald-600 font-bold">{batchResults.benign.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-semibold">Malicious Isolated:</span>
                  <span className="text-red-600 font-extrabold">{batchResults.attacks}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Attack Type Breakdown:</span>
                {Object.keys(batchResults.types).map(type => (
                  <div key={type} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-600">{type}</span>
                    <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded text-[10px] border border-red-100">
                      {batchResults.types[type]} attacks
                    </span>
                  </div>
                ))}
              </div>

              {batchResults.anomalies && batchResults.anomalies.length > 0 && (
                <div className="mt-6">
                  <span className="text-slate-400 font-semibold text-xs block mb-2">Detected Anomalies (Source Origins):</span>
                  <div className="overflow-y-auto max-h-64 rounded-xl border border-slate-100">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 shadow-sm z-10">
                        <tr>
                          <th className="px-3 py-2 font-bold text-slate-600">Source IP</th>
                          <th className="px-3 py-2 font-bold text-slate-600">Classification</th>
                          <th className="px-3 py-2 font-bold text-slate-600">Threat</th>
                          <th className="px-3 py-2 font-bold text-slate-600">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {batchResults.anomalies.map((anomaly, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-800 font-mono">{anomaly.source_ip}</td>
                            <td className="px-3 py-2 font-bold text-red-600">{anomaly.prediction_label}</td>
                            <td className="px-3 py-2">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${anomaly.threat_level === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                {anomaly.threat_level}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">{(anomaly.confidence * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Prompt card if no predictions yet */}
          {!result && !batchResults && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-premium text-center flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <HelpCircle className="h-10 w-10 text-slate-300" />
              <div>
                <h4 className="text-sm font-bold text-slate-700">Awaiting Query Input</h4>
                <p className="text-xs text-slate-400 max-w-44 mx-auto mt-1">Configure inputs and execute evaluation to view model findings here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
