import React from 'react';
import { Film, MapPin, Calendar, Clock, Armchair, Ticket } from 'lucide-react';
import { EnrichedShowtime, Seat } from '../types';

interface BookingSummaryProps {
  showtime: EnrichedShowtime;
  selectedSeats: Seat[];
  totalPrice: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  showtime,
  selectedSeats,
  totalPrice,
}) => {
  const seatLabels = selectedSeats
    .map((s) => s.label || `${s.row}${s.number}`)
    .join(', ');

  return (
    <div className="bg-[#0c101a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex items-center space-x-2 pb-3.5 border-b border-white/[0.06]">
        <Ticket className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white tracking-wide">Reservation Summary</h3>
      </div>

      {/* Movie Mini Card */}
      <div className="flex space-x-3.5">
        {showtime.movie?.posterUrl && (
          <img
            src={showtime.movie.posterUrl}
            alt={showtime.movie.title}
            className="w-14 h-20 object-cover rounded-xl border border-white/10 shrink-0"
          />
        )}
        <div className="space-y-1 overflow-hidden">
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
            {showtime.movie?.title || 'Selected Movie'}
          </h4>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] text-amber-400 border border-white/[0.08]">
            {showtime.format || '2D'} • {showtime.movie?.genre || 'Cinema'}
          </span>
          <p className="text-[11px] text-slate-400">
            {showtime.movie?.duration ? `${showtime.movie.duration} mins` : ''}
          </p>
        </div>
      </div>

      {/* Venue & Time Details */}
      <div className="space-y-2.5 pt-2 text-xs border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Cinema:</span>
          </span>
          <span className="font-semibold text-white truncate max-w-[140px]">
            {showtime.cinema?.name || 'Cinema'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-2 text-slate-400">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Hall:</span>
          </span>
          <span className="font-semibold text-white">{showtime.hall?.name || 'Main Hall'}</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-2 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Date:</span>
          </span>
          <span className="font-semibold text-white">{showtime.date}</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Showtime:</span>
          </span>
          <span className="font-semibold text-white">{showtime.startTime}</span>
        </div>

        <div className="flex items-start justify-between text-slate-300 pt-2 border-t border-white/[0.06]">
          <span className="flex items-center space-x-2 text-slate-400">
            <Armchair className="w-3.5 h-3.5 text-amber-400" />
            <span>Seats ({selectedSeats.length}):</span>
          </span>
          <span className="font-bold text-amber-400 text-right max-w-[140px] truncate">
            {seatLabels || 'None selected'}
          </span>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Standard Ticket Base:</span>
          <span>{showtime.ticketPrice} ETB</span>
        </div>

        {selectedSeats.length > 0 && (
          <div className="flex justify-between text-xs text-slate-400">
            <span>Seats Count:</span>
            <span>× {selectedSeats.length}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-2.5 border-t border-white/[0.08]">
          <span className="text-xs sm:text-sm font-bold text-slate-200">Total Amount:</span>
          <div className="text-right">
            <span className="text-lg font-black text-amber-400">
              {totalPrice} <span className="text-xs font-bold text-slate-400">ETB</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
