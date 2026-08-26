import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, UserPlus, Lock, Mail, User, Phone, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const initialEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim(), phone.trim());
      navigate(redirect, { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use a stronger combination.');
      } else {
        setError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#12131d] border border-[#232535] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e50914] to-[#990000] flex items-center justify-center mx-auto shadow-lg shadow-red-950/60">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Join Kali Cinema</h1>
          <p className="text-xs text-gray-400">
            Create an account to reserve seats, save booking passes, and view exclusive showtimes.
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
            <label className="text-xs font-bold text-gray-300 block">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                id="register-name-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abebe Kebede"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 block">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                id="register-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 block">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                id="register-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 123 4567"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  id="register-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  id="register-confirm-password-input"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2c2f42] text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60 disabled:opacity-50"
          >
            {submitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Complete Registration</span>
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-[#1e202e]">
          Already have an account?{' '}
          <Link
            to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-bold text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
