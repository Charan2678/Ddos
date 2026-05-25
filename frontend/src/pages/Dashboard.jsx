import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { toast } from 'react-toastify';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
const ATTACK_TYPES = ['BENIGN', 'SYN Flood', 'UDP Flood', 'ICMP Flood', 'HTTP Flood'];

const Dashboard = () => {
  // Stats states
  const [totalTraffic, setTotalTraffic] = useState(148204);
  const [totalAttacks, setTotalAttacks] = useState(2408);
  const [activeThreats, setActiveThreats] = useState(1);
  const [packetRate, setPacketRate] = useState(482);
  const [systemStatus, setSystemStatus] = useState('Secure');

  // Chart states
  const [trafficHistory, setTrafficHistory] = useState([
    { time: '11:00', packets: 420, attacks: 0 },
    { time: '11:10', packets: 450, attacks: 0 },
    { time: '11:20', packets: 390, attacks: 2 },
    { time: '11:30', packets: 510, attacks: 12 },
    { time: '11:40', packets: 850, attacks: 180 }, // spike
    { time: '11:50', packets: 480, attacks: 15 },
    { time: '12:00', packets: 460, attacks: 0 }
  ]);

  const [attackDistribution, setAttackDistribution] = useState([
    { name: 'BENIGN', value: 145796 },
    { name: 'SYN Flood', value: 1250 },
    { name: 'UDP Flood', value: 820 },
    { name: 'ICMP Flood', value: 242 },
    { name: 'HTTP Flood', value: 96 }
  ]);

  // Live Threat Logs table
  const [recentLogs, setRecentLogs] = useState([
    { id: 1, time: '12:02:15', ip: '192.168.1.142', type: 'SYN Flood', rate: '4,280 p/s', severity: 'CRITICAL' },
    { id: 2, time: '11:48:32', ip: '10.0.0.84', type: 'UDP Flood', rate: '2,910 p/s', severity: 'HIGH' },
    { id: 3, time: '11:42:05', ip: '172.16.254.10', type: 'HTTP Flood', rate: '120 req/s', severity: 'MEDIUM' },
    { id: 4, time: '11:30:12', ip: '192.168.10.5', type: 'SYN Flood', rate: '850 p/s', severity: 'LOW' }
  ]);

  // Telemetry Simulation (Mock WebSocket Stream)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Randomly update packet rate
      const newRate = Math.floor(Math.random() * (600 - 350) + 350);
      setPacketRate(newRate);

      // 2. Increment total traffic
      setTotalTraffic(prev => prev + Math.floor(newRate * 2.5));

      // 3. Update active chart history
      setTrafficHistory(prev => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nextHist = [...prev.slice(1), { time, packets: newRate, attacks: activeThreats > 0 ? Math.floor(Math.random() * 20) : 0 }];
        return nextHist;
      });

      // 4. Randomly trigger simulated attacks (10% chance per cycle)
      if (Math.random() > 0.90) {
        const attackIp = `192.168.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
        const attackType = ATTACK_TYPES[Math.floor(Math.random() * (ATTACK_TYPES.length - 1)) + 1]; // Avoid BENIGN
        const attackSeverity = attackType === 'SYN Flood' || attackType === 'UDP Flood' ? 'CRITICAL' : 'HIGH';
        const rateStr = attackType === 'HTTP Flood' ? `${Math.floor(Math.random() * 100) + 50} req/s` : `${(Math.random() * 5 + 1).toFixed(1)}k p/s`;

        // Update counts
        setTotalAttacks(prev => prev + 1);
        setActiveThreats(prev => prev + 1);
        setSystemStatus('Attack Active');

        // Add Log
        const newLog = {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour12: false }),
          ip: attackIp,
          type: attackType,
          rate: rateStr,
          severity: attackSeverity
        };
        setRecentLogs(prev => [newLog, ...prev.slice(0, 5)]);

        // Update distribution chart
        setAttackDistribution(prev => 
          prev.map(item => item.name === attackType ? { ...item, value: item.value + 1 } : item)
        );

        // Push Toast Alert
        toast.error(`⚠️ DDoS Threat Detected: ${attackType} from ${attackIp}!`, {
          icon: <AlertTriangle className="text-red-500" />
        });

        // Set timeout to clear the threat active state after 8 seconds
        setTimeout(() => {
          setActiveThreats(prev => Math.max(0, prev - 1));
        }, 8000);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [activeThreats]);

  // Adjust system status text based on active threats
  useEffect(() => {
    if (activeThreats === 0) {
      setSystemStatus('Secure');
    } else {
      setSystemStatus('Attack Active');
    }
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
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          </span>
          <span className="text-emerald-600 font-bold uppercase tracking-wider">ONLINE</span>
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
              Interval: 2.5s
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
                <Area type="monotone" dataKey="packets" name="Total Traffic" stroke="#0d6efd" strokeWidth={2} fillOpacity={1} fill="url(#colorPackets)" />
                <Area type="monotone" dataKey="attacks" name="Attacks Detected" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
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
            {attackDistribution.map((item, idx) => (
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
          <button className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            <span>View Full History</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
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
              {recentLogs.map((log) => (
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
