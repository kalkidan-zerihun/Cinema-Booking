import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Ticket, Sparkles } from 'lucide-react';
import { EnrichedShowtime } from '../types';

interface ShowtimeCardProps {
  showtime: EnrichedShowtime;
}

export const ShowtimeCard: React.FC<ShowtimeCardProps> = ({ showtime }) => {
  const isVipFormat = showtime.format?.includes('IMAX') || showtime.format?.includes('4DX');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#0d1424] border border-[#1b263b] hover:border-amber-400/50 transition-all duration-200 gap-4">
      {/* Time and Info */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-[#121c32] border border-[#1e2d4d] shrink-0">
          <span className="text-lg font-black text-white">{showtime.startTime}</span>
          <span className="text-[10px] uppercase font-bold text-amber-400">
            {showtime.format || '2D'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">
              {showtime.hall?.name || 'Main Hall'}
            </span>
            {isVipFormat && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3 h-3" />
                <span>PREMIUM</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{showtime.cinema?.name || 'Cinema'}</span>
            <span>•</span>
            <span>{showtime.date}</span>
          </div>
        </div>
      </div>

      {/* Price & Select Seats Button */}
      <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a253a]">
        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 block">Ticket Price</span>
          <span className="text-base font-black text-amber-300">
            {showtime.ticketPrice} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </span>
        </div>

        <Link
          to={`/showtimes/${showtime.id}/seats`}
          id={`select-seats-btn-${showtime.id}`}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-colors shadow-md shadow-amber-950/40 shrink-0"
        >
          <Ticket className="w-4 h-4" />
          <span>Select Seats</span>
        </Link>
      </div>
    </div>
  );
};
