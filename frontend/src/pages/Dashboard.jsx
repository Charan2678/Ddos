import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Activity, Globe, Cpu, AlertTriangle, Clock, ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
const ATTACK_TYPES = ['BENIGN', 'SYN Flood', 'UDP Flood', 'ICMP Flood', 'HTTP Flood'];

const Dashboard = () => {
  const { token } = useAuth();

  // Stats states
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [totalAttacks, setTotalAttacks] = useState(0);
  const [activeThreats, setActiveThreats] = useState(0);
  const [packetRate, setPacketRate] = useState(0);
  const [systemStatus, setSystemStatus] = useState('Secure');
  const [isConnected, setIsConnected] = useState(false);

  // Chart states
  const [trafficHistory, setTrafficHistory] = useState([
    { time: '...', packets: 0, attacks: 0 }
  ]);

  const [attackDistribution, setAttackDistribution] = useState([
    { name: 'BENIGN', value: 1 }, // init with 1 to avoid empty chart rendering issues
    { name: 'SYN Flood', value: 0 },
    { name: 'UDP Flood', value: 0 },
    { name: 'ICMP Flood', value: 0 },
    { name: 'HTTP Flood', value: 0 }
  ]);

  // Live Threat Logs table
  const [recentLogs, setRecentLogs] = useState([]);

  const wsRef = useRef(null);

  // Connection and API Handlers
  useEffect(() => {
    // Initialize WebSocket to passively listen to traffic
    try {
      const ws = new WebSocket('ws://localhost:8000/api/live-traffic');
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { packet, stats } = data;

        // Update overall stats
        setPacketRate(stats.pps);
        setActiveThreats(stats.threats);
        setTotalTraffic(prev => prev + 1);

        // Update historical chart data based on periodic stats (or on every packet)
        setTrafficHistory(prev => {
          // Avoid duplicate times to make the chart smooth
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.time === packet.time) return prev;
          
          const newHist = [...prev, { time: packet.time, packets: stats.pps, attacks: stats.threats }];
          return newHist.slice(-20); // keep last 20 data points
        });

        if (packet.action === 'BLOCK') {
          setTotalAttacks(prev => prev + 1);
          setSystemStatus('Attack Active');

          // Add to logs
          setRecentLogs(prev => {
            const newLog = {
              id: Date.now() + Math.random(),
              time: packet.time,
              ip: packet.src,
              type: packet.label,
              rate: 'Raw Socket', // Not easily computable per packet without history
              severity: 'CRITICAL'
            };
            return [newLog, ...prev].slice(0, 50); // limit to 50 logs
          });

          // Update distribution pie chart
          setAttackDistribution(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(item => item.name === packet.label);
            if (idx !== -1) {
              copy[idx].value += 1;
            } else {
              copy.push({ name: packet.label, value: 1 });
            }
            return copy;
          });

          // Show Toast notification for new IP block
          toast.error(`🚨 DDoS Threat Detected: ${packet.label} from ${packet.src}!`, {
            icon: <AlertTriangle className="text-red-500" />,
            toastId: `dash-block-${packet.src}`, // deduplicate toast by IP
            autoClose: 2000
          });
        }
      };

      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => setIsConnected(false);

    } catch (e) {
      console.error(e);
      setIsConnected(false);
    }

    // Cleanup: Just close the websocket on unmount. DO NOT stop the backend sniffer.
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token]);

  // Reset system status to Secure when active threats drop to zero
  useEffect(() => {
    if (activeThreats === 0) setSystemStatus('Secure');
  }, [activeThreats]);

  // Cards configuration
  const cardData = [
    { title: 'Total Packets Scanned', value: totalTraffic.toLocaleString(), icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50/50' },
    { title: 'Attacks Blocked', value: totalAttacks.toLocaleString(), icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50/50' },
    { title: 'Active Threats', value: activeThreats, icon: AlertTriangle, color: activeThreats > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400', bg: activeThreats > 0 ? 'bg-red-50' : 'bg-slate-50' },
    { title: 'Live Packet Rate', value: `${packetRate} p/s`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
    { title: 'Threat Defense Level', value: systemStatus, icon: Cpu, color: systemStatus === 'Secure' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold', bg: systemStatus === 'Secure' ? 'bg-emerald-50/50' : 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Analytics</h1>
          <p className="text-sm text-slate-500">Live network telemetry and intrusion monitoring dashboard</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-semibold text-slate-600">
          <Clock className="h-4 w-4 text-blue-600" />
          <span>Real-time Sniffer status:</span>
          <span className={`flex h-2.5 w-2.5 rounded-full relative ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          </span>
          <span className={`${isConnected ? 'text-emerald-600' : 'text-red-600'} font-bold uppercase tracking-wider`}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Grid of 5 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate block w-40">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-800 tracking-tight">{card.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Traffic Trend Area Chart */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Traffic Telemetry Trend</h3>
              <p className="text-xs text-slate-400">Total packets analyzed compared to identified malicious packet counts</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-100">
              Live Stream
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="packets" name="Total Traffic (pps)" stroke="#0d6efd" strokeWidth={2} fillOpacity={1} fill="url(#colorPackets)" isAnimationActive={false} />
                <Area type="monotone" dataKey="attacks" name="Active Threats" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Type Distribution Pie Chart */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Attack Vectors</h3>
            <p className="text-xs text-slate-400">Distribution of DDoS attack classifications</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attackDistribution.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {attackDistribution.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} packets`, 'Volume']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {attackDistribution.filter(item => item.value > 0).map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-500 font-medium truncate block max-w-28">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row - Real-time Threat Console logs table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Real-Time Threat Console</h3>
            <p className="text-xs text-slate-400">Scrolling log of identified anomalous packet rates and DDoS classifications</p>
          </div>
          <a href="/history" className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            <span>View Full History</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Timestamp</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Anomaly Rate</th>
                <th className="px-6 py-4 rounded-r-2xl">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400 italic">No malicious traffic detected yet. Listening on live feed...</td>
                </tr>
              ) : recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.time}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      log.type === 'BENIGN'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{log.rate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      log.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : log.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
