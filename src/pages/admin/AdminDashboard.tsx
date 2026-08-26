import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Building,
  Tv,
  Armchair,
  Calendar,
  Ticket,
  DollarSign,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Layers,
} from 'lucide-react';
import { getMovies } from '../../services/movies';
import { getCinemas } from '../../services/cinemas';
import { getHalls } from '../../services/halls';
import { getShowtimes } from '../../services/showtimes';
import { getAllReservations } from '../../services/reservations';
import { getAllPayments } from '../../services/payments';
import { seedCinemaData } from '../../services/seedData';
import { Movie, Cinema, Hall, Showtime, Reservation, Payment } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, c, h, st, r, p] = await Promise.all([
        getMovies(),
        getCinemas(),
        getHalls(),
        getShowtimes(),
        getAllReservations(),
        getAllPayments(),
      ]);
      setMovies(m);
      setCinemas(c);
      setHalls(h);
      setShowtimes(st);
      setReservations(r);
      setPayments(p);
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = reservations
    .filter((r) => r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  const handleSeedData = async () => {
    if (!window.confirm('Seed/reset initial movie and cinema schedule data?')) return;
    setSeedStatus('Seeding initial Cinema dataset...');
    try {
      const res = await seedCinemaData(true);
      setSeedStatus(res.message);
      await loadData();
    } catch (err: any) {
      setSeedStatus(`Seed failed: ${err.message}`);
    }
  };

  // Setup Workflow Calculations
  const hasCinemas = cinemas.length > 0;
  const hasHalls = halls.length > 0;
  const hasSeats = halls.some((h) => (h.capacity || 0) > 0);
  const hasMovies = movies.length > 0;
  const hasShowtimes = showtimes.length > 0;
  const isReadyForBookings = hasCinemas && hasHalls && hasSeats && hasMovies && hasShowtimes;

  const setupSteps = [
    { step: 1, title: 'Create Cinema', done: hasCinemas, link: '/admin/cinemas', desc: 'Add cinema venues & locations' },
    { step: 2, title: 'Create Hall', done: hasHalls, link: '/admin/halls', desc: 'Configure halls & screens' },
    { step: 3, title: 'Generate Seats', done: hasSeats, link: '/admin/seats', desc: 'Generate seat maps & VIP tiers' },
    { step: 4, title: 'Add Movies', done: hasMovies, link: '/admin/movies', desc: 'Add posters, genres & duration' },
    { step: 5, title: 'Create Showtimes', done: hasShowtimes, link: '/admin/showtimes', desc: 'Schedule movies in halls' },
    { step: 6, title: 'Ready for Bookings', done: isReadyForBookings, link: '/movies', desc: 'Accept customer reservations' },
  ];

  const completedStepsCount = setupSteps.filter((s) => s.done).length;
  const progressPercentage = Math.round((completedStepsCount / setupSteps.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162035]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>CINEMA ENTERPRISE MANAGEMENT</span>
          </div>
          <h1 className="text-3xl font-black text-white">Administrator Overview</h1>
          <p className="text-xs text-slate-400">
            Real-time box office analytics, schedule orchestration, and seat allocations.
          </p>
        </div>

        {/* Database Seed Trigger */}
        <button
          onClick={handleSeedData}
          id="admin-seed-database-btn"
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#121c32] text-amber-300 hover:bg-[#192744] border border-amber-500/40 transition-colors shadow-md"
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>Seed Demo Cinema Data</span>
        </button>
      </div>

      {seedStatus && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-semibold">
          {seedStatus}
        </div>
      )}

      {/* CINEMA SETUP ONBOARDING WORKFLOW */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-[#0d1424] to-[#121c32] border border-[#1b263b] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b263b] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white tracking-wide">Cinema Setup Onboarding Workflow</h2>
            </div>
            <p className="text-xs text-slate-400">
              Follow these sequential steps to configure your cinema for public booking.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Completion</span>
              <span className="text-sm font-black text-amber-400">{progressPercentage}% Complete</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0a0f1d] border-2 border-amber-400 flex items-center justify-center text-xs font-bold text-white">
              {completedStepsCount}/6
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setupSteps.map((step) => (
            <Link
              key={step.step}
              to={step.link}
              className={`p-4 rounded-xl border transition-all flex items-start space-x-3 group ${
                step.done
                  ? 'bg-[#0f172a] border-emerald-900/50 hover:border-emerald-500/50'
                  : 'bg-[#0a0f1d] border-[#1b263b] hover:border-amber-500/50'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 group-hover:text-amber-400" />
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">STEP {step.step}</span>
                  {step.done && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      Done
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-bold truncate ${step.done ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">{step.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* KPI Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Revenue */}
        <div className="p-6 rounded-2xl bg-[#0d1424] border border-[#1b263b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white">
              {totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-400">ETB</span>
          </div>
          <span className="text-[11px] text-slate-400 block">From confirmed reservations</span>
        </div>

        {/* Bookings */}
        <div className="p-6 rounded-2xl bg-[#0d1424] border border-[#1b263b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reservations
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white block">
            {reservations.length}
          </span>
          <span className="text-[11px] text-slate-400 block">
            {reservations.filter((r) => r.status === 'CONFIRMED').length} confirmed passes
          </span>
        </div>

        {/* Movies */}
        <div className="p-6 rounded-2xl bg-[#0d1424] border border-[#1b263b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Movies
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white block">
            {movies.length}
          </span>
          <span className="text-[11px] text-slate-400 block">
            {movies.filter((m) => m.isNowShowing).length} currently showing
          </span>
        </div>

        {/* Venues & Halls */}
        <div className="p-6 rounded-2xl bg-[#0d1424] border border-[#1b263b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Venues & Halls
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{cinemas.length}</span>
            <span className="text-xs text-slate-400">Cinemas / {halls.length} Halls</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Across Addis Ababa</span>
        </div>
      </div>

      {/* Admin Modules Navigation Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide">Management Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <Link
            to="/admin/movies"
            id="admin-module-movies"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Movie Catalog
                </h3>
                <p className="text-xs text-slate-400">Add, edit movies & trailers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/cinemas"
            id="admin-module-cinemas"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Cinemas & Venues
                </h3>
                <p className="text-xs text-slate-400">Manage cinema locations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/halls"
            id="admin-module-halls"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Auditoriums & Halls
                </h3>
                <p className="text-xs text-slate-400">Configure screens & audio</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/seats"
            id="admin-module-seats"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Armchair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Seat Generator & Layouts
                </h3>
                <p className="text-xs text-slate-400">Generate rows & VIP tiers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/showtimes"
            id="admin-module-showtimes"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Showtime Scheduler
                </h3>
                <p className="text-xs text-slate-400">Set schedule & ticket prices</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/reservations"
            id="admin-module-reservations"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Master Bookings
                </h3>
                <p className="text-xs text-slate-400">View & manage all reservations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/users"
            id="admin-module-users"
            className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  User Roles & Access
                </h3>
                <p className="text-xs text-slate-400">Manage administrator privileges</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </section>

      {/* Recent Reservations Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Customer Bookings</h2>
          <Link
            to="/admin/reservations"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            View All →
          </Link>
        </div>

        <div className="bg-[#0d1424] border border-[#1b263b] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#121c32] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#1b263b]">
                <tr>
                  <th className="px-5 py-3">Booking Code</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Seats</th>
                  <th className="px-5 py-3">Total (ETB)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162035]">
                {reservations.slice(0, 5).map((res) => (
                  <tr key={res.id} className="hover:bg-[#121c32]">
                    <td className="px-5 py-3 font-mono font-bold text-amber-400">
                      {res.bookingCode || res.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">
                      {res.customerName || 'Customer'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-200">
                      {res.seatLabels?.join(', ') || 'N/A'}
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-400">
                      {res.totalPrice} ETB
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.status === 'CONFIRMED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : res.status === 'CANCELLED'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {res.createdAt?.split('T')[0] || 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
