import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        toast.success('Password successfully reset! You can now log in.');
        navigate('/login');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to reset password. The link might have expired.');
      }
    } catch (error) {
      toast.error('Network error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-[100px] opacity-60"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 z-10">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <ShieldAlert className="h-8 w-8" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-2">Enter your new secure password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new_password" className="block text-sm font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="new_password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-slate-200 pl-11 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-slate-50 border focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="confirm_password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border-slate-200 pl-11 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-slate-50 border focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
          
          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
