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
    <div className="flex flex-col sm:flex-row items-stretch bg-[#13141f] border border-[#232535] hover:border-red-600/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-200">
      
      {/* Poster Column */}
      <div className="w-full sm:w-40 aspect-[2/3] sm:aspect-auto bg-[#1a1b28] relative shrink-0">
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
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isConfirmed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : isCancelled
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {reservation.status}
          </span>
        </div>
      </div>

      {/* Info Column */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                BOOKING #{reservation.bookingCode || reservation.id.slice(0, 8)}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {reservation.movie?.title || 'Selected Cinema Feature'}
              </h3>
            </div>

            <div className="hidden sm:block">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
                  isConfirmed
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    : isCancelled
                    ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                }`}
              >
                {isConfirmed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{reservation.status}</span>
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs text-gray-300">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{reservation.cinema?.name || 'Kali Cinema Addis'}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Film className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{reservation.hall?.name || 'Hall 1'}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{reservation.showtime?.date}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{reservation.showtime?.startTime}</span>
            </div>

            <div className="flex items-center space-x-1.5 col-span-2">
              <Armchair className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-bold text-white">Seats: {reservation.seatLabels.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-[#1e202e] flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Paid</span>
            <span className="text-base font-black text-emerald-400">
              {reservation.totalPrice} <span className="text-xs text-gray-300">ETB</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isConfirmed && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(reservation.id)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
              >
                Cancel
              </button>
            )}

            <Link
              to={`/my-reservations/${reservation.id}`}
              id={`view-pass-btn-${reservation.id}`}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-md shadow-red-950/30"
            >
              <QrCode className="w-4 h-4" />
              <span>View E-Pass</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
