import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Film,
  Building2,
  Ticket,
  Sparkles,
  Flame,
  Clock,
  Shield,
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  LogIn,
  ChevronRight,
  Armchair,
  Clapperboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    if (onClose) onClose();
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 z-50 h-screen bg-[#090c14]/95 backdrop-blur-xl border-r border-white/[0.07] flex flex-col justify-between transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Top Logo Section */}
        <div>
          <div className="h-20 flex items-center justify-between px-5 border-b border-white/[0.06]">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center space-x-3 group overflow-hidden"
              id="sidebar-brand"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Clapperboard className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-wider text-white uppercase group-hover:text-amber-400 transition-colors">
                    Cinema
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-amber-500/80 -mt-1">
                    Box Office
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="py-6 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* Primary Menu */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Menu
                </div>
              )}
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={onClose}
                  id="sidebar-nav-home"
                  title="Home"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive('/') && location.pathname === '/'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm shadow-amber-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Home className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Home</span>}
                </Link>

                <Link
                  to="/movies"
                  onClick={onClose}
                  id="sidebar-nav-movies"
                  title="Movies"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive('/movies')
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm shadow-amber-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Film className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Movies</span>}
                </Link>

                <Link
                  to="/cinemas"
                  onClick={onClose}
                  id="sidebar-nav-cinemas"
                  title="Cinemas"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive('/cinemas')
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm shadow-amber-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Building2 className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span>Cinemas</span>}
                </Link>

                {currentUser && (
                  <Link
                    to="/my-reservations"
                    onClick={onClose}
                    id="sidebar-nav-reservations"
                    title="My Bookings"
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                    } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive('/my-reservations')
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm shadow-amber-500/10 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Ticket className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>My Bookings</span>}
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Explore Section */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Discover
                </div>
              )}
              <div className="space-y-1">
                <Link
                  to="/movies?filter=now-showing"
                  onClick={onClose}
                  title="Now Showing"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors`}
                >
                  <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                  {!isCollapsed && <span>Now Showing</span>}
                </Link>

                <Link
                  to="/movies?filter=coming-soon"
                  onClick={onClose}
                  title="Coming Soon"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {!isCollapsed && <span>Coming Soon</span>}
                </Link>

                <Link
                  to="/movies?filter=imax"
                  onClick={onClose}
                  title="IMAX & VIP"
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                  } py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors`}
                >
                  <Armchair className="w-4 h-4 text-sky-400 shrink-0" />
                  {!isCollapsed && <span>VIP & Premium</span>}
                </Link>
              </div>
            </div>

            {/* Admin Management Section */}
            {isAdmin && (
              <div className="pt-2 border-t border-white/[0.06]">
                {!isCollapsed && (
                  <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                    <span>Admin Suite</span>
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <div className="space-y-1">
                  <Link
                    to="/admin"
                    onClick={onClose}
                    id="sidebar-nav-admin"
                    title="Dashboard"
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                    } py-2 rounded-xl text-xs font-medium transition-colors ${
                      location.pathname === '/admin'
                        ? 'bg-amber-400/15 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </Link>

                  <Link
                    to="/admin/showtimes"
                    onClick={onClose}
                    id="sidebar-nav-admin-showtimes"
                    title="Showtimes"
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                    } py-2 rounded-xl text-xs font-medium transition-colors ${
                      location.pathname.startsWith('/admin/showtimes')
                        ? 'bg-amber-400/15 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Schedule</span>}
                  </Link>

                  <Link
                    to="/admin/reservations"
                    onClick={onClose}
                    id="sidebar-nav-admin-reservations"
                    title="Reservations"
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                    } py-2 rounded-xl text-xs font-medium transition-colors ${
                      location.pathname.startsWith('/admin/reservations')
                        ? 'bg-amber-400/15 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Ticket className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Bookings</span>}
                  </Link>

                  <Link
                    to="/admin/users"
                    onClick={onClose}
                    id="sidebar-nav-admin-users"
                    title="Users"
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                    } py-2 rounded-xl text-xs font-medium transition-colors ${
                      location.pathname.startsWith('/admin/users')
                        ? 'bg-amber-400/15 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>User Roles</span>}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-white/[0.06] bg-[#07090e]/60">
          {currentUser ? (
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]`}
            >
              {!isCollapsed && (
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {userProfile?.fullName
                      ? userProfile.fullName.charAt(0).toUpperCase()
                      : currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">
                      {userProfile?.fullName || 'Cinema Member'}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-medium truncate">
                      {isAdmin ? 'Administrator' : 'Verified Member'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                id="sidebar-logout-button"
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                id="sidebar-login-button"
                className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm shadow-amber-400/20`}
              >
                <LogIn className="w-4 h-4" />
                {!isCollapsed && <span>Sign In</span>}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
