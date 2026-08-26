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
        customerName: userProfile?.name || currentUser?.displayName || 'Cinema Guest',
        customerEmail: userProfile?.email || currentUser?.email || '',
      });

      // Successful atomic lock -> proceed to payment page
      navigate(`/booking/${reservation.id}`);
    } catch (err: any) {
      console.error('Reservation creation error:', err);
      setErrorMessage(
        err.message || 'One or more selected seats are no longer available. Please select available seats.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-400">
          Connecting to real-time seat inventory for this showtime...
        </p>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141522] border border-[#222432] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Showtime Not Available</h2>
        <p className="text-xs text-gray-400">
          {errorMessage || 'This showtime could not be loaded.'}
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Other Showtimes</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Showtime Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202232]">
        <div className="space-y-1">
          <Link
            to={showtime.movieId ? `/movies/${showtime.movieId}` : '/movies'}
            className="inline-flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Movie Details</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {showtime.movie?.title || 'Movie'} — Seat Selection
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{showtime.cinema?.name}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>{showtime.hall?.name}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span>{showtime.date}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>{showtime.startTime}</span>
            </span>
          </div>
        </div>

        {/* Live Protection Status */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#141624] border border-[#26293d] text-xs text-gray-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Atomic Concurrency Lock Enabled</span>
        </div>
      </div>

      {/* Error / Conflict Alert */}
      {errorMessage && (
        <div className="flex items-start space-x-3 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Seat Availability Notice</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Seat Map & Summary Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Interactive Seat Map */}
        <div className="lg:col-span-2 space-y-6">
          <SeatMap
            seats={hallSeats}
            reservedSeatIds={reservedSeatIds}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            hallName={showtime.hall?.name}
          />
        </div>

        {/* Right 1 Column: Summary & Checkout CTA */}
        <div className="space-y-6 lg:sticky lg:top-28">
          <BookingSummary
            showtime={showtime}
            selectedSeats={selectedSeats}
            totalPrice={totalPrice}
          />

          <button
            type="button"
            id="proceed-to-payment-btn"
            disabled={submitting || selectedSeats.length === 0}
            onClick={handleProceedToPayment}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-all duration-200 shadow-xl shadow-red-950/70 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            {submitting ? (
              <span>Securing Seat Locks...</span>
            ) : (
              <>
                <Ticket className="w-5 h-5" />
                <span>
                  Reserve & Proceed ({totalPrice} ETB)
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Selected seats will be reserved under your account upon proceeding.
          </p>
        </div>
      </div>
    </div>
  );
};
