import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Film,
  MapPin,
  Calendar,
  Clock,
  Armchair,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { EnrichedReservation } from '../types';

interface DigitalTicketProps {
  reservation: EnrichedReservation;
  onCancel?: () => void;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({ reservation, onCancel }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = reservation.status === 'CONFIRMED';
  const isCancelled = reservation.status === 'CANCELLED';

  const verificationPayload = JSON.stringify({
    cinema: 'Cinema',
    code: reservation.bookingCode,
    resId: reservation.id,
    seats: reservation.seatLabels,
  });

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-6">
      {/* Ticket Pass Container */}
      <div
        ref={ticketRef}
        id={`digital-ticket-${reservation.id}`}
        className="w-full bg-[#0c101a] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl relative print:border-black print:bg-white print:text-black"
      >
        {/* Top Header */}
        <div className="bg-amber-400 p-5 text-slate-950 text-center relative overflow-hidden">
          <div className="flex items-center justify-center space-x-2 mb-0.5">
            <Film className="w-4 h-4" />
            <span className="text-base font-black tracking-wider uppercase">
              CINEMA
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-900/80">
            OFFICIAL ADMISSION E-PASS
          </p>

          <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md border border-white/10 text-white">
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">BOOKING CONFIRMED</span>
              </>
            ) : isCancelled ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                <span className="text-rose-200">RESERVATION CANCELLED</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">PAYMENT PENDING</span>
              </>
            )}
          </div>
        </div>

        {/* Ticket Main Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Movie Title & Poster Banner */}
          <div className="flex space-x-3.5">
            {reservation.movie?.posterUrl && (
              <img
                src={reservation.movie.posterUrl}
                alt={reservation.movie.title}
                className="w-16 h-24 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
              />
            )}
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {reservation.showtime?.format || '2D'} • {reservation.movie?.genre || 'Feature Film'}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                {reservation.movie?.title || 'Selected Feature'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Guest: <span className="text-slate-200 font-semibold">{reservation.customerName}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cinema</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{reservation.cinema?.name || 'Cinema Lounge'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hall</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Film className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{reservation.hall?.name || 'Hall 1'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{reservation.showtime?.date}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Time</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{reservation.showtime?.startTime}</span>
              </div>
            </div>
          </div>

          {/* Seats Highlight */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-amber-400/20">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                RESERVED SEATS
              </span>
              <div className="flex items-center space-x-1.5">
                <Armchair className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  {reservation.seatLabels.join(', ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                TOTAL
              </span>
              <div className="text-sm font-bold text-amber-400">
                {reservation.totalPrice} <span className="text-[10px] text-slate-400">ETB</span>
              </div>
            </div>
          </div>

          {/* Perforated Stub Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-dashed border-white/20" />
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-[#07090e] border border-white/[0.08]" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-[#07090e] border border-white/[0.08]" />
          </div>

          {/* Bottom Stub: QR Code & Booking Code */}
          <div className="flex flex-row items-center justify-between gap-4 pt-1">
            <div className="space-y-1 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                BOOKING REFERENCE
              </span>
              <span className="text-lg font-mono font-black text-amber-400 tracking-wider">
                {reservation.bookingCode || 'CN-PASS'}
              </span>
              <p className="text-[10px] text-slate-400 max-w-[170px]">
                Scan at the hall turnstile for admission.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
              <QRCodeSVG
                value={verificationPayload}
                size={80}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/[0.1] transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Print / Save Ticket</span>
        </button>

        {isConfirmed && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 transition-colors"
          >
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
};
