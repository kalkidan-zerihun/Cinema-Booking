import React from 'react';
import { Armchair, Sparkles } from 'lucide-react';
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
      'bg-[#0a0e1a] border-[#151c2d] text-slate-600 cursor-not-allowed opacity-50';
    contentColor = 'text-slate-600';
  } else if (state === 'SELECTED') {
    containerStyles =
      'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300/50';
    contentColor = 'text-slate-950 font-black';
  } else {
    // AVAILABLE
    if (isVip) {
      containerStyles =
        'bg-[#121d33] border-amber-500/50 text-amber-300 hover:bg-amber-950/40 hover:border-amber-400 cursor-pointer';
      contentColor = 'text-amber-300';
    } else {
      containerStyles =
        'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:bg-[#19243d] hover:border-amber-400/80 hover:text-white cursor-pointer';
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
      className={`relative group flex flex-col items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg border transition-all duration-150 select-none ${containerStyles}`}
    >
      {/* Tiny VIP badge */}
      {isVip && state !== 'SELECTED' && state !== 'RESERVED' && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-slate-950 font-bold">
          ★
        </span>
      )}

      <span className={`text-[10px] sm:text-xs font-bold leading-none ${contentColor}`}>
        {label}
      </span>
      
      <Armchair
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 opacity-70 ${
          state === 'SELECTED' ? 'text-slate-950 opacity-100' : contentColor
        }`}
      />
    </button>
  );
};

