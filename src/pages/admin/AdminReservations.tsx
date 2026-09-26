import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  DollarSign,
  User,
  Film,
} from 'lucide-react';
import { EnrichedReservation, ReservationStatus, Payment } from '../../types';
import {
  getAllReservations,
  cancelReservation,
  confirmOfflinePayment,
} from '../../services/reservations';
import { getAllPayments } from '../../services/payments';
import { getShowtimes } from '../../services/showtimes';
import { getMovies } from '../../services/movies';
import { getCinemas } from '../../services/cinemas';
import { getHalls } from '../../services/halls';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [paymentsByReservation, setPaymentsByReservation] = useState<Map<string, Payment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ReservationStatus>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const [rawReservations, allShowtimes, allMovies, allCinemas, allHalls, allPayments] = await Promise.all([
        getAllReservations(),
        getShowtimes(),
        getMovies(),
        getCinemas(),
        getHalls(),
        getAllPayments(),
      ]);

      const showtimeMap = new Map(allShowtimes.map((s) => [s.id, s]));
      const movieMap = new Map(allMovies.map((m) => [m.id, m]));
      const cinemaMap = new Map(allCinemas.map((c) => [c.id, c]));
      const hallMap = new Map(allHalls.map((h) => [h.id, h]));
      // Payments are keyed by reservationId in the Cloud Functions, so
      // this map lets the UI know — same as the server rule does —
      // whether a PENDING reservation is an offline (PAY_AT_CINEMA) hold
      // that staff may confirm, or an online payment that only the
      // Chapa verification flow may confirm.
      const paymentMap = new Map(allPayments.map((p) => [p.reservationId, p]));

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
      setPaymentsByReservation(paymentMap);
    } catch (err: any) {
      console.error('Error loading admin reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (resId: string, bookingCode: string) => {
    if (!window.confirm(`Cancel reservation #${bookingCode}? This will free the seats in Firestore.`)) {
      return;
    }

    try {
      await cancelReservation(resId);
      setMessage({
        type: 'success',
        text: `Reservation #${bookingCode} was cancelled and its seats released.`,
      });
      await loadReservations();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel reservation.' });
    }
  };

  const handleSetConfirmed = async (resId: string, bookingCode: string) => {
    // Mirrors the server-enforced rule: only a reservation with an
    // explicit PAY_AT_CINEMA payment record may be confirmed manually
    // here. Online payments (Chapa/Telebirr/Card) can only move to
    // CONFIRMED via verified Chapa webhook/callback — the write would be
    // rejected by Firestore rules even if this check were bypassed.
    const payment = paymentsByReservation.get(resId);
    if (!payment || payment.method !== 'PAY_AT_CINEMA') {
      setMessage({
        type: 'error',
        text: `Reservation #${bookingCode} is not an offline (pay-at-cinema) hold. Online payments confirm automatically once Chapa verifies them.`,
      });
      return;
    }

    try {
      await confirmOfflinePayment(resId);
      setMessage({
        type: 'success',
        text: `Reservation #${bookingCode} status updated to CONFIRMED.`,
      });
      await loadReservations();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    }
  };

  const filtered = reservations.filter((r) => {
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = r.bookingCode?.toLowerCase().includes(q);
      const nameMatch = r.customerName?.toLowerCase().includes(q);
      const emailMatch = r.customerEmail?.toLowerCase().includes(q);
      const movieMatch = r.movie?.title.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch && !emailMatch && !movieMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162035]">
        <div className="space-y-1">
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Master Reservations Ledger</h1>
          <p className="text-xs text-slate-400">
            Real-time audit log of all customer ticket purchases, seat holds, and cancellations.
          </p>
        </div>

        <span className="text-xs font-bold text-slate-400 bg-[#0d1424] px-4 py-2 rounded-xl border border-[#1b263b]">
          Total Bookings: <strong className="text-white">{reservations.length}</strong>
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d1424] p-4 rounded-2xl border border-[#1b263b]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, customer name, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-[#121c32] p-1 rounded-xl border border-[#1b263b] w-full sm:w-auto justify-center">
          {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStatus === st
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1424] border border-[#1b263b] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121c32] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#1b263b]">
              <tr>
                <th className="px-5 py-3">Booking Code</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Movie & Session</th>
                <th className="px-5 py-3">Seats</th>
                <th className="px-5 py-3">Total (ETB)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162035]">
              {filtered.map((res) => (
                <tr key={res.id} className="hover:bg-[#121c32]">
                  <td className="px-5 py-3">
                    <span className="font-mono font-bold text-amber-400 block text-xs">
                      #{res.bookingCode || res.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-white block">{res.customerName}</span>
                    <span className="text-slate-400 text-[11px] block">{res.customerEmail}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-slate-200 block">{res.movie?.title || 'Movie'}</span>
                    <span className="text-slate-400 text-[11px] block">
                      {res.cinema?.name} • {res.showtime?.date} ({res.showtime?.startTime})
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-white">
                      {res.seatLabels?.join(', ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-emerald-400">
                    {res.totalPrice} ETB
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        res.status === 'CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : res.status === 'CANCELLED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {res.status === 'PENDING' &&
                        paymentsByReservation.get(res.id)?.method === 'PAY_AT_CINEMA' && (
                          <button
                            onClick={() => handleSetConfirmed(res.id, res.bookingCode || res.id.slice(0, 8))}
                            title="Confirm pay-at-cinema payment"
                            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      {res.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(res.id, res.bookingCode || res.id.slice(0, 8))}
                          title="Cancel Reservation & Free Seats"
                          className="p-1.5 rounded-lg bg-red-950 text-red-400 hover:bg-red-900 border border-red-800"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
