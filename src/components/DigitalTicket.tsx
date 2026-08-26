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
  Share2,
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
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-6">
      
      {/* Ticket Pass Container */}
      <div
        ref={ticketRef}
        id={`digital-ticket-${reservation.id}`}
        className="w-full bg-[#0a0f1d] border border-[#1b263b] rounded-3xl overflow-hidden shadow-2xl relative print:border-black print:bg-white print:text-black"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 text-slate-950 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Film className="w-5 h-5" />
            <span className="text-xl font-black tracking-widest uppercase">
              CINEMA
            </span>
          </div>
          <p className="text-[11px] uppercase font-extrabold tracking-widest text-slate-900/80">
            OFFICIAL ADMISSION E-PASS
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/40 backdrop-blur-md border border-white/20 text-white">
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">BOOKING CONFIRMED</span>
              </>
            ) : isCancelled ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-300" />
                <span className="text-rose-200">RESERVATION CANCELLED</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="text-amber-200">PAYMENT PENDING</span>
              </>
            )}
          </div>
        </div>

        {/* Ticket Main Body */}
        <div className="p-6 space-y-6">
          
          {/* Movie Title & Poster Banner */}
          <div className="flex space-x-4">
            {reservation.movie?.posterUrl && (
              <img
                src={reservation.movie.posterUrl}
                alt={reservation.movie.title}
                className="w-20 h-28 object-cover rounded-xl border border-[#1e2d4d] shrink-0 shadow-md"
              />
            )}
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                {reservation.showtime?.format || '2D'} • {reservation.movie?.genre || 'Feature Film'}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {reservation.movie?.title || 'Selected Feature'}
              </h3>
              <p className="text-xs text-slate-400">
                Duration: {reservation.movie?.duration || 120} minutes
              </p>
              <p className="text-xs text-slate-400">
                Guest: <span className="text-slate-200 font-semibold">{reservation.customerName}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#060a14] border border-[#162035]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cinema</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{reservation.cinema?.name || 'Cinema Addis'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hall</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{reservation.hall?.name || 'Hall 1'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{reservation.showtime?.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Time</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{reservation.showtime?.startTime}</span>
              </div>
            </div>
          </div>

          {/* Seats Highlight */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#101728] to-[#0c1220] border border-amber-500/30">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                RESERVED SEATS
              </span>
              <div className="flex items-center space-x-2">
                <Armchair className="w-4 h-4 text-amber-400" />
                <span className="text-base font-black text-white">
                  {reservation.seatLabels.join(', ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                TOTAL PAID
              </span>
              <div className="text-base font-black text-amber-300">
                {reservation.totalPrice} <span className="text-xs text-slate-400">ETB</span>
              </div>
            </div>
          </div>

          {/* Perforated Stub Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t-2 border-dashed border-[#1b263b]" />
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-[#070a12] border border-[#1b263b]" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-[#070a12] border border-[#1b263b]" />
          </div>

          {/* Bottom Stub: QR Code & Booking Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                BOOKING REFERENCE
              </span>
              <span className="text-xl font-mono font-black text-amber-400 tracking-wider">
                {reservation.bookingCode || 'CN-PASS'}
              </span>
              <p className="text-[10px] text-slate-400 max-w-[200px]">
                Scan at the ticket validator upon entering the hall.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0">
              <QRCodeSVG
                value={verificationPayload}
                size={96}
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
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#101726] text-white hover:bg-[#182338] border border-[#1e2d4d] transition-colors shadow-lg"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print / Save Ticket</span>
        </button>

        {isConfirmed && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 transition-colors"
          >
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
};
