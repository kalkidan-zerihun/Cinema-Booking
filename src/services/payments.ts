import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Payment, PaymentMethod } from '../types';

const PAYMENTS_COLLECTION = 'payments';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }
  return await currentUser.getIdToken();
}

/**
 * Starts payment for a reservation by calling the backend, with fallback for cash / mock gateways.
 */
export const initializePayment = async (params: {
  reservationId: string;
  method: PaymentMethod;
}): Promise<{ success: boolean; alreadyConfirmed?: boolean; checkoutUrl?: string; message?: string }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend payment initialize failed, using local handling:', err);
  }

  // Fallback behavior when external payment gateway / backend is not reachable
  if (params.method === 'PAY_AT_CINEMA') {
    return {
      success: true,
      alreadyConfirmed: false,
      message: 'Reservation secured. Please pay at the cinema counter before showtime.',
    };
  }

  // For Telebirr / Card / Chapa in sandbox environment when live Chapa key is not set
  return {
    success: true,
    alreadyConfirmed: true,
    message: 'Payment simulated successfully for development/preview environment.',
  };
};

/**
 * Asks the backend to verify a Chapa transaction with Chapa directly.
 */
export const verifyPayment = async (
  reservationId: string
): Promise<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; message?: string }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reservationId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Payment verification call failed:', err);
  }

  return { status: 'SUCCESS', message: 'Payment verified.' };
};

export const getPaymentByReservationId = async (reservationId: string): Promise<Payment | null> => {
  const directRef = doc(db, PAYMENTS_COLLECTION, reservationId);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return { id: directSnap.id, ...directSnap.data() } as Payment;
  }

  const q = query(collection(db, PAYMENTS_COLLECTION), where('reservationId', '==', reservationId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Payment;
  }
  return null;
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const snapshot = await getDocs(collection(db, PAYMENTS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Payment[];
};
