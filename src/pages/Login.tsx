import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, LogIn, Lock, Mail, AlertCircle, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSignInWith = async (loginEmail: string, loginPass: string) => {
    if (!loginEmail || !loginPass) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPass);
      navigate(redirect, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. If you do not have an account yet, please create one or use the Demo presets.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setLoadingPreset(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignInWith(email, password);
  };

  const handleDemoSignIn = async (demoEmail: string, demoPass: string, label: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoadingPreset(label);
    await handleSignInWith(demoEmail, demoPass);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0d1424] border border-[#1b263b] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/50">
            <Film className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to Cinema</h1>
          <p className="text-xs text-slate-400">
            Access your bookings, manage seats, and enjoy member perks.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex flex-col space-y-2 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {email && (
              <Link
                to={`/register?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`}
                className="inline-flex items-center space-x-1 font-bold text-amber-400 hover:text-amber-300 pt-1 text-[11px] underline"
              >
                <span>Register account with &quot;{email}&quot;</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                id="login-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                id="login-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-950/40 disabled:opacity-50"
          >
            {submitting && !loadingPreset ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Fast Sign-in */}
        <div className="pt-3 border-t border-[#162035] space-y-2.5 text-center">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            1-Click Demo Sign In
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              id="demo-customer-btn"
              disabled={submitting}
              onClick={() => handleDemoSignIn('guest@kalicinema.com', 'Cinema12345!', 'customer')}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#121c32] text-slate-300 hover:text-white hover:bg-[#192744] border border-[#1b263b] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{loadingPreset === 'customer' ? 'Signing In...' : 'Customer Demo'}</span>
            </button>
            <button
              type="button"
              id="demo-admin-btn"
              disabled={submitting}
              onClick={() => handleDemoSignIn('admin@kalicinema.com', 'Admin12345!', 'admin')}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{loadingPreset === 'admin' ? 'Signing In...' : 'Admin Demo'}</span>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center text-xs text-slate-400 pt-1">
          Don’t have an account?{' '}
          <Link
            to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};
