import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Ticket,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Seat, EnrichedShowtime } from '../types';
import { getEnrichedShowtime } from '../services/showtimes';
import { getSeatsByHallId } from '../services/seats';
import {
  createReservationAtomic,
  subscribeToReservedSeats,
} from '../services/reservations';
import { SeatMap } from '../components/SeatMap';
import { BookingSummary } from '../components/BookingSummary';
import { useAuth } from '../context/AuthContext';

export const SeatSelection: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [showtime, setShowtime] = useState<EnrichedShowtime | null>(null);
  const [hallSeats, setHallSeats] = useState<Seat[]>([]);
  const [reservedSeatIds, setReservedSeatIds] = useState<Set<string>>(new Set());
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Showtime & Hall Seats
  useEffect(() => {
    if (!showtimeId) return;

    let unsubReservedSeats: (() => void) | null = null;

    const init = async () => {
      setLoading(true);
      try {
        const showtimeData = await getEnrichedShowtime(showtimeId);
        if (!showtimeData) {
          setErrorMessage('Showtime could not be found or has expired.');
          setLoading(false);
          return;
        }
        setShowtime(showtimeData);

        // Fetch Hall physical seats
        const seats = await getSeatsByHallId(showtimeData.hallId);
        setHallSeats(seats);

        // Subscribe to real-time reserved seats for this showtime
        unsubReservedSeats = subscribeToReservedSeats(showtimeId, (reservedIds) => {
          setReservedSeatIds(reservedIds);

          // If a currently selected seat was just reserved by someone else in real-time, auto-deselect it!
          setSelectedSeatIds((prevSelected) => {
            const next = new Set<string>();
            let lostSeat = false;
            prevSelected.forEach((seatId) => {
              if (reservedIds.has(seatId)) {
                lostSeat = true;
              } else {
                next.add(seatId);
              }
            });
            if (lostSeat) {
              setErrorMessage('A seat you selected was just reserved by another customer in real time.');
            }
            return next;
          });
        });
      } catch (err: any) {
        console.error('Error loading showtime & seats:', err);
        setErrorMessage(err.message || 'Failed to load cinema seat map.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubReservedSeats) unsubReservedSeats();
    };
  }, [showtimeId]);

  // Handle seat click
  const handleToggleSeat = (seat: Seat) => {
    setErrorMessage(null);
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        // Max 8 seats per booking
        if (next.size >= 8) {
          setErrorMessage('You can select a maximum of 8 seats per reservation.');
          return prev;
        }
        next.add(seat.id);
      }
      return next;
    });
  };

  // Selected seat objects
  const selectedSeats = useMemo(() => {
    return hallSeats.filter((s) => selectedSeatIds.has(s.id));
  }, [hallSeats, selectedSeatIds]);

  // Calculate total price accurately
  const totalPrice = useMemo(() => {
    if (!showtime) return 0;
    const basePrice = showtime.ticketPrice || 250;
    return selectedSeats.reduce((sum, seat) => {
      const mod = seat.priceModifier || 1.0;
      return sum + Math.round(basePrice * mod);
    }, 0);
  }, [showtime, selectedSeats]);

  // Submit Reservation (ATOMIC WITH CONCURRENCY PROTECTION)
  const handleProceedToPayment = async () => {
    if (!showtimeId || selectedSeatIds.size === 0) {
      setErrorMessage('Please select at least one seat on the seat map.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const reservation = await createReservationAtomic({
        showtimeId,
        seatIds: Array.from(selectedSeatIds),
        userId: currentUser?.uid,
        customerName: userProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Customer',
        customerEmail: currentUser?.email || 'customer@cinema.com',
        customerPhone: userProfile?.phone || '',
      });

      // Navigate to payment page with newly created locked reservation
      navigate(`/booking/${reservation.id}`);
    } catch (err: any) {
      console.error('Reservation failed:', err);
      setErrorMessage(
        err.message ||
          'Failed to lock seats. One or more seats may have been reserved by another customer. Please select available seats and retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading auditorium seat layout...</p>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#0c101a] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Showtime Unavailable</h2>
        <p className="text-xs text-slate-400">
          {errorMessage || 'The requested screening is no longer available.'}
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Browse Other Movies</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Movie Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="space-y-1">
          <Link
            to={`/movies/${showtime.movieId}`}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {showtime.movie?.title || 'Movie'}</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Select Your Seats
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="text-white font-semibold">{showtime.movie?.title}</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {showtime.date} at {showtime.startTime}
              </span>
            </span>
            <span>•</span>
            <span>{showtime.hall?.name}</span>
          </div>
        </div>

        {/* 15-Min Lock Guarantee Info */}
        <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>15-Minute Seat Lock on Selection</span>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Seating Layout & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Interactive Seat Map */}
        <div className="lg:col-span-2 space-y-6">
          <SeatMap
            seats={hallSeats}
            reservedSeatIds={reservedSeatIds}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            hallName={showtime.hall?.name}
          />
        </div>

        {/* Right Col: Booking Summary & Checkout Trigger */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <BookingSummary
            showtime={showtime}
            selectedSeats={selectedSeats}
            totalPrice={totalPrice}
          />

          <button
            onClick={handleProceedToPayment}
            id="proceed-to-payment-btn"
            disabled={selectedSeatIds.size === 0 || submitting}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xl ${
              selectedSeatIds.size > 0 && !submitting
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/25 cursor-pointer'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Securing Your Seats...</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                <span>
                  {selectedSeatIds.size > 0
                    ? `Proceed to Payment (${totalPrice} ETB)`
                    : 'Select Seats on Map'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
