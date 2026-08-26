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
    cinema: 'Kali Cinema',
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
        className="w-full bg-[#13141f] border border-[#2c2f42] rounded-3xl overflow-hidden shadow-2xl relative print:border-black print:bg-white print:text-black"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#e50914] to-[#990000] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Film className="w-5 h-5" />
            <span className="text-xl font-black tracking-widest uppercase">
              KALI CINEMA
            </span>
          </div>
          <p className="text-[11px] uppercase font-bold tracking-widest text-red-200">
            OFFICIAL ADMISSION E-PASS
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/30 backdrop-blur-md border border-white/20">
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">BOOKING CONFIRMED</span>
              </>
            ) : isCancelled ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-300" />
                <span className="text-red-200">RESERVATION CANCELLED</span>
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
                className="w-20 h-28 object-cover rounded-xl border border-[#27293b] shrink-0 shadow-md"
              />
            )}
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-500">
                {reservation.showtime?.format || '2D'} • {reservation.movie?.genre || 'Feature Film'}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {reservation.movie?.title || 'Selected Feature'}
              </h3>
              <p className="text-xs text-gray-400">
                Duration: {reservation.movie?.duration || 120} minutes
              </p>
              <p className="text-xs text-gray-400">
                Guest: <span className="text-gray-200 font-semibold">{reservation.customerName}</span>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0d0e15] border border-[#1e202e]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Cinema</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{reservation.cinema?.name || 'Kali Cinema Addis'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Hall</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Film className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{reservation.hall?.name || 'Hall 1'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Date</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{reservation.showtime?.date}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Time</span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{reservation.showtime?.startTime}</span>
              </div>
            </div>
          </div>

          {/* Seats Highlight */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#171926] to-[#12131d] border border-red-900/30">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                RESERVED SEATS
              </span>
              <div className="flex items-center space-x-2">
                <Armchair className="w-4 h-4 text-red-500" />
                <span className="text-base font-black text-white">
                  {reservation.seatLabels.join(', ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                TOTAL PAID
              </span>
              <div className="text-base font-black text-emerald-400">
                {reservation.totalPrice} <span className="text-xs text-gray-300">ETB</span>
              </div>
            </div>
          </div>

          {/* Perforated Stub Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t-2 border-dashed border-[#292b3d]" />
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-[#0c0d12] border border-[#2c2f42]" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-[#0c0d12] border border-[#2c2f42]" />
          </div>

          {/* Bottom Stub: QR Code & Booking Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                BOOKING REFERENCE
              </span>
              <span className="text-xl font-mono font-black text-red-400 tracking-wider">
                {reservation.bookingCode || 'KC-PASS'}
              </span>
              <p className="text-[10px] text-gray-400 max-w-[200px]">
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
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#1b1c28] text-white hover:bg-[#252738] border border-[#2f3248] transition-colors shadow-lg"
        >
          <Printer className="w-4 h-4 text-red-500" />
          <span>Print / Save Ticket</span>
        </button>

        {isConfirmed && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl font-semibold text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 transition-colors"
          >
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
};
