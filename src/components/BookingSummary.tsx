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
    <div className="bg-[#12131c] border border-[#232535] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-2 pb-4 border-b border-[#1f212f]">
        <Ticket className="w-5 h-5 text-red-500" />
        <h3 className="text-base font-bold text-white tracking-wide">Booking Summary</h3>
      </div>

      {/* Movie Mini Card */}
      <div className="flex space-x-4">
        {showtime.movie?.posterUrl && (
          <img
            src={showtime.movie.posterUrl}
            alt={showtime.movie.title}
            className="w-16 h-24 object-cover rounded-lg border border-[#2a2c3d] shrink-0"
          />
        )}
        <div className="space-y-1 overflow-hidden">
          <h4 className="text-sm font-bold text-white truncate">
            {showtime.movie?.title || 'Selected Movie'}
          </h4>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1d1f2d] text-red-400 border border-red-900/40">
            {showtime.format || '2D'} • {showtime.movie?.genre || 'Cinema'}
          </span>
          <p className="text-xs text-gray-400">
            {showtime.movie?.duration ? `${showtime.movie.duration} mins` : ''}
          </p>
        </div>
      </div>

      {/* Venue & Time Details */}
      <div className="space-y-3 pt-2 text-xs border-t border-[#1a1c28]">
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-2 text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Cinema:</span>
          </span>
          <span className="font-semibold text-white">{showtime.cinema?.name || 'Kali Cinema'}</span>
        </div>

        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-2 text-gray-400">
            <Film className="w-3.5 h-3.5 text-red-500" />
            <span>Hall:</span>
          </span>
          <span className="font-semibold text-white">{showtime.hall?.name || 'Main Hall'}</span>
        </div>

        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-2 text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            <span>Date:</span>
          </span>
          <span className="font-semibold text-white">{showtime.date}</span>
        </div>

        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-2 text-gray-400">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>Showtime:</span>
          </span>
          <span className="font-semibold text-white">{showtime.startTime}</span>
        </div>

        <div className="flex items-start justify-between text-gray-300 pt-2 border-t border-[#1a1c28]">
          <span className="flex items-center space-x-2 text-gray-400">
            <Armchair className="w-3.5 h-3.5 text-red-500" />
            <span>Seats ({selectedSeats.length}):</span>
          </span>
          <span className="font-bold text-red-400 text-right max-w-[150px] truncate">
            {seatLabels || 'None selected'}
          </span>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="pt-4 border-t border-[#1f212f] space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Standard Ticket Base:</span>
          <span>{showtime.ticketPrice} ETB</span>
        </div>

        {selectedSeats.length > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Seats Count:</span>
            <span>× {selectedSeats.length}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-3 border-t border-[#232536]">
          <span className="text-sm font-bold text-gray-200">Total Amount:</span>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-400">
              {totalPrice} <span className="text-xs font-bold text-gray-300">ETB</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
