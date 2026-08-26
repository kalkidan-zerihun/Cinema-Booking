import React, { useMemo } from 'react';
import { Seat as SeatComponent, SeatVisualState } from './Seat';
import { Seat as SeatType } from '../types';
import { Sparkles, Tv, ShieldCheck } from 'lucide-react';

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
    <div className="flex flex-col items-center w-full bg-[#0e0f16] border border-[#202230] rounded-2xl p-4 sm:p-8 shadow-xl">
      
      {/* Hall title & real-time badge */}
      <div className="w-full flex items-center justify-between pb-6 border-b border-[#1c1d29] mb-8">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {hallName} Seating Layout
          </h3>
          <p className="text-xs text-gray-400">Click on available seats to reserve</p>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Availability</span>
        </div>
      </div>

      {/* Curved Screen Area */}
      <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
        <div className="relative w-full h-8 flex items-center justify-center">
          {/* Curved glowing screen line */}
          <div className="w-full h-3 rounded-[50%] border-t-4 border-red-500/80 shadow-[0_-8px_25px_rgba(229,9,20,0.5)] cinema-screen-glow" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-black tracking-widest text-gray-400 uppercase mt-1">
          <Tv className="w-3.5 h-3.5 text-red-500" />
          <span>CINEMA SCREEN</span>
        </div>
      </div>

      {/* Seats Container with Horizontal Scroll on Mobile */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        <div className="min-w-fit flex flex-col space-y-3 sm:space-y-4 px-2">
          {groupedRows.map(({ row, seats: rowSeats }) => (
            <div key={row} className="flex items-center space-x-3 sm:space-x-4">
              {/* Row Label Left */}
              <span className="w-5 text-center text-xs font-black text-gray-400 select-none">
                {row}
              </span>

              {/* Row Seats */}
              <div className="flex items-center space-x-2 sm:space-x-3">
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
              <span className="w-5 text-center text-xs font-black text-gray-400 select-none">
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full mt-10 pt-6 border-t border-[#1c1d29] flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-gray-300">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#181a24] border border-[#292c3d]" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#e50914] border border-red-400 shadow-sm shadow-red-900" />
          <span className="font-semibold text-white">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#1a1215] border border-[#381a20] opacity-70" />
          <span className="text-gray-500">Reserved (Occupied)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-[#191824] border border-amber-500/60 flex items-center justify-center text-[8px] text-amber-300">
            ★
          </div>
          <span className="text-amber-300">VIP Recliner</span>
        </div>
      </div>
    </div>
  );
};
