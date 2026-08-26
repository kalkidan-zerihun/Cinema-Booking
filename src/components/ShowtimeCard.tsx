import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Ticket, Sparkles, Armchair } from 'lucide-react';
import { EnrichedShowtime } from '../types';

interface ShowtimeCardProps {
  showtime: EnrichedShowtime;
}

export const ShowtimeCard: React.FC<ShowtimeCardProps> = ({ showtime }) => {
  const isVipFormat =
    showtime.format?.includes('IMAX') ||
    showtime.format?.includes('4DX') ||
    showtime.format?.includes('VIP') ||
    showtime.hall?.type === 'VIP';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#0c101a] border border-white/[0.08] hover:border-amber-400/50 transition-all duration-200 gap-4 group">
      {/* Time and Info */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-amber-400/40 shrink-0 transition-colors">
          <span className="text-base font-black text-white">{showtime.startTime}</span>
          <span className="text-[10px] uppercase font-bold text-amber-400">
            {showtime.format || '2D'}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              {showtime.hall?.name || 'Main Hall'}
            </span>
            {isVipFormat && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                <span>PREMIUM</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{showtime.cinema?.name || 'Cinema Lounge'}</span>
            <span>•</span>
            <span>{showtime.date}</span>
          </div>
        </div>
      </div>

      {/* Price & Select Seats Button */}
      <div className="flex items-center justify-between sm:justify-end space-x-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
        <div className="text-left sm:text-right">
          <span className="text-[11px] text-slate-400 block">From</span>
          <span className="text-base font-black text-amber-400">
            {showtime.ticketPrice} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </span>
        </div>

        <Link
          to={`/showtimes/${showtime.id}/seats`}
          id={`select-seats-btn-${showtime.id}`}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 shrink-0"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Select Seats</span>
        </Link>
      </div>
    </div>
  );
};
