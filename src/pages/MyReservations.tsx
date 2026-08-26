import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Film, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { EnrichedReservation, ReservationStatus } from '../types';
import { getUserReservations, cancelReservation } from '../services/reservations';
import { getShowtimes } from '../services/showtimes';
import { getMovies } from '../services/movies';
import { getCinemas } from '../services/cinemas';
import { getHalls } from '../services/halls';
import { ReservationCard } from '../components/ReservationCard';
import { useAuth } from '../context/AuthContext';

export const MyReservations: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ReservationStatus>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReservations = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [rawReservations, allShowtimes, allMovies, allCinemas, allHalls] = await Promise.all([
        getUserReservations(currentUser.uid),
        getShowtimes(),
        getMovies(),
        getCinemas(),
        getHalls(),
      ]);

      const showtimeMap = new Map(allShowtimes.map((s) => [s.id, s]));
      const movieMap = new Map(allMovies.map((m) => [m.id, m]));
      const cinemaMap = new Map(allCinemas.map((c) => [c.id, c]));
      const hallMap = new Map(allHalls.map((h) => [h.id, h]));

      const enriched: EnrichedReservation[] = rawReservations.map((res) => {
        const showtime = showtimeMap.get(res.showtimeId);
        const movie = showtime ? movieMap.get(showtime.movieId) : undefined;
        const cinema = showtime ? cinemaMap.get(showtime.cinemaId) : undefined;
        const hall = showtime ? hallMap.get(showtime.hallId) : undefined;

        return {
          ...res,
          showtime,
          movie,
          cinema,
          hall,
        };
      });

      setReservations(enriched);
    } catch (err: any) {
      console.error('Error loading reservations:', err);
      setActionMessage({ type: 'error', text: 'Failed to load reservations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [currentUser]);

  const handleCancelReservation = async (resId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The seats will be released for other cinema guests.')) {
      return;
    }

    try {
      await cancelReservation(resId);
      setActionMessage({
        type: 'success',
        text: 'Reservation was cancelled successfully and your seats have been released.',
      });
      await loadReservations();
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to cancel reservation.',
      });
    }
  };

  const filtered = reservations.filter((r) => {
    if (selectedStatus === 'ALL') return true;
    return r.status === selectedStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162035]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Ticket className="w-4 h-4" />
            <span>MEMBER ADMISSION PORTAL</span>
          </div>
          <h1 className="text-3xl font-black text-white">My Movie Bookings</h1>
          <p className="text-xs text-slate-400">
            Access your active digital tickets, admission passes, and reservation history.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 bg-[#0d1424] p-1 rounded-xl border border-[#1b263b]">
          {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStatus === status
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/50 border border-red-800 text-red-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline opacity-80 hover:opacity-100 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-[#0d1424] animate-pulse border border-[#1b263b]"
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((res) => (
            <ReservationCard
              key={res.id}
              reservation={res}
              onCancel={res.status === 'CONFIRMED' ? handleCancelReservation : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#0d1424] border border-[#1b263b] rounded-3xl space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No bookings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {selectedStatus !== 'ALL'
                ? `You have no ${selectedStatus.toLowerCase()} bookings.`
                : 'You haven’t reserved any tickets yet. Explore movies to book your night!'}
            </p>
          </div>
          <Link
            to="/movies"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-colors shadow-lg shadow-amber-950/50"
          >
            <Film className="w-4 h-4" />
            <span>Browse Now Showing</span>
          </Link>
        </div>
      )}
    </div>
  );
};
