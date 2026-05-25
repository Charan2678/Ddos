import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Clock, Zap, Award, Info } from 'lucide-react';

const COMPARISON_DATA = [
  { name: 'XGBoost', Accuracy: 99.8, Precision: 99.8, Recall: 99.8, F1: 99.8, time: 4.8, latency: 1.2 },
  { name: 'Random Forest', Accuracy: 99.7, Precision: 99.6, Recall: 99.7, F1: 99.7, time: 12.4, latency: 2.8 },
  { name: 'Decision Tree', Accuracy: 98.4, Precision: 98.3, Recall: 98.4, F1: 98.4, time: 1.1, latency: 0.4 },
  { name: 'KNN', Accuracy: 97.8, Precision: 97.7, Recall: 97.8, F1: 97.7, time: 2.3, latency: 8.5 },
  { name: 'SVM', Accuracy: 94.1, Precision: 93.8, Recall: 94.1, F1: 93.9, time: 45.2, latency: 15.4 },
  { name: 'Logistic Regression', Accuracy: 89.2, Precision: 88.4, Recall: 89.2, F1: 88.8, time: 3.5, latency: 0.8 }
];

const ModelComparison = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Model Comparison</h1>
        <p className="text-sm text-slate-500">Benchmark metric distributions, execution times, and classification speeds of ML models</p>
      </div>

      {/* Top Banner: Best Performing Model */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Champion Selected</h3>
            <p className="text-base font-extrabold text-slate-800">XGBoost Classifier</p>
            <p className="text-xs text-slate-500 mt-0.5">XGBoost is the active champion model based on F1-score (99.82%) and optimal latency (1.2ms/k-flows).</p>
          </div>
        </div>
        
        <div className="rounded-2xl bg-white border border-slate-200/50 p-4 flex items-center space-x-2.5 max-w-sm text-[11px] text-slate-500">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <span><strong>Senior Note:</strong> Tabular network features (packet counts, durations) show high correlation patterns. Tree-based models (XGBoost, RF) score extremely high compared to distance-based models (KNN, SVM).</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Metric Comparison (Bar Chart) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">Accuracy & F1 Benchmark</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPARISON_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(value) => [`${value}%`, '']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Accuracy" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1" fill="#0dcaf0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Training Time Benchmark */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">Training Complexity (Seconds)</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPARISON_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(value) => [`${value}s`, 'Train Duration']} />
                <Bar dataKey="time" name="Training Time" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Latency (Inference speed) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">Inference Delay (ms per 1,000 queries)</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPARISON_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(value) => [`${value}ms`, 'Latency']} />
                <Bar dataKey="latency" name="Inference Latency" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelComparison;
