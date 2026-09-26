import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Film,
  Ticket,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';
import { EnrichedReservation, PaymentMethod } from '../types';
import { getEnrichedReservation } from '../services/reservations';
import { initializePayment } from '../services/payments';
import { PaymentMethods } from '../components/PaymentMethods';
import { DigitalTicket } from '../components/DigitalTicket';

export const Booking: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<EnrichedReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');

  // Payment Form States
  const [phone, setPhone] = useState('0911234567');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) return;

    const fetchReservation = async () => {
      try {
        const resData = await getEnrichedReservation(reservationId);
        if (!resData) {
          setErrorMessage('Reservation record could not be found.');
          setLoading(false);
          return;
        }
        setReservation(resData);
        if (resData.status === 'CONFIRMED') {
          setPaymentSuccess(true);
        }
      } catch (err: any) {
        console.error('Error fetching reservation:', err);
        setErrorMessage(err.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  const celebrate = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e50914', '#ffffff', '#ffd700', '#22c55e'],
      });
    } catch {
      // ignore if canvas blocked
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationId || !reservation) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      const result = await initializePayment({ reservationId, method: paymentMethod });

      if (result.alreadyConfirmed) {
        const updated = await getEnrichedReservation(reservationId);
        if (updated) setReservation(updated);
        setPaymentSuccess(true);
        celebrate();
        return;
      }

      if (paymentMethod === 'PAY_AT_CINEMA') {
        const updated = await getEnrichedReservation(reservationId);
        if (updated) setReservation(updated);
        setPaymentSuccess(true);
        celebrate();
        return;
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      throw new Error('Payment could not be started. Please try again.');
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setErrorMessage(err.message || 'Payment could not be started. Please check your details and try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading your reservation details...</p>
      </div>
    );
  }

  if (paymentSuccess && reservation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Reservation Confirmed & Secured</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Here is Your Admission Pass</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Please present this digital pass or booking reference number at the theater entrance.
          </p>
        </div>

        <DigitalTicket reservation={reservation} />

        <div className="flex justify-center pt-4">
          <Link
            to="/my-reservations"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 transition-colors"
          >
            <span>View All My Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#0c101a] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Reservation Not Found</h2>
        <p className="text-xs text-slate-400">
          {errorMessage || 'This reservation could not be loaded or has expired.'}
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <CreditCard className="w-4 h-4" />
          <span>Checkout & Secure Payment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Complete Your Booking</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Confirm your payment method to finalize seat reservation #{reservation.bookingCode || reservation.id.slice(0, 8)}.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left 3 cols: Payment form */}
        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handlePay} className="space-y-6">
            <PaymentMethods
              selectedMethod={paymentMethod}
              onChangeMethod={setPaymentMethod}
              phone={phone}
              onChangePhone={setPhone}
              cardNumber={cardNumber}
              onChangeCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              onChangeCardExpiry={setCardExpiry}
              cardCvc={cardCvc}
              onChangeCardCvc={setCardCvc}
            />

            <button
              type="submit"
              id="confirm-pay-btn"
              disabled={processing}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all duration-200 shadow-xl shadow-amber-400/20"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Pay {reservation.totalPrice} ETB & Confirm Seats
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 2 cols: Reservation Ticket Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/[0.08] space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06]">
              Order Breakdown
            </h3>

            <div className="flex space-x-3">
              {reservation.movie?.posterUrl && (
                <img
                  src={reservation.movie.posterUrl}
                  alt={reservation.movie.title}
                  className="w-14 h-20 object-cover rounded-xl border border-white/10 shrink-0"
                />
              )}
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {reservation.movie?.title}
                </h4>
                <p className="text-xs text-amber-400 font-medium">
                  {reservation.showtime?.format || '2D'} • {reservation.showtime?.date}
                </p>
                <p className="text-[11px] text-slate-400">{reservation.cinema?.name}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs border-t border-white/[0.06]">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Hall:</span>
                <span>{reservation.hall?.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Time:</span>
                <span>{reservation.showtime?.startTime}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Reserved Seats:</span>
                <span className="font-bold text-amber-400">
                  {reservation.seatLabels.join(', ')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-200">Total Price:</span>
              <span className="text-base font-black text-amber-400">
                {reservation.totalPrice} ETB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
