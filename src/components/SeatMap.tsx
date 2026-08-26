import React, { useMemo } from 'react';
import { Seat as SeatComponent, SeatVisualState } from './Seat';
import { Seat as SeatType } from '../types';
import { Tv, Sparkles, ShieldCheck } from 'lucide-react';

interface SeatMapProps {
  seats: SeatType[];
  reservedSeatIds: Set<string>;
  selectedSeatIds: Set<string>;
  onToggleSeat: (seat: SeatType) => void;
  hallName?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  reservedSeatIds,
  selectedSeatIds,
  onToggleSeat,
  hallName = 'Cinema Hall',
}) => {
  // Group seats by Row letter
  const groupedRows = useMemo(() => {
    const rowMap = new Map<string, SeatType[]>();
    for (const seat of seats) {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, []);
      }
      rowMap.get(seat.row)!.push(seat);
    }

    // Sort row keys
    const sortedRowKeys = Array.from(rowMap.keys()).sort();
    return sortedRowKeys.map((rowKey) => {
      const rowSeats = rowMap.get(rowKey)!.sort((a, b) => a.number - b.number);
      return {
        row: rowKey,
        seats: rowSeats,
      };
    });
  }, [seats]);

  return (
    <div className="flex flex-col items-center w-full bg-[#0c101a] border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Hall title & real-time badge */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
            {hallName} Auditorium
          </h3>
          <p className="text-xs text-slate-400">Click any available seat to select</p>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Availability</span>
        </div>
      </div>

      {/* Curved Screen Area */}
      <div className="w-full max-w-xl mb-10 flex flex-col items-center">
        <div className="relative w-full h-8 flex items-center justify-center">
          {/* Curved glowing screen line */}
          <div className="w-full h-3 rounded-[50%] border-t-2 border-amber-400/80 shadow-[0_-6px_20px_rgba(245,158,11,0.25)] cinema-screen-glow" />
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
          <Tv className="w-3 h-3 text-amber-400" />
          <span>CINEMA SCREEN</span>
        </div>
      </div>

      {/* Seats Container with Horizontal Scroll on Mobile */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        <div className="min-w-fit flex flex-col space-y-2.5 sm:space-y-3 px-2">
          {groupedRows.map(({ row, seats: rowSeats }) => (
            <div key={row} className="flex items-center space-x-2.5 sm:space-x-3">
              {/* Row Label Left */}
              <span className="w-4 text-center text-xs font-bold text-slate-400 select-none">
                {row}
              </span>

              {/* Row Seats */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {rowSeats.map((seat) => {
                  let visualState: SeatVisualState = 'AVAILABLE';
                  if (reservedSeatIds.has(seat.id)) {
                    visualState = 'RESERVED';
                  } else if (selectedSeatIds.has(seat.id)) {
                    visualState = 'SELECTED';
                  }

                  return (
                    <SeatComponent
                      key={seat.id}
                      seat={seat}
                      state={visualState}
                      onToggle={onToggleSeat}
                    />
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="w-4 text-center text-xs font-bold text-slate-400 select-none">
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full mt-8 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-md bg-white/[0.04] border border-white/[0.08]" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-md bg-amber-400 text-slate-950 font-bold" />
          <span className="font-semibold text-amber-400">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-md bg-white/[0.02] border border-white/[0.04] opacity-40" />
          <span className="text-slate-400">Occupied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-md bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-[7px] text-amber-300 font-bold">
            ★
          </div>
          <span className="text-amber-300">VIP Recliner</span>
        </div>
      </div>
    </div>
  );
};
