import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (response.ok) {
        setIsSent(true);
        toast.success('Password reset link sent! Check your inbox.');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to send reset link.');
      }
    } catch (error) {
      toast.error('Network error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send you a secure link to reset your password.</p>
        </div>

        {isSent ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 mb-6 font-medium">
              If an account with that email exists, we have sent a password reset link to {email}.
            </div>
            <Link to="/login" className="inline-flex items-center justify-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 pl-11 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-slate-50 border focus:bg-white transition-all shadow-sm"
                  placeholder="operator@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
            
            <div className="text-center mt-6">
              <Link to="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
