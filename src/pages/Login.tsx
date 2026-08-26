import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, LogIn, Lock, Mail, AlertCircle, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
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
        setError('Invalid email or password. If you do not have an account yet, please create one or use the Quick Demo presets.');
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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#0c101a] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20 text-slate-950">
            <Film className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to Cinema</h1>
          <p className="text-xs text-slate-400">
            Access your bookings, manage seats, and view your tickets.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex flex-col space-y-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
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
            <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                id="login-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                id="login-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/20 disabled:opacity-50"
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

        {/* Demo Fast Login Cards */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast Demo Profiles</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="demo-admin-login-btn"
              onClick={() => handleDemoSignIn('admin@cinema.com', 'Admin@123456', 'admin')}
              disabled={submitting}
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-amber-400/40 text-left transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">Admin</span>
                <span className="text-[10px] text-slate-400 block">Full control</span>
              </div>
            </button>

            <button
              type="button"
              id="demo-user-login-btn"
              onClick={() => handleDemoSignIn('customer@cinema.com', 'Customer@123456', 'customer')}
              disabled={submitting}
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-amber-400/40 text-left transition-colors"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">Customer</span>
                <span className="text-[10px] text-slate-400 block">Guest booking</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          <span>Don&apos;t have an account? </span>
          <Link
            to={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-amber-400 font-bold hover:underline"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};
