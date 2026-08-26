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
      'bg-[#1a1215] border-[#381a20] text-gray-600 cursor-not-allowed opacity-60';
    contentColor = 'text-gray-600';
  } else if (state === 'SELECTED') {
    containerStyles =
      'bg-[#e50914] border-red-400 text-white shadow-lg shadow-red-900/60 scale-105 ring-2 ring-red-400/40';
    contentColor = 'text-white font-black';
  } else {
    // AVAILABLE
    if (isVip) {
      containerStyles =
        'bg-[#191824] border-amber-500/40 text-amber-200 hover:bg-amber-950/40 hover:border-amber-400 cursor-pointer';
      contentColor = 'text-amber-300';
    } else {
      containerStyles =
        'bg-[#181a24] border-[#292c3d] text-gray-300 hover:bg-[#252838] hover:border-red-500/60 hover:text-white cursor-pointer';
      contentColor = 'text-gray-300';
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
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-black">
          ★
        </span>
      )}

      <span className={`text-[10px] sm:text-xs font-bold leading-none ${contentColor}`}>
        {label}
      </span>
      
      <Armchair
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 opacity-60 ${
          state === 'SELECTED' ? 'text-white opacity-95' : contentColor
        }`}
      />
    </button>
  );
};
