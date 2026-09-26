import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Ticket,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Star,
  Film,
  Building2,
  Calendar,
  Sparkles,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Movie, Cinema } from '../types';
import { getMovies } from '../services/movies';
import { getCinemas } from '../services/cinemas';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    movies: Movie[];
    cinemas: Cinema[];
  }>({ movies: [], cinemas: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [allCinemas, setAllCinemas] = useState<Cinema[]>([]);
  const [selectedCity, setSelectedCity] = useState('Addis Ababa');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, c] = await Promise.all([getMovies(), getCinemas()]);
        setAllMovies(m);
        setAllCinemas(c);
      } catch (err) {
        // Silently fallback if loading initial data
      }
    }
    loadData();
  }, []);

  // Filter search results dynamically
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ movies: [], cinemas: [] });
      setIsSearchOpen(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchedMovies = allMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedCinemas = allCinemas.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    ).slice(0, 3);

    setSearchResults({ movies: matchedMovies, cinemas: matchedCinemas });
    setIsSearchOpen(true);
  }, [searchQuery, allMovies, allCinemas]);

  // Click outside listener for search & dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 h-20 bg-[#07090e]/85 backdrop-blur-xl border-b border-white/[0.07] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors"
    >
      {/* Left side: Hamburger toggle on mobile + City Branch Pill */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          id="header-sidebar-toggle"
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Location selector dropdown */}
        <div className="relative hidden sm:block" ref={cityRef}>
          <button
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-amber-400/40 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{selectedCity}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isCityDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded-xl bg-[#0e121b] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              {['Addis Ababa', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'All Venues'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setIsCityDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedCity === city
                      ? 'bg-amber-400/15 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Bar with Live Overlay dropdown (Inspired by Reference) */}
      <div className="relative flex-1 max-w-md mx-3 sm:mx-6" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="global-movie-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            placeholder="Search for movies, cinemas, genres..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/[0.04] hover:bg-white/[0.06] focus:bg-[#0c101a] border border-white/[0.08] focus:border-amber-400/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && (searchResults.movies.length > 0 || searchResults.cinemas.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#0c101a] border border-white/10 shadow-2xl shadow-black/80 overflow-hidden z-50 p-2 max-h-96 overflow-y-auto">
            {searchResults.movies.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Film className="w-3 h-3 text-amber-400" />
                  <span>Movies</span>
                </div>
                <div className="space-y-1">
                  {searchResults.movies.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <img
                        src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100'}
                        alt={movie.title}
                        className="w-9 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {movie.title}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span>{movie.genre || 'Feature'}</span>
                          <span>•</span>
                          <span>{movie.duration ? `${movie.duration}m` : '120m'}</span>
                          {movie.rating && (
                            <span className="flex items-center text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                              {movie.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {searchResults.cinemas.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-t border-white/[0.06] pt-2">
                  <Building2 className="w-3 h-3 text-amber-400" />
                  <span>Cinemas</span>
                </div>
                <div className="space-y-1">
                  {searchResults.cinemas.map((cinema) => (
                    <Link
                      key={cinema.id}
                      to={`/cinemas/${cinema.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {cinema.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {cinema.address}, {cinema.city}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Quick Bookings Ticket Link & Profile Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {currentUser && (
          <Link
            to="/my-reservations"
            title="My Bookings"
            id="header-bookings-btn"
            className="p-2 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-white/[0.06] border border-white/[0.08] transition-colors relative"
          >
            <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        )}

        {currentUser ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              id="header-user-menu"
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
                {(userProfile?.fullName || userProfile?.name)
                  ? (userProfile.fullName || userProfile.name).charAt(0).toUpperCase()
                  : currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-white max-w-[100px] truncate">
                {(userProfile?.fullName || userProfile?.name)?.split(' ')[0] || currentUser.email?.split('@')[0]}
              </span>
              <ChevronDown className="hidden sm:block w-3 h-3 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e121b] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-xs font-bold text-white truncate">
                    {userProfile?.fullName || userProfile?.name || 'Cinema Member'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ADMINISTRATOR
                    </span>
                  )}
                </div>

                <Link
                  to="/my-reservations"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>My Reservations</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-400/10 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            id="header-signin-btn"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
