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
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

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

    // Simulate API call delay
    setTimeout(() => {
      // Basic rule-based classification mock to show logical outputs
      let label = 'BENIGN';
      let confidence = 0.992;
      let severity = 'LOW';
      let action = 'Passed';

      if (inputData.Protocol === 6 && inputData.SYN_Flag_Cnt === 1 && inputData.Flow_Pkts_s > 1000) {
        label = 'SYN Flood';
        confidence = 0.998;
        severity = 'CRITICAL';
        action = 'Flow Blocked & Port Isolated';
      } else if (inputData.Protocol === 17 && inputData.Flow_Pkts_s > 800) {
        label = 'UDP Flood';
        confidence = 0.987;
        severity = 'CRITICAL';
        action = 'Rate Limited at Firewall Gate';
      } else if (inputData.Flow_Duration > 8000 && inputData.SYN_Flag_Cnt === 0 && inputData.Flow_Pkts_s > 500) {
        label = 'HTTP Flood';
        confidence = 0.942;
        severity = 'HIGH';
        action = 'IP Blocked & Challenged via CAPTCHA';
      }

      setResult({
        label,
        confidence,
        severity,
        action,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        inputs: inputData
      });

      if (label === 'BENIGN') {
        toast.success("Traffic flow classified as clean.");
      } else {
        toast.error(`⚠️ Alert: Malicious ${label} Flow Identified!`, {
          icon: <AlertTriangle className="text-red-500" />
        });
      }

      setSubmitting(false);
    }, 1000);

    // Backend Integration
    try {
      // const response = await axios.post('http://localhost:8000/api/predict', inputData);
      // setResult(response.data);
    } catch (e) {
      console.warn("Backend API unavailable, using local mock classifier.");
    }
  };

  // Batch CSV Prediction Handler
  const handleBatchFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error("Format error. Batch file must be a CSV dataset.");
        return;
      }
      setBatchFile(file);
      setSubmitting(true);

      setTimeout(() => {
        setBatchResults({
          fileName: file.name,
          scanned: 14820,
          benign: 14782,
          attacks: 38,
          types: {
            'SYN Flood': 24,
            'UDP Flood': 10,
            'HTTP Flood': 4
          }
        });
        setSubmitting(false);
        toast.error("Batch run complete: 38 anomalies isolated.");
      }, 1500);
    }
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
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Batch Summary</h3>
              </div>

              <div className="space-y-4 text-xs">
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
