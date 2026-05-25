import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldAlert, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path after logging in
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!email || !password) {
      setErr('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // For development, if backend is not yet running, we allow a bypass login!
      // This is a great DX (developer experience) feature when building Frontend-first.
      // We will explain this to the user.
      if (email === 'admin@shield.com' && password === 'admin123') {
        setTimeout(() => {
          login('mock-jwt-token-admin', { username: 'admin', email: 'admin@shield.com', is_admin: true });
          navigate(from, { replace: true });
        }, 800);
        return;
      } else if (email === 'analyst@shield.com' && password === 'analyst123') {
        setTimeout(() => {
          login('mock-jwt-token-analyst', { username: 'analyst', email: 'analyst@shield.com', is_admin: false });
          navigate(from, { replace: true });
        }, 800);
        return;
      }

      // Real backend integration
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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Mesh Decor */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">Access Control</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            DDoS Detection & Classification Console
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white px-8 py-10 shadow-premium rounded-3xl border border-slate-100">
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
              {/* Username / Email field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Username or Email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. admin@shield.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Establish Connection</span>
              )}
            </motion.button>
          </form>

          {/* Development DX Helpers Warning */}
          <div className="mt-6 rounded-2xl bg-blue-50/50 border border-blue-100/50 p-4 text-[11px] text-blue-800 space-y-1">
            <span className="font-bold uppercase tracking-wider block">Dev Bypass Credentials:</span>
            <p>Admin: <code className="bg-white/80 px-1 rounded font-semibold text-blue-900">admin@shield.com</code> / Password: <code className="bg-white/80 px-1 rounded font-semibold text-blue-900">admin123</code></p>
            <p>Analyst: <code className="bg-white/80 px-1 rounded font-semibold text-blue-900">analyst@shield.com</code> / Password: <code className="bg-white/80 px-1 rounded font-semibold text-blue-900">analyst123</code></p>
          </div>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500">Need credentials? </span>
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Register Operator
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
