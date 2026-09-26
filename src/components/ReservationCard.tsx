import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Armchair,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Film,
} from 'lucide-react';
import { EnrichedReservation } from '../types';

interface ReservationCardProps {
  reservation: EnrichedReservation;
  onCancel?: (reservationId: string) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, onCancel }) => {
  const isConfirmed = reservation.status === 'CONFIRMED';
  const isCancelled = reservation.status === 'CANCELLED';

  return (
    <div className="flex flex-col sm:flex-row items-stretch bg-[#0c101a] border border-white/[0.08] hover:border-amber-400/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-200">
      {/* Poster Column */}
      <div className="w-full sm:w-36 aspect-[2/3] sm:aspect-auto bg-slate-900 relative shrink-0">
        <img
          src={
            reservation.movie?.posterUrl ||
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
          }
          alt={reservation.movie?.title || 'Movie'}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 sm:hidden">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isConfirmed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : isCancelled
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {reservation.status}
          </span>
        </div>
      </div>

      {/* Info Column */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                BOOKING #{reservation.bookingCode || reservation.id.slice(0, 8)}
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {reservation.movie?.title || 'Selected Cinema Feature'}
              </h3>
            </div>

            <div className="hidden sm:block">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1 ${
                  isConfirmed
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : isCancelled
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                }`}
              >
                {isConfirmed ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{reservation.status}</span>
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{reservation.cinema?.name || 'Cinema Lounge'}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{reservation.hall?.name || 'Hall 1'}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{reservation.showtime?.date}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{reservation.showtime?.startTime}</span>
            </div>

            <div className="flex items-center space-x-1.5 col-span-2">
              <Armchair className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">Seats: {reservation.seatLabels.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Amount</span>
            <span className="text-sm font-bold text-amber-400">
              {reservation.totalPrice} <span className="text-xs text-slate-400">ETB</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isConfirmed && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(reservation.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
              >
                Cancel
              </button>
            )}

            <Link
              to={`/my-reservations/${reservation.id}`}
              id={`view-pass-btn-${reservation.id}`}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>View E-Pass</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
