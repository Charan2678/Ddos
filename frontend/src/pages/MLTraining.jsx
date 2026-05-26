import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Settings, 
  Play, 
  Table, 
  Award, 
  CheckCircle2, 
  Brain, 
  Loader2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const MOCK_HEADERS = [
  'Flow_Duration', 'Tot_Fwd_Pkts', 'Tot_Bwd_Pkts', 
  'Fwd_Pkt_Len_Mean', 'Bwd_Pkt_Len_Mean', 'Flow_Byts_s', 
  'Flow_Pkts_s', 'SYN_Flag_Cnt', 'RST_Flag_Cnt', 'Protocol', 'Label'
];

const MOCK_ROWS = [
  [14820, 4, 3, 220.5, 45.0, 17914.9, 472.3, 1, 0, 6, 'BENIGN'],
  [854, 28, 0, 512.0, 0.0, 600468.3, 32786.8, 1, 0, 6, 'SYN Flood'],
  [451204, 2, 2, 42.0, 42.0, 18.6, 0.88, 0, 0, 17, 'UDP Flood'],
  [2104, 1, 1, 64.0, 64.0, 60836.5, 950.5, 0, 0, 1, 'ICMP Flood'],
  [221084, 15, 12, 1024.3, 850.5, 127110.8, 122.1, 0, 0, 6, 'HTTP Flood'],
];

