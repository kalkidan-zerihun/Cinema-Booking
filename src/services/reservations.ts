import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  runTransaction,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from './firebase';
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
    throw new Error('Authentication required to make a reservation.');
  }
  return await currentUser.getIdToken();
}

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ATOMIC, SERVER-VERIFIED RESERVATION CREATION WITH FIRESTORE FALLBACK
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

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to make a reservation.');
  }

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return data.data as Reservation;
      }
    }
  } catch (apiErr) {
    console.warn('Backend reservation API call failed, falling back to direct Firestore transaction:', apiErr);
  }

  // Client-side atomic transaction fallback
  const uniqueSeatIds = Array.from(new Set(params.seatIds));
  return await runTransaction(db, async (tx) => {
    const showtimeRef = doc(db, 'showtimes', params.showtimeId);
    const showtimeSnap = await tx.get(showtimeRef);
    if (!showtimeSnap.exists()) {
      throw new Error('Showtime not found or has been removed.');
    }
    const showtime = showtimeSnap.data()!;
    const hallId = showtime.hallId;
    const ticketPrice = Number(showtime.ticketPrice) || 250;

    const seatSnaps = await Promise.all(
      uniqueSeatIds.map((id) => tx.get(doc(db, 'seats', id)))
    );
    const seatLabels: string[] = [];
    let calculatedTotalPrice = 0;

    for (let i = 0; i < uniqueSeatIds.length; i++) {
      const seatSnap = seatSnaps[i];
      if (!seatSnap.exists()) {
        throw new Error(`Seat ${uniqueSeatIds[i]} does not exist.`);
      }
      const seat = seatSnap.data()!;
      seatLabels.push(seat.label || `${seat.row}${seat.number}`);
      const priceModifier = Number(seat.priceModifier) || 1.0;
      calculatedTotalPrice += Math.round(ticketPrice * priceModifier);
    }

    const now = Date.now();
    const resSeatRefs = uniqueSeatIds.map((seatId) =>
      doc(db, RESERVATION_SEATS_COLLECTION, `${params.showtimeId}_${seatId}`)
    );
    const resSeatSnaps = await Promise.all(resSeatRefs.map((ref) => tx.get(ref)));

    for (let i = 0; i < resSeatSnaps.length; i++) {
      const snap = resSeatSnaps[i];
      if (!snap.exists()) continue;
      const data = snap.data()!;
      const stillActive =
        data.status === 'RESERVED' &&
        (!data.expiresAt || new Date(data.expiresAt).getTime() > now);
      if (stillActive) {
        throw new Error(`Seat ${seatLabels[i] || uniqueSeatIds[i]} is no longer available.`);
      }
    }

    const newResRef = doc(collection(db, RESERVATIONS_COLLECTION));
    const nowIso = new Date(now).toISOString();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const bookingCode = generateBookingCode();

    const reservationPayload = {
      userId: currentUser.uid,
      showtimeId: params.showtimeId,
      status: 'PENDING' as const,
      totalPrice: calculatedTotalPrice,
      seatIds: uniqueSeatIds,
      seatLabels,
      customerName: params.customerName || currentUser.displayName || 'Cinema Guest',
      customerEmail: params.customerEmail || currentUser.email || '',
      bookingCode,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt,
    };

    tx.set(newResRef, reservationPayload);

    for (let i = 0; i < uniqueSeatIds.length; i++) {
      tx.set(resSeatRefs[i], {
        reservationId: newResRef.id,
        seatId: uniqueSeatIds[i],
        showtimeId: params.showtimeId,
        status: 'RESERVED',
        createdAt: nowIso,
        expiresAt,
      });
    }

    return { id: newResRef.id, ...reservationPayload };
  });
};

/**
 * Get all reserved seats for a given showtime (real-time helper or one-off)
 */
// A seat lock still blocks a seat if it is CONFIRMED (no expiresAt), or
// PENDING and its hold hasn't expired yet. This mirrors the check inside
// createReservationSecure so the UI doesn't show a seat as taken once its
// hold has lapsed, even in the couple of minutes before the scheduled
// expirePendingReservations function formally cancels it server-side.
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
 * Cancels an eligible reservation and atomically frees up the seats for that showtime.
 */
export const cancelReservation = async (reservationId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  await runTransaction(db, async (transaction) => {
    const resRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
    const resSnap = await transaction.get(resRef);

    if (!resSnap.exists()) {
      throw new Error('Reservation does not exist.');
    }

    const resData = resSnap.data() as Reservation;

    if (resData.status === 'CANCELLED') {
      throw new Error('This reservation has already been cancelled.');
    }

    // Update reservation status
    transaction.update(resRef, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    });

    // Update or clear each reservationSeat record so seats become available again
    if (resData.seatIds && resData.seatIds.length > 0) {
      for (const seatId of resData.seatIds) {
        const resSeatDocId = `${resData.showtimeId}_${seatId}`;
        const resSeatRef = doc(db, RESERVATION_SEATS_COLLECTION, resSeatDocId);
        transaction.update(resSeatRef, {
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });
};

/**
 * Admin-only: confirms a PENDING reservation that is being paid for at
 * the cinema counter (PAY_AT_CINEMA). Runs server-side via the
 * confirmOfflinePayment Cloud Function, which independently checks the
 * caller is an admin and that the linked payment record actually shows
 * PAY_AT_CINEMA — Firestore rules deny this transition as a direct
 * client write, for both customers and admins, so there is no way to
 * fake-confirm an online (Chapa/Telebirr/Card) payment from the browser.
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

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to confirm reservation.');
  }
};
