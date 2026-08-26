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
    <nav className="sticky top-0 z-40 bg-[#0c0d12]/90 backdrop-blur-md border-b border-[#222430]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group" id="navbar-brand-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e50914] to-[#990000] flex items-center justify-center shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white uppercase group-hover:text-red-500 transition-colors">
                KALI <span className="text-[#e50914]">CINEMA</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-gray-400 font-semibold">
                PREMIUM EXPERIENCE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              id="nav-link-home"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'text-white bg-[#1e202e]'
                  : 'text-gray-300 hover:text-white hover:bg-[#161722]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              id="nav-link-movies"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/movies')
                  ? 'text-white bg-[#1e202e]'
                  : 'text-gray-300 hover:text-white hover:bg-[#161722]'
              }`}
            >
              Movies
            </Link>
            <Link
              to="/cinemas"
              id="nav-link-cinemas"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/cinemas')
                  ? 'text-white bg-[#1e202e]'
                  : 'text-gray-300 hover:text-white hover:bg-[#161722]'
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
                    ? 'text-red-400 bg-[#1e202e]'
                    : 'text-gray-300 hover:text-white hover:bg-[#161722]'
                }`}
              >
                <Ticket className="w-4 h-4 text-red-500" />
                <span>My Bookings</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                id="nav-link-admin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                  isActive('/admin')
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-[#181926] text-red-400 border-red-900/40 hover:bg-red-950/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#171824] border border-[#262838]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-200 max-w-[120px] truncate">
                      {userProfile?.name || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                      {userProfile?.role || 'Customer'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  title="Sign out"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#1f202f] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  id="navbar-login-btn"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="navbar-register-btn"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-md shadow-red-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Join Now</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="navbar-mobile-toggle"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#181926] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101119] border-b border-[#262838] px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-[#1a1b28]"
          >
            Home
          </Link>
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-[#1a1b28]"
          >
            Movies
          </Link>
          <Link
            to="/cinemas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-200 hover:bg-[#1a1b28]"
          >
            Cinemas
          </Link>

          {currentUser && (
            <Link
              to="/my-reservations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-medium text-red-400 hover:bg-[#1a1b28]"
            >
              <Ticket className="w-5 h-5 text-red-500" />
              <span>My Bookings</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-semibold text-red-400 bg-red-950/30 border border-red-900/40"
            >
              <ShieldCheck className="w-5 h-5 text-red-400" />
              <span>Admin Console</span>
            </Link>
          )}

          <div className="pt-4 border-t border-[#222432]">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {userProfile?.name || currentUser.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300"
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
                  className="text-center py-2.5 rounded-lg text-sm font-medium bg-[#1a1b28] text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-lg text-sm font-semibold bg-[#e50914] text-white"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