const MLTraining = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [trainSplit, setTrainSplit] = useState(80);
  const [training, setTraining] = useState(false);
  const [trainLogs, setTrainLogs] = useState([]);
  const [results, setResults] = useState(null);

  // File Upload Handler
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Invalid file format. Please upload a CSV dataset.");
        return;
      }
      
      setFile(selectedFile);
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post("http://127.0.0.1:8000/api/upload-dataset", formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setDatasetInfo({
          id: res.data.id,
          fileName: res.data.name,
          fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
          rowCount: res.data.row_count,
          columnCount: res.data.features.split(',').length,
          featuresDetected: res.data.features.split(',').length,
          classes: ['Wait for training']
        });
        toast.success("Dataset uploaded successfully!");
      } catch (err) {
        toast.error("Failed to upload dataset: " + (err.response?.data?.detail || err.message));
        setFile(null);
      } finally {
        setUploading(false);
      }
    }
  };

  // Run ML Pipeline Training
  const runTraining = async () => {
    if (!datasetInfo?.id) {
      toast.warning("Please upload a dataset CSV first.");
      return;
    }

    setTraining(true);
    setTrainLogs(["Starting remote ML pipeline on server...", "Downsampling heavy classes..."]);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      
      // We start an interval to mock live terminal updates while backend blocks
      const mockInterval = setInterval(() => {
        const randomLogs = ["Optimizing gradients...", "Computing epoch loss...", "Fitting hyper-planes..."];
        setTrainLogs(prev => [...prev.slice(-10), randomLogs[Math.floor(Math.random() * randomLogs.length)]]);
      }, 1500);

      const trainRes = await axios.post(`http://127.0.0.1:8000/api/train-model?dataset_id=${datasetInfo.id}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      clearInterval(mockInterval);
      
      const compareRes = await axios.get("http://127.0.0.1:8000/api/compare-models", {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Format results for UI
      const resultsData = {
        champion: compareRes.data.champion,
        models: compareRes.data.models.map(m => ({
          name: m.name,
          accuracy: m.accuracy,
          precision: m.precision,
          recall: m.recall,
          f1: m.f1_score,
          time: parseFloat(m.training_time).toFixed(2)
        }))
      };
      
      setResults(resultsData);
      setTrainLogs(prev => [...prev, "Pipeline executed successfully."]);
      toast.success("ML pipeline completed! Models registered.");
    } catch (e) {
      toast.error("Training failed: " + (e.response?.data?.detail || e.message));
      setTrainLogs(prev => [...prev, "ERROR: Pipeline failed."]);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Machine Learning Studio</h1>
        <p className="text-sm text-slate-500">Upload network traffic captures and train threat detection algorithms</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Upload & Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Upload */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Dataset Upload</span>
            </h3>

            {/* Drag and Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag & Drop Network CSV</p>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts files up to 150MB</p>
                </div>
              </div>
            </div>

            {/* Uploaded File Meta */}
            {uploading && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Validating CSV structure...</span>
              </div>
            )}

            {datasetInfo && (
              <div className="mt-5 space-y-3 rounded-2xl bg-blue-50/30 border border-blue-100/50 p-4 text-xs">
                <div className="flex justify-between border-b border-blue-100/30 pb-2">
                  <span className="text-slate-400 font-semibold">File Name:</span>
                  <span className="text-slate-800 font-bold max-w-40 truncate">{datasetInfo.fileName}</span>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 pb-2">
                  <span className="text-slate-400 font-semibold">Row count:</span>
                  <span className="text-slate-800 font-bold">{datasetInfo.rowCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-blue-100/30 pb-2">
                  <span className="text-slate-400 font-semibold">Column count:</span>
                  <span className="text-slate-800 font-bold">{datasetInfo.columnCount} columns</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Target Classes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {datasetInfo.classes.map(cls => (
                      <span key={cls} className="bg-white border border-blue-100 text-[10px] font-bold text-blue-600 rounded px-1.5 py-0.5">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Training Hyperparameters */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Configurations</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Train/Test Partition</span>
                  <span>{trainSplit}% / {100 - trainSplit}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={trainSplit}
                  onChange={(e) => setTrainSplit(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Primary Scoring Target</label>
                <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>F1-Score (Recommended for Imbalanced Datasets)</option>
                  <option>Accuracy</option>
                  <option>Precision Recall AUC</option>
                </select>
              </div>

              <button
                onClick={runTraining}
                disabled={training || !file}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {training ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Matrix...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Execute Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Data table preview or Logs console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 3: Preview */}
          {!training && !results && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col h-[500px]">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Table className="h-5 w-5 text-blue-600" />
                <span>Dataset Structure Preview</span>
              </h3>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl flex-1">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                    <tr>
                      {MOCK_HEADERS.map((h, i) => (
                        <th key={i} className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_ROWS.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className={`px-4 py-3.5 ${cIdx === MOCK_HEADERS.length - 1 ? 'font-bold' : ''}`}>
                            {cIdx === MOCK_HEADERS.length - 1 ? (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                val === 'BENIGN' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : 'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {val}
                              </span>
                            ) : (
                              val.toLocaleString()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic">* Displaying top 5 sample entries of standard packet flow dimensions.</p>
            </div>
          )}

          {/* Card 4: Console training logs */}
          {training && (
            <div className="rounded-3xl border border-slate-200/80 bg-slate-950 p-6 shadow-premium flex flex-col h-[500px] text-slate-300 font-mono text-xs">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
                <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="font-bold">model_trainer_runtime.stdout</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {trainLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-500">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                    <span className={log.includes('Model') ? 'text-blue-400 font-bold' : log.includes('Champion') ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
                <div className="flex items-center space-x-2 text-blue-400 animate-pulse mt-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                  <span>Executing pipeline kernels...</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 5: Benchmark Evaluation results table */}
          {results && !training && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Champion Badge Banner */}
              <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm flex items-center space-x-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Champion Model Identified</h4>
                  <p className="text-lg font-extrabold text-slate-800">{results.champion}</p>
                  <p className="text-xs text-slate-500 mt-1">This model will be dynamically locked in as the default classifier for real-time packet checks.</p>
                </div>
              </div>

              {/* Evaluation Benchmarks Table */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium">
                <h3 className="text-base font-bold text-slate-800 mb-4">Algorithm Performance Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 rounded-l-xl">Algorithm</th>
                        <th className="px-5 py-3">Accuracy</th>
                        <th className="px-5 py-3">Precision</th>
                        <th className="px-5 py-3">Recall</th>
                        <th className="px-5 py-3">F1-Score</th>
                        <th className="px-5 py-3 rounded-r-xl"><span className="flex items-center space-x-1"><Clock className="h-3 w-3" /> <span>Train Time</span></span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.models.map((model) => (
                        <tr key={model.name} className={`hover:bg-slate-50/50 ${model.name === results.champion ? 'bg-amber-50/10 font-semibold' : ''}`}>
                          <td className="px-5 py-4 text-slate-800 font-bold flex items-center space-x-2">
                            {model.name === results.champion && <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />}
                            <span>{model.name}</span>
                          </td>
                          <td className="px-5 py-4 font-mono">{(model.accuracy * 100).toFixed(2)}%</td>
                          <td className="px-5 py-4 font-mono">{(model.precision * 100).toFixed(2)}%</td>
                          <td className="px-5 py-4 font-mono">{(model.recall * 100).toFixed(2)}%</td>
                          <td className="px-5 py-4 font-mono">
                            <span className={model.name === results.champion ? 'text-blue-600 font-extrabold' : ''}>
                              {(model.f1 * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-400">{model.time}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLTraining;
