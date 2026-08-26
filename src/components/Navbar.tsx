import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Film,
  Compass,
  Ticket,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#070a12]/90 backdrop-blur-md border-b border-[#1b263b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group" id="navbar-brand-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-950/40 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-xl font-black tracking-wider text-white uppercase group-hover:text-amber-400 transition-colors">
              CINEMA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              id="nav-link-home"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'text-amber-400 bg-[#131b2e] border border-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              id="nav-link-movies"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/movies')
                  ? 'text-amber-400 bg-[#131b2e] border border-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              Movies
            </Link>
            <Link
              to="/cinemas"
              id="nav-link-cinemas"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/cinemas')
                  ? 'text-amber-400 bg-[#131b2e] border border-amber-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              Cinemas
            </Link>

            {currentUser && (
              <Link
                to="/my-reservations"
                id="nav-link-reservations"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-reservations')
                    ? 'text-amber-400 bg-[#131b2e] border border-amber-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#0f172a]'
                }`}
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>My Bookings</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                id="nav-link-admin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                  isActive('/admin')
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                    : 'bg-[#101726] text-amber-400 border-amber-500/30 hover:bg-amber-950/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-[#1e293b]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-slate-950 uppercase">
                    {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                      {userProfile?.name || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400/90 uppercase tracking-wider font-medium">
                      {userProfile?.role || 'Customer'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#131b2e] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  id="navbar-login-btn"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="navbar-register-btn"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-colors shadow-md shadow-amber-950/40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="navbar-mobile-toggle"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#131b2e] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0f1d] border-b border-[#1b263b] px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-[#131b2e]"
          >
            Home
          </Link>
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-[#131b2e]"
          >
            Movies
          </Link>
          <Link
            to="/cinemas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-[#131b2e]"
          >
            Cinemas
          </Link>

          {currentUser && (
            <Link
              to="/my-reservations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-medium text-amber-400 hover:bg-[#131b2e]"
            >
              <Ticket className="w-5 h-5 text-amber-400" />
              <span>My Bookings</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-semibold text-amber-400 bg-amber-950/20 border border-amber-500/30"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Admin Console</span>
            </Link>
          )}

          <div className="pt-4 border-t border-[#1b263b]">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">
                    {userProfile?.name || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 text-sm text-amber-400 hover:text-amber-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg text-sm font-medium bg-[#131b2e] text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
