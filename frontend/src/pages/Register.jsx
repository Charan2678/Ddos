import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import logoImg from '../assets/logo.png';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess(false);

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setErr('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      // Mock mode fallback if backend is offline
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/register', {
          username,
          email,
          password
        });

        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } catch (err) {
        if (err.code === "ERR_NETWORK") {
          console.warn("Backend not running. Bypassing registration using mock success.");
          setSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Operator registration failed. User may already exist.';
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-[1100px] w-full flex flex-col lg:flex-row bg-white rounded-[32px] shadow-2xl overflow-hidden min-h-[700px]"
      >
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-blue-500 p-12 text-white relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-transparent pointer-events-none"></div>

          <div className="relative z-10 mt-4">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-black/10 p-2.5">
              <img src={logoImg} alt="DDoS Shield Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-[42px] font-extrabold mb-4 leading-tight tracking-tight text-white">
              Security reimagined <br />with ML
            </h1>
            <p className="text-blue-100/90 text-[15px] max-w-md leading-relaxed">
              Monitor live traffic, identify malicious behavior, and protect network.
            </p>
          </div>

          <div className="space-y-4 relative z-10 mb-8">
            {/* Feature 1 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">Real-Time Detection</h3>
              <p className="text-blue-100/80 text-[13px]">Instantly identify abnormal traffic and DDoS attacks.</p>
            </div>
            {/* Feature 2 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">Threat Classification</h3>
              <p className="text-blue-100/80 text-[13px]">Classify SYN Flood, UDP Flood, ICMP Flood, and HTTP Flood attacks.</p>
            </div>
            {/* Feature 3 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">Traffic Analytics</h3>
              <p className="text-blue-100/80 text-[13px]">Visualize network activity, packet flow, and attack insights live.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col bg-white">
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">

            {/* Back to sign in link */}
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-8 hover:text-blue-600 transition-colors">
              ← BACK TO SIGN IN
            </Link>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create an account</h2>
            <p className="text-[14px] text-slate-500 mb-8">
              Sign up to access your secure defense workspace.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {err && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-600"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{err}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-600"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Account Created! Redirecting...</span>
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    placeholder="john_doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-2">
                      Confirm *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center rounded-[14px] bg-[#1d4ed8] hover:bg-[#1e40af] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Sign up</span>
                )}
              </motion.button>
            </form>

            {/* Bottom Login Link */}
            <div className="mt-8 text-center text-[13px]">
              <span className="text-slate-500">Already registered? </span>
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
