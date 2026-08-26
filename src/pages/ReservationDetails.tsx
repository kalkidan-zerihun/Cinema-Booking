import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Ticket, Film, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EnrichedReservation } from '../types';
import { getEnrichedReservation, cancelReservation } from '../services/reservations';
import { DigitalTicket } from '../components/DigitalTicket';

export const ReservationDetails: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<EnrichedReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!reservationId) return;
    try {
      const data = await getEnrichedReservation(reservationId);
      if (!data) {
        setErrorMessage('Digital ticket not found.');
      } else {
        setReservation(data);
      }
    } catch (err: any) {
      console.error('Error fetching ticket:', err);
      setErrorMessage(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [reservationId]);

  const handleCancel = async () => {
    if (!reservationId) return;
    if (!window.confirm('Are you sure you want to cancel this ticket? The seats will be released immediately.')) {
      return;
    }

    try {
      await cancelReservation(reservationId);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Loading your digital admission pass...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141522] border border-[#222432] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-gray-400">
          {errorMessage || 'The requested admission pass does not exist.'}
        </p>
        <Link
          to="/my-reservations"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Back Link */}
      <div className="flex items-center justify-between pb-4 border-b border-[#202232]">
        <Link
          to="/my-reservations"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Bookings</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
          Pass Verification
        </span>
      </div>

      {/* Main Digital Ticket */}
      <DigitalTicket
        reservation={reservation}
        onCancel={reservation.status === 'CONFIRMED' ? handleCancel : undefined}
      />
    </div>
  );
};
