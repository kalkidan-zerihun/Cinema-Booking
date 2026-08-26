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
  Sparkles,
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
      // initializePayment is a Cloud Function call. It never trusts an
      // amount from this form — the server reads the reservation's own
      // stored price. It also never returns "SUCCESS" itself; real
      // gateway methods (CHAPA/TELEBIRR/CARD) redirect to Chapa's hosted
      // checkout, and only the server-side webhook/verification can
      // confirm the reservation afterward.
      const result = await initializePayment({ reservationId, method: paymentMethod });

      if (result.alreadyConfirmed) {
        const updated = await getEnrichedReservation(reservationId);
        if (updated) setReservation(updated);
        setPaymentSuccess(true);
        celebrate();
        return;
      }

      if (paymentMethod === 'PAY_AT_CINEMA') {
        // No money has moved yet — the reservation is secured (seats are
        // locked) but stays PENDING until staff confirm payment at the
        // counter. The ticket UI below already renders a "PAYMENT
        // PENDING" state for this, so we never claim CONFIRMED here.
        const updated = await getEnrichedReservation(reservationId);
        if (updated) setReservation(updated);
        setPaymentSuccess(true);
        celebrate();
        return;
      }

      if (result.checkoutUrl) {
        // Hand off to Chapa's hosted checkout. The customer completes
        // payment there; Chapa's webhook (and our own re-verification on
        // return) is what confirms the reservation — never this redirect.
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Loading your reservation details...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141522] border border-[#222432] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Reservation Not Found</h2>
        <p className="text-xs text-gray-400">
          {errorMessage || 'The requested booking ID does not exist.'}
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] text-white"
        >
          <span>Return to Movies</span>
        </Link>
      </div>
    );
  }

  // If already confirmed or just paid successfully -> show Digital Ticket!
  if (paymentSuccess || reservation.status === 'CONFIRMED') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Reservation Confirmed & Secured</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Your Movie E-Pass is Ready!</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
            Present your QR pass at the entrance. A digital copy has also been registered under your bookings.
          </p>
        </div>

        <DigitalTicket reservation={reservation} />

        <div className="text-center pt-4">
          <Link
            to="/my-reservations"
            className="inline-flex items-center space-x-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <span>View All My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#202232]">
        <span className="text-xs font-bold uppercase tracking-wider text-red-500">
          SECURE CHECKOUT & PAYMENT
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Complete Your Reservation
        </h1>
        <p className="text-xs text-gray-400">
          Booking Reference #{reservation.bookingCode || reservation.id.slice(0, 8)}
        </p>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Payment Method Form (Left 2 cols) & Order Review (Right 1 col) */}
      <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Cols: Payment Methods & Inputs */}
        <div className="lg:col-span-2 bg-[#12131d] border border-[#232535] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
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
            id="pay-now-btn"
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-all duration-200 shadow-xl shadow-red-950/70 disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Processing Payment...</span>
              </span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>
                  Confirm & Pay {reservation.totalPrice} ETB
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right 1 Col: Summary Review */}
        <div className="bg-[#12131d] border border-[#232535] rounded-3xl p-6 space-y-6 shadow-xl lg:sticky lg:top-28">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#1f212f]">
            <Ticket className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Order Summary</h3>
          </div>

          <div className="flex space-x-4">
            {reservation.movie?.posterUrl && (
              <img
                src={reservation.movie.posterUrl}
                alt={reservation.movie.title}
                className="w-16 h-24 object-cover rounded-lg border border-[#2a2c3d] shrink-0"
              />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white leading-tight">
                {reservation.movie?.title}
              </h4>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1d1f2d] text-red-400">
                {reservation.showtime?.format || '2D'}
              </span>
              <p className="text-xs text-gray-400">{reservation.movie?.duration} mins</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs border-t border-[#1a1c28]">
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Cinema:</span>
              <span className="font-semibold text-white">{reservation.cinema?.name}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Hall:</span>
              <span className="font-semibold text-white">{reservation.hall?.name}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Date:</span>
              <span className="font-semibold text-white">{reservation.showtime?.date}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Showtime:</span>
              <span className="font-semibold text-white">{reservation.showtime?.startTime}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300 pt-2 border-t border-[#1a1c28]">
              <span className="text-gray-400">Selected Seats:</span>
              <span className="font-bold text-red-400">{reservation.seatLabels.join(', ')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f212f] flex items-baseline justify-between">
            <span className="text-sm font-bold text-gray-300">Amount Due:</span>
            <span className="text-2xl font-black text-emerald-400">
              {reservation.totalPrice} <span className="text-xs text-gray-300">ETB</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};
