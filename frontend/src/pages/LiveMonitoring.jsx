import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Terminal, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  AlertOctagon,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP'];
const IPS = [
  '192.168.1.1', '192.168.1.142', '10.0.0.12', '10.0.0.84', 
  '172.16.254.10', '185.220.101.5', '45.227.254.12', '8.8.8.8'
];

const LiveMonitoring = () => {
  const [monitoring, setMonitoring] = useState(false);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Counters
  const [packetsPerSec, setPacketsPerSec] = useState(0);
  const [activeThreats, setActiveThreats] = useState(0);
  const [suspiciousIps, setSuspiciousIps] = useState(0);
  const [protocolCounts, setProtocolCounts] = useState({ TCP: 0, UDP: 0, ICMP: 0, HTTP: 0 });

  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto scroll terminal log to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (monitoring) {
      scrollToBottom();
    }
  }, [logs, monitoring]);

  // Handle Start/Stop Monitoring
  const toggleMonitoring = async () => {
    // Get token for authorized API calls
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (monitoring) {
      // STOP MONITORING
      try {
        await fetch('http://127.0.0.1:8000/api/stop-monitoring', { method: 'POST', headers });
      } catch (e) {
        console.error("Failed to stop backend sniffer", e);
      }

      setMonitoring(false);
      setPacketsPerSec(0);
      toast.info('Packet sniffing paused.');
      
      // Close WS if open
      if (wsRef.current) {
        wsRef.current.close();
        setConnected(false);
      }
    } else {
      // START MONITORING
      try {
        await fetch('http://127.0.0.1:8000/api/start-monitoring', { method: 'POST', headers });
      } catch (e) {
        console.error("Failed to start backend sniffer", e);
      }

      setMonitoring(true);
      toast.success('Live packet sniffer initialized.');
      
      // Try to connect to real backend WebSocket
      try {
        const ws = new WebSocket('ws://127.0.0.1:8000/api/live-traffic');
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          console.log("WebSocket connected.");
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleIncomingPacket(data);
        };

        ws.onerror = (err) => {
          console.warn("WebSocket error.", err);
          setConnected(false);
        };

        ws.onclose = () => {
          setConnected(false);
          console.log("WebSocket connection closed.");
        };
      } catch (err) {
        setConnected(false);
      }
    }
  };

  // Process incoming packets (called by WebSocket or mock simulation)
  const handleIncomingPacket = (data) => {
    const { packet, stats } = data;
    
    // Add to logs (max 100 entries to avoid memory lockups)
    setLogs(prev => [...prev.slice(-99), packet]);
    
    // Update counters from stream
    setPacketsPerSec(stats.pps);
    setActiveThreats(stats.threats);
    setSuspiciousIps(stats.suspicious);
    setProtocolCounts(stats.protocol_counts);

    if (packet.action === 'BLOCK') {
      toast.error(`Blocked suspicious flow: ${packet.proto} from ${packet.src}`, {
        toastId: `block-${packet.src}`, // Deduplicate alerts
        autoClose: 2000
      });
    }
  };

  // Mock Packet Sniffer Simulation
  useEffect(() => {
    let interval = null;
    if (monitoring && !connected) {
      // Run local generator every 300ms to 800ms
      interval = setInterval(() => {
        // Random protocol
        const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
        const src = IPS[Math.floor(Math.random() * IPS.length)];
        // Let's make some IPs malicious
        const isMalicious = src === '185.220.101.5' || src === '45.227.254.12';
        const dst = '192.168.1.100'; // Server IP
        const size = Math.floor(Math.random() * (1500 - 64) + 64);
        
        let flags = 'S'; // SYN by default
        if (proto === 'UDP') flags = 'N/A';
        if (proto === 'ICMP') flags = 'Echo Req';
        if (proto === 'HTTP') flags = 'GET /api/health';

        const action = isMalicious ? 'BLOCK' : 'ALLOW';
        const label = isMalicious 
          ? (proto === 'TCP' ? 'SYN Flood' : proto === 'UDP' ? 'UDP Flood' : 'Malicious') 
          : 'BENIGN';

        const newPacket = {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 }),
          proto,
          src,
          dst,
          size,
          flags,
          action,
          label
        };

        // Randomize statistics
        const currentPps = Math.floor(Math.random() * (580 - 320) + 320) + (isMalicious ? 2500 : 0);
        
        // Update protocol count
        setProtocolCounts(prev => ({
          ...prev,
          [proto]: prev[proto] + 1
        }));

        if (isMalicious) {
          setActiveThreats(prev => prev + 1);
          setSuspiciousIps(prev => Math.min(8, prev + 1));
          
          // Trigger alert toast
          toast.error(`🚨 Threat Blocked: ${label} from ${src}!`, {
            autoClose: 2000,
            toastId: `mock-${src}`
          });
          
          setTimeout(() => {
            setActiveThreats(prev => Math.max(0, prev - 1));
          }, 5000);
        }

        // Set live stats
        setPacketsPerSec(currentPps);

        // Feed log
        setLogs(prev => [...prev.slice(-99), newPacket]);

      }, Math.floor(Math.random() * 500) + 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [monitoring, connected]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Network Monitor</h1>
          <p className="text-sm text-slate-500">Capture packets and evaluate threats in real-time</p>
        </div>
        
        {/* Toggle Sniffer Button */}
        <button
          onClick={toggleMonitoring}
          className={`flex items-center space-x-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 ${
            monitoring 
              ? 'bg-red-600 hover:bg-red-700 shadow-red-500/10' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
          }`}
        >
          {monitoring ? (
            <>
              <Square className="h-4 w-4 fill-white" />
              <span>Halt Sniffer</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>Initialize Sniffer</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of live counts */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Packets/sec */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Packets / Second
            </span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{packetsPerSec}</span>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${monitoring ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Active Threat Threads */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Intrusion Alerts
            </span>
            <span className={`text-2xl font-extrabold tracking-tight ${activeThreats > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {activeThreats}
            </span>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeThreats > 0 ? 'bg-red-50 text-red-600 animate-bounce' : 'bg-slate-50 text-slate-400'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Suspicious IPs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Flagged Anomalous IPs
            </span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{suspiciousIps}</span>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${suspiciousIps > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
        </div>

        {/* Connection Mode */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Sniffer Pipeline
            </span>
            <span className={`text-sm font-bold tracking-tight uppercase ${connected ? 'text-emerald-600' : 'text-blue-600'}`}>
              {connected ? 'WebSocket Direct' : 'Sandbox Emulator'}
            </span>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            {connected ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
          </div>
        </div>
      </div>

      {/* Main Terminal and Live Radar Sniffer Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 flex-1">
        {/* Radar Scanner Visual and Protocol Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between space-y-6">
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-800">Scanner Radar</h3>
            <p className="text-xs text-slate-400">Live socket scanning feedback</p>
          </div>

          {/* Radar circle animation */}
          <div className="flex justify-center py-4">
            <div className="relative h-32 w-32 rounded-full border border-blue-100 flex items-center justify-center bg-slate-50">
              {monitoring && (
                <>
                  <div className="absolute h-full w-full rounded-full border-2 border-blue-500 opacity-60 radar-pulse-ring"></div>
                  <div className="absolute h-24 w-24 rounded-full border-2 border-blue-300 opacity-40 radar-pulse-ring [animation-delay:0.7s]"></div>
                  <div className="absolute h-16 w-16 rounded-full border-2 border-blue-200 opacity-20 radar-pulse-ring [animation-delay:1.4s]"></div>
                  <div className="absolute h-full w-0.5 bg-gradient-to-t from-blue-500/80 to-transparent origin-bottom bottom-1/2 animate-[spin_3s_linear_infinite]"></div>
                </>
              )}
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${monitoring ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                <Wifi className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Protocol Count breakdown */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Protocol Statistics</h4>
            <div className="space-y-2 text-xs">
              {PROTOCOLS.map((proto) => {
                const total = Object.values(protocolCounts).reduce((a, b) => a + b, 0) || 1;
                const percentage = ((protocolCounts[proto] / total) * 100).toFixed(0);
                return (
                  <div key={proto} className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-600">
                      <span>{proto}</span>
                      <span>{protocolCounts[proto]} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Scrolling Terminal (3 columns) */}
        <div className="rounded-3xl border border-slate-200/80 bg-slate-900 p-6 shadow-premium lg:col-span-3 flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-2 text-slate-200">
              <Terminal className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold font-mono">packet_sniffer_stream.log</h3>
            </div>
            <button
              onClick={clearLogs}
              className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Console</span>
            </button>
          </div>

          {/* Logs Viewport */}
          <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 pr-2">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                {monitoring 
                  ? 'Initializing capture buffer... waiting for packet arrival.' 
                  : 'Sniffer is dormant. Click "Initialize Sniffer" above to start capturing live network traffic.'
                }
              </div>
            ) : (
              logs.map((log, idx) => (
                <div 
                  key={log.id || idx} 
                  className={`flex flex-wrap items-center space-x-2 py-0.5 border-b border-slate-800/40 ${
                    log.action === 'BLOCK' ? 'text-red-400 bg-red-950/20 px-1 rounded' : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="font-bold text-blue-400">[{log.proto}]</span>
                  <span className="font-semibold">{log.src}</span>
                  <span className="text-slate-500">→</span>
                  <span className="font-semibold">{log.dst}</span>
                  <span className="text-slate-500">({log.size}B)</span>
                  {log.flags !== 'N/A' && <span className="text-slate-400 font-bold">flags:{log.flags}</span>}
                  
                  {/* Action badge */}
                  <span className={`ml-auto inline-flex items-center space-x-0.5 rounded px-1 text-[10px] font-bold ${
                    log.action === 'BLOCK' 
                      ? 'bg-red-900/50 text-red-200 border border-red-800' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                  }`}>
                    {log.action === 'BLOCK' ? <ShieldAlert className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                    <span>{log.action}</span>
                  </span>
                  
                  {log.action === 'BLOCK' && (
                    <span className="text-[10px] font-bold bg-red-500 text-white rounded px-1 ml-1 animate-pulse">
                      {log.label}
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
