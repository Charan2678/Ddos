import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  Activity,
  Brain,
  FileBarChart,
  ChevronRight,
  Wifi,
  AlertTriangle,
  Lock
} from 'lucide-react';

// ── Fade-in helper ──────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// ── Feature card data ────────────────────────────────────────────────────────
const features = [
  {
    icon: <Activity className="h-6 w-6 text-blue-600" />,
    title: 'Live Traffic Monitor',
    desc: 'Real-time packet capture and flow visualisation across all network interfaces.',
  },
  {
    icon: <Brain className="h-6 w-6 text-blue-600" />,
    title: 'ML Classification',
    desc: 'XGBoost & Random Forest models trained to detect SYN, UDP, ICMP and HTTP floods.',
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
    title: 'Instant Threat Alerts',
    desc: 'Critical anomalies surface in seconds with confidence scores and threat ratings.',
  },
  {
    icon: <FileBarChart className="h-6 w-6 text-blue-600" />,
    title: 'Audit Reports',
    desc: 'Generate scoped PDF & CSV security reports with one click.',
  },
  {
    icon: <Lock className="h-6 w-6 text-blue-600" />,
    title: 'Role-Based Access',
    desc: 'Operators see only their own scans; admins see the full picture.',
  },
  {
    icon: <Wifi className="h-6 w-6 text-blue-600" />,
    title: 'WebSocket Live Feed',
    desc: 'Sub-second packet telemetry streamed directly to your dashboard.',
  },
];

// ── Stat strip ───────────────────────────────────────────────────────────────
const stats = [
  { value: '99.8%', label: 'Model Accuracy' },
  { value: '<1s', label: 'Detection Latency' },
  { value: '5+', label: 'Attack Classes' },
  { value: '6', label: 'ML Algorithms' },
];

// ── Main Component ───────────────────────────────────────────────────────────
const LandingPage = () => {
  useEffect(() => {
    document.title = 'DDoS Shield — Real-Time Network Defence';
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-blue-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-blue-800">DDoS Shield</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-blue-700">
            <a href="#features" className="hover:text-blue-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-blue-900 transition-colors">How it works</a>
            <a href="#stats" className="hover:text-blue-900 transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13px] font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden bg-white">

        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-blue-300 bg-blue-100 px-4 py-1.5 text-[12px] font-bold text-blue-800 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Live threat detection · Powered by ML
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto text-gray-900">
            Defend your network<br />
            <span className="text-blue-600">in real time.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-gray-600 text-[17px] max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            DDoS Shield captures live packets, classifies attack vectors with trained ML models, and surfaces threats before they cause damage.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl text-[15px] transition-all shadow-xl shadow-blue-600/30"
            >
              Start monitoring <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-blue-700 font-bold px-7 py-3.5 rounded-xl text-[15px] transition-all"
            >
              Sign in
            </Link>
          </div>
        </FadeIn>

        {/* Mock dashboard preview strip */}
        <FadeIn delay={0.45}>
          <div className="relative mt-20 mx-auto max-w-4xl">
            <div className="rounded-2xl border-2 border-blue-200 bg-white overflow-hidden shadow-2xl shadow-blue-200">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b-2 border-blue-100 bg-blue-50">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 flex-1 h-5 rounded-md bg-white border border-blue-200 text-[11px] text-blue-500 flex items-center px-3 font-medium">
                  localhost:5173/dashboard
                </span>
              </div>
              {/* Fake dashboard content */}
              <div className="p-6 grid grid-cols-3 gap-4 bg-white">
                {[
                  { label: 'Packets Captured', val: '1,248,492', color: 'text-blue-700' },
                  { label: 'Threats Detected', val: '342', color: 'text-red-600' },
                  { label: 'Model Accuracy', val: '99.8%', color: 'text-emerald-600' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4">
                    <p className="text-[11px] text-blue-600 font-semibold mb-1">{s.label}</p>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
                <div className="col-span-3 h-28 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-end px-4 pb-3 gap-1 overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const h = 20 + Math.sin(i * 0.6) * 30 + Math.random() * 25;
                    const isSpike = i === 28 || i === 29 || i === 30;
                    return (
                      <div
                        key={i}
                        style={{ height: `${isSpike ? 90 : h}%` }}
                        className={`flex-1 rounded-sm ${isSpike ? 'bg-red-500' : 'bg-blue-500'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section id="stats" className="py-10 px-6">
        <div className="mx-auto max-w-4xl bg-blue-600 rounded-3xl p-12 shadow-2xl shadow-blue-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.08}>
                <p className="text-4xl font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-[13px] text-blue-200 font-semibold">{s.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-center text-[12px] font-extrabold tracking-widest text-blue-600 uppercase mb-4">Capabilities</p>
            <h2 className="text-center text-4xl font-extrabold tracking-tight mb-16 text-gray-900">
              Everything you need to stay protected.
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div className="group h-full rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 p-6 transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200">
                  <div className="h-11 w-11 rounded-xl bg-blue-200 flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="font-extrabold text-blue-900 text-[15px] mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-[13px] leading-relaxed font-medium">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how" className="py-10 px-6">
        <div className="mx-auto max-w-5xl bg-blue-600 rounded-3xl p-12 shadow-2xl shadow-blue-300">
          <FadeIn>
            <p className="text-center text-[12px] font-extrabold tracking-widest text-blue-200 uppercase mb-4">How it works</p>
            <h2 className="text-center text-4xl font-extrabold tracking-tight mb-14 text-white">
              Three steps to full visibility.
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6 text-center" style={{ alignItems: 'stretch' }}>
            {[
              { step: '01', title: 'Capture', desc: 'Scapy sniffs every packet on your live network interface.' },
              { step: '02', title: 'Classify', desc: 'Features are extracted and scored by the champion ML model.' },
              { step: '03', title: 'Respond', desc: 'Threats appear on your dashboard instantly with severity ratings.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                style={{ display: 'flex' }}
              >
                <div className="relative bg-white/10 rounded-2xl px-8 py-10 border border-white/30 flex flex-col items-center justify-start w-full backdrop-blur-sm">
                  <p className="text-[60px] font-extrabold text-blue-200 leading-none mb-2">{item.step}</p>
                  <h3 className="font-extrabold text-xl text-white mb-3 -mt-3">{item.title}</h3>
                  <p className="text-blue-100 text-[14px] leading-relaxed font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 text-center bg-white">
        <FadeIn>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 text-gray-900">
            Ready to shield your network?
          </h2>
          <p className="text-gray-600 text-[16px] mb-10 font-medium">
            Set up takes under a minute. No configuration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-[15px] transition-all shadow-xl shadow-blue-600/30"
            >
              Create free account <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-blue-700 font-bold px-8 py-4 rounded-xl text-[15px] transition-all"
            >
              Sign in to dashboard
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t-2 border-blue-200 bg-blue-50 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-[13px] text-blue-800">DDoS Shield</span>
          </div>
          <p className="text-blue-500 text-[12px] font-medium">© 2025 DDoS Shield. Built for real-time network defence.</p>
          <div className="flex gap-5 text-[12px] text-blue-600 font-semibold">
            <Link to="/login" className="hover:text-blue-900 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-blue-900 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
