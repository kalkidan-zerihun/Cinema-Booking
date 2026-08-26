import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Payment, PaymentMethod } from '../types';

const PAYMENTS_COLLECTION = 'payments';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }
  return await currentUser.getIdToken();
}

/**
 * Starts payment for a reservation by calling the Express backend.
 * Server reads authentic stored price and handles Chapa initialization or cash counter pending payment.
 */
export const initializePayment = async (params: {
  reservationId: string;
  method: PaymentMethod;
}): Promise<{ success: boolean; alreadyConfirmed?: boolean; checkoutUrl?: string; message?: string }> => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to initialize payment.');
  }
  return data;
};

/**
 * Asks the backend to verify a Chapa transaction with Chapa directly.
 */
export const verifyPayment = async (
  reservationId: string
): Promise<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; message?: string }> => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reservationId }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to verify payment.');
  }
  return data;
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
