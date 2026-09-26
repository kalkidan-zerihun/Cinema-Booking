import React from 'react';
import { Armchair } from 'lucide-react';
import { Seat as SeatType } from '../types';

export type SeatVisualState = 'AVAILABLE' | 'SELECTED' | 'RESERVED';

interface SeatComponentProps {
  seat: SeatType;
  state: SeatVisualState;
  onToggle: (seat: SeatType) => void;
}

export const Seat: React.FC<SeatComponentProps> = ({ seat, state, onToggle }) => {
  const isVip = seat.type === 'VIP';
  const label = seat.label || `${seat.row}${seat.number}`;

  let containerStyles = '';
  let contentColor = '';

  if (state === 'RESERVED') {
    containerStyles =
      'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-40';
    contentColor = 'text-slate-600';
  } else if (state === 'SELECTED') {
    containerStyles =
      'bg-amber-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30 scale-105 ring-2 ring-amber-300/40';
    contentColor = 'text-slate-950 font-black';
  } else {
    // AVAILABLE
    if (isVip) {
      containerStyles =
        'bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20 hover:border-amber-400 cursor-pointer';
      contentColor = 'text-amber-300';
    } else {
      containerStyles =
        'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:border-amber-400/60 hover:text-white cursor-pointer';
      contentColor = 'text-slate-300';
    }
  }

  return (
    <button
      type="button"
      id={`seat-btn-${seat.id}`}
      disabled={state === 'RESERVED'}
      onClick={() => onToggle(seat)}
      title={`${label} (${isVip ? 'VIP Recliner' : 'Standard'}) - ${state}`}
      className={`relative group flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl border transition-all duration-150 select-none ${containerStyles}`}
    >
      {/* Tiny VIP star indicator */}
      {isVip && state !== 'SELECTED' && state !== 'RESERVED' && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-slate-950 font-bold">
          ★
        </span>
      )}

      <span className={`text-[9px] sm:text-[11px] font-bold leading-none ${contentColor}`}>
        {label}
      </span>

      <Armchair
        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 mt-0.5 opacity-80 ${
          state === 'SELECTED' ? 'text-slate-950 opacity-100' : contentColor
        }`}
      />
    </button>
  );
};
