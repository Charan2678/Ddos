import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path after logging in
  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!email || !password) {
      setErr('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        username_or_email: email,
        password: password
      });

      login(response.data.access_token, response.data.user);
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Invalid email/username or password';
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
            <div className="text-xs font-bold tracking-[0.2em] text-blue-100 uppercase mb-8">
              DDOS SHIELD
            </div>
            <h1 className="text-[42px] font-extrabold mb-4 leading-tight tracking-tight text-white">
              DDoS Detection & Network Threat Monitoring <br />
            </h1>
            <p className="text-blue-100/90 text-[15px] max-w-md leading-relaxed">
              Auto-classified network flows, live traffic analytics, and a defense workspace your team actually needs.
            </p>
          </div>

          <div className="space-y-4 relative z-10 mb-8">
            {/* Feature 1 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">ML Threat Detection</h3>
              <p className="text-blue-100/80 text-[13px]">Automatically classify and prioritize attacks.</p>
            </div>
            {/* Feature 2 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">Role based access</h3>
              <p className="text-blue-100/80 text-[13px]">Secure workflows for distributed teams.</p>
            </div>
            {/* Feature 3 */}
            <div className="border border-white/20 rounded-2xl p-5 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <h3 className="font-bold text-white text-[15px] mb-1">Real-time tracking</h3>
              <p className="text-blue-100/80 text-[13px]">Monitor traffic flows and threat movement clearly.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col bg-white">
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">

            {/* Back to landing page */}
            <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-12 hover:text-blue-600 transition-colors">
              ← BACK TO HOME
            </Link>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-[14px] text-slate-500 mb-10">
              Sign in to your workspace or create a new account.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
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

              <div className="space-y-5">
                {/* Username / Email */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                    placeholder="admin@example.com"
                  />
                </div>

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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-[14px] text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end pt-1">
                <a href="#" className="text-[13px] font-bold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </motion.button>
            </form>

            {/* Bottom Register Link */}
            <div className="mt-8 text-center text-[13px]">
              <span className="text-slate-500">Don't have an account? </span>
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Create one
              </Link>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
