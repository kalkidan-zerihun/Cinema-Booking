import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, LogIn, Lock, Mail, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirect, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please check your credentials or register a new account.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('guest@kalicinema.com');
    setPassword('Cinema12345!');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@kalicinema.com');
    setPassword('Admin12345!');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#12131d] border border-[#232535] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e50914] to-[#990000] flex items-center justify-center mx-auto shadow-lg shadow-red-950/60">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to Kali Cinema</h1>
          <p className="text-xs text-gray-400">
            Access your bookings, manage seats, and enjoy member perks.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                id="login-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                id="login-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60 disabled:opacity-50"
          >
            {submitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fills */}
        <div className="pt-2 border-t border-[#1e202e] space-y-2 text-center">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Demo Credentials Auto-Fill
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="py-2 px-3 rounded-lg text-xs font-semibold bg-[#181926] text-gray-300 hover:text-white hover:bg-[#232537] border border-[#2a2d40] transition-colors"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-2 px-3 rounded-lg text-xs font-semibold bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-900/40 border border-red-900/50 transition-colors flex items-center justify-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center text-xs text-gray-400 pt-1">
          Don’t have an account?{' '}
          <Link
            to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-bold text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};
