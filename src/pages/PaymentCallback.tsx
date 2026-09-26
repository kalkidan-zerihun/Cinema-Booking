import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Film, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { EnrichedReservation } from '../types';
import { getEnrichedReservation } from '../services/reservations';
import { verifyPayment } from '../services/payments';
import { DigitalTicket } from '../components/DigitalTicket';

/**
 * Landing page after a Chapa hosted-checkout redirect.
 *
 * IMPORTANT: arriving here proves nothing by itself — anyone could type
 * this URL directly. This page never marks anything as paid on its own.
 * It asks the backend (verifyPayment Cloud Function) to independently
 * re-check the transaction with Chapa, and only ever displays whatever
 * status the server reports.
 */
export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'failed' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Confirming your payment with the gateway...');
  const [reservation, setReservation] = useState<EnrichedReservation | null>(null);

  useEffect(() => {
    if (!reservationId) {
      setStatus('error');
      setMessage('Missing reservation reference.');
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const result = await verifyPayment(reservationId);
        if (cancelled) return;

        if (result.status === 'SUCCESS') {
          const enriched = await getEnrichedReservation(reservationId);
          if (!cancelled) {
            setReservation(enriched);
            setStatus('success');
          }
        } else if (result.status === 'FAILED') {
          setStatus('failed');
          setMessage('The payment could not be verified as successful.');
        } else {
          setStatus('pending');
          setMessage(result.message || 'Your payment is still being processed. This can take a minute.');
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.message || 'Could not verify payment right now.');
        }
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  if (status === 'success' && reservation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Payment Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Your Movie E-Pass is Ready!</h1>
        </div>
        <DigitalTicket reservation={reservation} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-16 p-8 bg-[#0d1424] border border-[#1b263b] rounded-3xl text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        {status === 'checking' && <Film className="w-7 h-7 animate-spin" />}
        {status === 'pending' && <Clock className="w-7 h-7 text-amber-400" />}
        {(status === 'failed' || status === 'error') && <XCircle className="w-7 h-7 text-red-400" />}
      </div>
      <h2 className="text-2xl font-bold text-white">
        {status === 'checking' && 'Verifying Payment...'}
        {status === 'pending' && 'Payment Pending'}
        {status === 'failed' && 'Payment Not Successful'}
        {status === 'error' && 'Verification Error'}
      </h2>
      <p className="text-xs text-slate-400">{message}</p>
      {reservationId && (
        <Link
          to={`/booking/${reservationId}`}
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950"
        >
          <span>Back to Booking</span>
        </Link>
      )}
    </div>
  );
};
