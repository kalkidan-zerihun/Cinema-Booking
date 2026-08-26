import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Reservation, ReservationSeat, EnrichedReservation } from '../types';
import { getShowtimeById } from './showtimes';
import { getMovieById } from './movies';
import { getCinemaById } from './cinemas';
import { getHallById } from './halls';

const RESERVATIONS_COLLECTION = 'reservations';
const RESERVATION_SEATS_COLLECTION = 'reservationSeats';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to perform this action.');
  }
  return await currentUser.getIdToken();
}

/**
 * ATOMIC, AUTHORITATIVE RESERVATION CREATION VIA EXPRESS BACKEND
 */
export const createReservationAtomic = async (params: {
  showtimeId: string;
  seatIds: string[];
  customerName?: string;
  customerEmail?: string;
}): Promise<Reservation> => {
  if (!params.seatIds || params.seatIds.length === 0) {
    throw new Error('Please select at least one seat to proceed.');
  }

  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || "We couldn't reserve those seats. Please try again."
    );
  }

  return data.data as Reservation;
};

/**
 * Get all reserved seats for a given showtime (real-time helper or one-off)
 */
const isSeatLockActive = (data: any): boolean => {
  if (data.status !== 'RESERVED') return false;
  if (!data.expiresAt) return true;
  return new Date(data.expiresAt).getTime() > Date.now();
};

export const getReservedSeatsForShowtime = async (showtimeId: string): Promise<ReservationSeat[]> => {
  const q = query(
    collection(db, RESERVATION_SEATS_COLLECTION),
    where('showtimeId', '==', showtimeId),
    where('status', '==', 'RESERVED')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ReservationSeat)
    .filter((seat) => isSeatLockActive(seat));
};

/**
 * Real-time subscription to reserved seats for a showtime
 */
export const subscribeToReservedSeats = (
  showtimeId: string,
  callback: (reservedSeatIds: Set<string>) => void
) => {
  const q = query(
    collection(db, RESERVATION_SEATS_COLLECTION),
    where('showtimeId', '==', showtimeId),
    where('status', '==', 'RESERVED')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reservedIds = new Set<string>();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.seatId && isSeatLockActive(data)) {
          reservedIds.add(data.seatId);
        }
      });
      callback(reservedIds);
    },
    (err) => {
      console.error('Error in seat availability listener:', err);
    }
  );
};

export const getReservationById = async (reservationId: string): Promise<Reservation | null> => {
  const docRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Reservation;
  }
  return null;
};

export const getEnrichedReservation = async (
  reservationId: string
): Promise<EnrichedReservation | null> => {
  const reservation = await getReservationById(reservationId);
  if (!reservation) return null;

  const showtime = await getShowtimeById(reservation.showtimeId);
  let movie = undefined;
  let cinema = undefined;
  let hall = undefined;

  if (showtime) {
    [movie, cinema, hall] = await Promise.all([
      getMovieById(showtime.movieId),
      getCinemaById(showtime.cinemaId),
      getHallById(showtime.hallId),
    ]);
  }

  return {
    ...reservation,
    showtime: showtime || undefined,
    movie: movie || undefined,
    cinema: cinema || undefined,
    hall: hall || undefined,
  };
};

export const getUserReservations = async (userId: string): Promise<Reservation[]> => {
  try {
    const q = query(
      collection(db, RESERVATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Reservation[];
  } catch {
    const q = query(collection(db, RESERVATIONS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Reservation[];
  }
};

export const getAllReservations = async (): Promise<Reservation[]> => {
  const snapshot = await getDocs(collection(db, RESERVATIONS_COLLECTION));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Reservation[];
};

/**
 * Cancels an eligible reservation via Express backend API.
 */
export const cancelReservation = async (reservationId: string): Promise<void> => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to cancel reservation.');
  }
};

/**
 * Admin-only: confirms a PENDING reservation that is being paid for at
 * the cinema counter (PAY_AT_CINEMA).
 */
export const confirmOfflinePayment = async (reservationId: string): Promise<void> => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/confirm-offline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to confirm reservation.');
  }
};
