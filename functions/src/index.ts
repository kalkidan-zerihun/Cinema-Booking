import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import { initializeChapaPayment, verifyChapaPayment } from './chapaProvider.js';

initializeApp();
const db = getFirestore();

// CHAPA_SECRET_KEY is a Cloud Functions secret — never present in any
// client bundle. Configure with:
//   firebase functions:secrets:set CHAPA_SECRET_KEY
const CHAPA_SECRET_KEY = defineSecret('CHAPA_SECRET_KEY');

// Public app URL, used to build the redirect the customer sees after
// paying on Chapa's hosted checkout page. Safe to be public.
const APP_URL = defineString('APP_URL', { default: 'http://localhost:3000' });

type PaymentMethod = 'CHAPA' | 'TELEBIRR' | 'CARD' | 'PAY_AT_CINEMA';

const RESERVATIONS = 'reservations';
const PAYMENTS = 'payments';
const SHOWTIMES = 'showtimes';
const HALLS = 'halls';
const SEATS = 'seats';
const RESERVATION_SEATS = 'reservationSeats';

// How long an unpaid PENDING reservation is allowed to hold its seats
// before it is automatically released by expirePendingReservations.
const RESERVATION_HOLD_MINUTES = 15;
const MAX_SEATS_PER_RESERVATION = 10;

async function isRequestingUserAdmin(uid: string): Promise<boolean> {
  const userSnap = await db.collection('users').doc(uid).get();
  return userSnap.exists && userSnap.data()!.role === 'ADMIN';
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
 * createReservationSecure
 * ------------------------
 * Callable Cloud Function — the ONLY supported way to create a
 * reservation. Everything authoritative (showtime/hall/seat validity,
 * price, the double-booking check, and the PENDING hold expiry) is
 * computed here from trusted server reads inside a single Firestore
 * transaction. The client only supplies showtimeId + seatIds; it can no
 * longer write totalPrice, seatLabels, or fabricate a reservation for
 * seats that don't belong to the hall. Firestore rules deny client-side
 * `create` on reservations/reservationSeats entirely, so this function
 * (running with the Admin SDK) is the only path to those collections.
 */
export const createReservationSecure = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to reserve seats.');
  }

  const { showtimeId, seatIds, customerName, customerEmail } = request.data as {
    showtimeId?: string;
    seatIds?: string[];
    customerName?: string;
    customerEmail?: string;
  };

  if (!showtimeId || typeof showtimeId !== 'string') {
    throw new HttpsError('invalid-argument', 'showtimeId is required.');
  }
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Please select at least one seat.');
  }
  const uniqueSeatIds = Array.from(new Set(seatIds.filter((s) => typeof s === 'string' && s.length > 0)));
  if (uniqueSeatIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Please select at least one seat.');
  }
  if (uniqueSeatIds.length > MAX_SEATS_PER_RESERVATION) {
    throw new HttpsError('invalid-argument', `A single reservation may not exceed ${MAX_SEATS_PER_RESERVATION} seats.`);
  }

  return db.runTransaction(async (tx) => {
    // 1. Verify the showtime exists and get the authentic ticket price.
    const showtimeRef = db.collection(SHOWTIMES).doc(showtimeId);
    const showtimeSnap = await tx.get(showtimeRef);
    if (!showtimeSnap.exists) {
      throw new HttpsError('not-found', 'Showtime not found or has been removed.');
    }
    const showtime = showtimeSnap.data()!;
    const hallId = showtime.hallId;
    if (!hallId) {
      throw new HttpsError('internal', 'Showtime is missing its hall assignment.');
    }

    // 2. Verify the hall exists.
    const hallSnap = await tx.get(db.collection(HALLS).doc(hallId));
    if (!hallSnap.exists) {
      throw new HttpsError('failed-precondition', 'The hall for this showtime no longer exists.');
    }

    const ticketPrice = Number(showtime.ticketPrice) || 250;

    // 3. Verify every seat exists AND belongs to this showtime's hall —
    // this is what stops a forged seatId from another hall/cinema.
    const seatSnaps = await Promise.all(uniqueSeatIds.map((id) => tx.get(db.collection(SEATS).doc(id))));
    const seatLabels: string[] = [];
    let calculatedTotalPrice = 0;

    for (let i = 0; i < uniqueSeatIds.length; i++) {
      const seatSnap = seatSnaps[i];
      if (!seatSnap.exists) {
        throw new HttpsError('invalid-argument', `Seat ${uniqueSeatIds[i]} does not exist.`);
      }
      const seat = seatSnap.data()!;
      if (seat.hallId !== hallId) {
        throw new HttpsError('failed-precondition', 'One or more seats do not belong to this hall.');
      }
      seatLabels.push(seat.label || `${seat.row}${seat.number}`);
      const priceModifier = Number(seat.priceModifier) || 1.0;
      calculatedTotalPrice += Math.round(ticketPrice * priceModifier);
    }

    // 4. Check for existing, still-active seat locks (double-booking guard).
    // A lock still blocks if it is CONFIRMED, or PENDING and not yet expired.
    const now = Date.now();
    const resSeatRefs = uniqueSeatIds.map((seatId) =>
      db.collection(RESERVATION_SEATS).doc(`${showtimeId}_${seatId}`)
    );
    const resSeatSnaps = await Promise.all(resSeatRefs.map((ref) => tx.get(ref)));

    for (let i = 0; i < resSeatSnaps.length; i++) {
      const snap = resSeatSnaps[i];
      if (!snap.exists) continue;
      const data = snap.data()!;
      const stillActive =
        data.status === 'RESERVED' && (!data.expiresAt || new Date(data.expiresAt).getTime() > now);
      if (stillActive) {
        throw new HttpsError(
          'already-exists',
          `Seat ${seatLabels[i] || uniqueSeatIds[i]} is no longer available. Please choose other seats.`
        );
      }
    }

    // 5. Create the reservation + seat locks atomically.
    const reservationRef = db.collection(RESERVATIONS).doc();
    const nowIso = new Date(now).toISOString();
    const expiresAt = new Date(now + RESERVATION_HOLD_MINUTES * 60 * 1000).toISOString();
    const bookingCode = generateBookingCode();

    const reservationPayload = {
      userId: request.auth.uid,
      showtimeId,
      status: 'PENDING' as const,
      totalPrice: calculatedTotalPrice,
      seatIds: uniqueSeatIds,
      seatLabels,
      customerName: (typeof customerName === 'string' && customerName.trim()) || 'Cinema Guest',
      customerEmail: (typeof customerEmail === 'string' && customerEmail.trim()) || '',
      bookingCode,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt,
    };

    tx.set(reservationRef, reservationPayload);

    for (let i = 0; i < uniqueSeatIds.length; i++) {
      tx.set(resSeatRefs[i], {
        reservationId: reservationRef.id,
        seatId: uniqueSeatIds[i],
        showtimeId,
        status: 'RESERVED',
        createdAt: nowIso,
        expiresAt,
      });
    }

    return { id: reservationRef.id, ...reservationPayload };
  });
});

/**
 * confirmOfflinePayment
 * ---------------------
 * Callable — the ONLY way staff can mark a PENDING reservation
 * CONFIRMED. Admin-only, and only when the reservation's linked payment
 * record explicitly shows PAY_AT_CINEMA — this is what stops an admin
 * from faking confirmation of an online payment that was never actually
 * verified by Chapa. Also clears the seat locks' expiresAt so a
 * genuinely booked seat never lapses back to "available" once the
 * original PENDING hold window would otherwise have passed.
 */
export const confirmOfflinePayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  if (!(await isRequestingUserAdmin(request.auth.uid))) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const { reservationId } = request.data as { reservationId?: string };
  if (!reservationId || typeof reservationId !== 'string') {
    throw new HttpsError('invalid-argument', 'reservationId is required.');
  }

  return db.runTransaction(async (tx) => {
    const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
    const paymentRef = db.collection(PAYMENTS).doc(reservationId);
    const [reservationSnap, paymentSnap] = await Promise.all([tx.get(reservationRef), tx.get(paymentRef)]);

    if (!reservationSnap.exists) {
      throw new HttpsError('not-found', 'Reservation not found.');
    }
    const reservation = reservationSnap.data()!;
    if (reservation.status !== 'PENDING') {
      throw new HttpsError('failed-precondition', `Reservation is already ${reservation.status}.`);
    }
    if (!paymentSnap.exists || paymentSnap.data()!.method !== 'PAY_AT_CINEMA') {
      throw new HttpsError(
        'failed-precondition',
        'Only pay-at-cinema reservations can be confirmed manually. Online payments confirm automatically via Chapa.'
      );
    }

    const nowIso = new Date().toISOString();
    tx.update(reservationRef, {
      status: 'CONFIRMED',
      paymentMethod: 'PAY_AT_CINEMA',
      expiresAt: FieldValue.delete(),
      updatedAt: nowIso,
    });
    tx.update(paymentRef, { status: 'SUCCESS', updatedAt: nowIso });

    const seatIds: string[] = Array.isArray(reservation.seatIds) ? reservation.seatIds : [];
    for (const seatId of seatIds) {
      const seatRef = db.collection(RESERVATION_SEATS).doc(`${reservation.showtimeId}_${seatId}`);
      tx.update(seatRef, { expiresAt: FieldValue.delete() });
    }

    return { success: true };
  });
});

/**
 * expirePendingReservations
 * --------------------------
 * Scheduled function — the authoritative, server-side mechanism for
 * releasing seats held by unpaid PENDING reservations. Runs every 2
 * minutes; never relies on a client-side timer. Cancelled reservations
 * are kept (status CANCELLED, cancelReason EXPIRED) rather than deleted.
 */
export const expirePendingReservations = onSchedule('every 2 minutes', async () => {
  const nowIso = new Date().toISOString();
  const expiredSnap = await db
    .collection(RESERVATIONS)
    .where('status', '==', 'PENDING')
    .where('expiresAt', '<=', nowIso)
    .limit(200)
    .get();

  if (expiredSnap.empty) return;

  let expiredCount = 0;
  for (const reservationDoc of expiredSnap.docs) {
    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(reservationDoc.ref);
      if (!freshSnap.exists) return;
      const fresh = freshSnap.data()!;
      if (fresh.status !== 'PENDING') return; // already paid/cancelled concurrently

      tx.update(reservationDoc.ref, {
        status: 'CANCELLED',
        cancelReason: 'EXPIRED',
        updatedAt: new Date().toISOString(),
      });

      const seatIds: string[] = Array.isArray(fresh.seatIds) ? fresh.seatIds : [];
      for (const seatId of seatIds) {
        const seatRef = db.collection(RESERVATION_SEATS).doc(`${fresh.showtimeId}_${seatId}`);
        tx.update(seatRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
      }

      const paymentRef = db.collection(PAYMENTS).doc(reservationDoc.id);
      const paymentSnap = await tx.get(paymentRef);
      if (paymentSnap.exists && paymentSnap.data()!.status === 'PENDING') {
        tx.update(paymentRef, { status: 'FAILED', failReason: 'EXPIRED', updatedAt: new Date().toISOString() });
      }
    });
    expiredCount++;
  }

  logger.info(`expirePendingReservations: released ${expiredCount} expired reservation(s).`);
});

/**
 * initializePayment
 * ------------------
 * Callable function — the ONLY supported way for the client to start a
 * payment. The client sends nothing more than a reservationId and a
 * chosen method; the amount is always read from the reservation that
 * was already priced server-side (or by the trusted client transaction
 * in createReservationAtomic), never trusted from the request body.
 */
export const initializePayment = onCall(
  { secrets: [CHAPA_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to pay.');
    }

    const { reservationId, method } = request.data as {
      reservationId?: string;
      method?: PaymentMethod;
    };

    if (!reservationId || typeof reservationId !== 'string') {
      throw new HttpsError('invalid-argument', 'reservationId is required.');
    }
    const validMethods: PaymentMethod[] = ['CHAPA', 'TELEBIRR', 'CARD', 'PAY_AT_CINEMA'];
    if (!method || !validMethods.includes(method)) {
      throw new HttpsError('invalid-argument', 'A valid payment method is required.');
    }

    const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
    const reservationSnap = await reservationRef.get();
    if (!reservationSnap.exists) {
      throw new HttpsError('not-found', 'Reservation not found.');
    }
    const reservation = reservationSnap.data()!;

    if (reservation.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'This reservation does not belong to you.');
    }
    if (reservation.status === 'CANCELLED') {
      throw new HttpsError('failed-precondition', 'This reservation has been cancelled.');
    }

    const paymentRef = db.collection(PAYMENTS).doc(reservationId);
    const existingPaymentSnap = await paymentRef.get();
    if (existingPaymentSnap.exists) {
      const existing = existingPaymentSnap.data()!;
      if (existing.status === 'SUCCESS') {
        // Idempotent — already paid, do not create a duplicate.
        return { success: true, alreadyConfirmed: true, message: 'This reservation is already paid.' };
      }
    }

    // Server-side truth: the amount is whatever createReservationAtomic
    // already calculated and stored — never a client-supplied number.
    const amount = Number(reservation.totalPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError('internal', 'Reservation has an invalid stored price.');
    }

    if (method === 'PAY_AT_CINEMA') {
      const transactionId = `PAYCTR-${reservationId}`;
      await paymentRef.set({
        reservationId,
        userId: request.auth.uid,
        amount,
        currency: 'ETB',
        method,
        status: 'PENDING',
        transactionId,
        createdAt: existingPaymentSnap.exists
          ? existingPaymentSnap.data()!.createdAt
          : Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      // Reservation stays PENDING — a real payment has not happened yet.
      // Staff confirms at the counter via the admin reservations screen.
      return {
        success: true,
        alreadyConfirmed: false,
        message: 'Reservation secured. Please pay at the cinema counter before showtime.',
      };
    }

    // CHAPA / TELEBIRR / CARD all route through the Chapa gateway.
    const txRef = `KC-${reservationId}-${Date.now()}`;
    const [firstName, ...rest] = String(reservation.customerName || 'Cinema Guest').split(' ');

    let checkoutUrl: string;
    try {
      const result = await initializeChapaPayment(CHAPA_SECRET_KEY.value(), {
        amount,
        currency: 'ETB',
        email: reservation.customerEmail || 'guest@kalicinema.com',
        firstName: firstName || 'Cinema',
        lastName: rest.join(' ') || 'Guest',
        txRef,
        callbackUrl: `${functionBaseUrl(request)}/chapaWebhook`,
        returnUrl: `${APP_URL.value()}/payment/callback?reservationId=${reservationId}`,
      });
      checkoutUrl = result.checkoutUrl;
    } catch (err: any) {
      logger.error('Chapa initialization failed', err);
      throw new HttpsError('failed-precondition', err.message || 'Payment gateway is not available.');
    }

    await paymentRef.set({
      reservationId,
      userId: request.auth.uid,
      amount,
      currency: 'ETB',
      method,
      status: 'PENDING',
      transactionId: txRef,
      createdAt: existingPaymentSnap.exists
        ? existingPaymentSnap.data()!.createdAt
        : Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
    });

    return { success: true, alreadyConfirmed: false, checkoutUrl };
  }
);

/**
 * Shared finalization logic used by both the webhook and the manual
 * verify callable. Idempotent: safe to call multiple times for the same
 * transaction reference.
 */
async function finalizeChapaTransaction(txRef: string, secretKey: string | undefined) {
  const paymentQuery = await db.collection(PAYMENTS).where('transactionId', '==', txRef).limit(1).get();
  if (paymentQuery.empty) {
    logger.warn(`No payment found for tx_ref ${txRef}`);
    return { handled: false as const };
  }
  const paymentDoc = paymentQuery.docs[0];
  const payment = paymentDoc.data();

  if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
    // Already finalized — duplicate webhook delivery, do nothing.
    return { handled: true as const, status: payment.status as string };
  }

  const verification = await verifyChapaPayment(secretKey, txRef);

  const amountMatches = Math.abs(verification.amount - Number(payment.amount)) < 0.01;
  const currencyMatches = verification.currency === payment.currency;

  const isVerifiedSuccess = verification.status === 'success' && amountMatches && currencyMatches;

  await db.runTransaction(async (tx) => {
    const freshPaymentSnap = await tx.get(paymentDoc.ref);
    const freshPayment = freshPaymentSnap.data()!;
    if (freshPayment.status === 'SUCCESS' || freshPayment.status === 'FAILED') {
      return; // Another concurrent call already finalized it.
    }

    if (isVerifiedSuccess) {
      tx.update(paymentDoc.ref, {
        status: 'SUCCESS',
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      const reservationRef = db.collection(RESERVATIONS).doc(payment.reservationId);
      const reservationSnap = await tx.get(reservationRef);
      if (reservationSnap.exists && reservationSnap.data()!.status === 'PENDING') {
        const reservation = reservationSnap.data()!;
        tx.update(reservationRef, {
          status: 'CONFIRMED',
          paymentMethod: payment.method,
          transactionId: txRef,
          expiresAt: FieldValue.delete(),
          updatedAt: Timestamp.now().toDate().toISOString(),
        });
        // A CONFIRMED reservation's seat locks must stay active
        // permanently — clear the PENDING hold's expiresAt so the seat
        // never appears available again while genuinely booked.
        const seatIds: string[] = Array.isArray(reservation.seatIds) ? reservation.seatIds : [];
        for (const seatId of seatIds) {
          const seatRef = db.collection(RESERVATION_SEATS).doc(`${reservation.showtimeId}_${seatId}`);
          tx.update(seatRef, { expiresAt: FieldValue.delete() });
        }
      }
    } else {
      tx.update(paymentDoc.ref, {
        status: 'FAILED',
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
    }
  });

  return { handled: true as const, status: isVerifiedSuccess ? 'SUCCESS' : 'FAILED' };
}

/**
 * chapaWebhook
 * ------------
 * Server-to-server callback from Chapa. Always independently re-verifies
 * the transaction with Chapa's API (never trusts the webhook body alone),
 * checks amount + currency against what we stored, and is idempotent
 * against duplicate deliveries.
 */
export const chapaWebhook = onRequest({ secrets: [CHAPA_SECRET_KEY] }, async (req, res) => {
  try {
    const txRef = req.body?.tx_ref || req.query?.tx_ref;
    if (!txRef || typeof txRef !== 'string') {
      res.status(400).send('Missing tx_ref');
      return;
    }

    const result = await finalizeChapaTransaction(txRef, CHAPA_SECRET_KEY.value());
    if (!result.handled) {
      res.status(404).send('Unknown transaction');
      return;
    }
    res.status(200).send('OK');
  } catch (err: any) {
    logger.error('chapaWebhook error', err);
    // 500 so Chapa retries delivery.
    res.status(500).send('Internal error');
  }
});

/**
 * verifyPayment
 * -------------
 * Callable the client can invoke when the customer returns from Chapa's
 * checkout page, in case the webhook hasn't arrived yet. It performs the
 * exact same server-side verification as the webhook — the frontend
 * never marks anything CONFIRMED itself, it only asks the backend to
 * check and reports whatever the backend decides.
 */
export const verifyPayment = onCall({ secrets: [CHAPA_SECRET_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const { reservationId } = request.data as { reservationId?: string };
  if (!reservationId) {
    throw new HttpsError('invalid-argument', 'reservationId is required.');
  }

  const paymentSnap = await db.collection(PAYMENTS).doc(reservationId).get();
  if (!paymentSnap.exists) {
    throw new HttpsError('not-found', 'No payment found for this reservation.');
  }
  const payment = paymentSnap.data()!;
  if (payment.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'This payment does not belong to you.');
  }
  if (payment.method === 'PAY_AT_CINEMA') {
    return { status: 'PENDING', message: 'Please pay at the cinema counter.' };
  }
  if (payment.status !== 'PENDING') {
    return { status: payment.status };
  }

  const result = await finalizeChapaTransaction(payment.transactionId, CHAPA_SECRET_KEY.value());
  return { status: result.handled ? result.status : 'PENDING' };
});

function functionBaseUrl(request: { rawRequest?: { headers?: Record<string, unknown> } }): string {
  // Cloud Functions v2 (Cloud Run) URLs are stable per-project/region; the
  // safest portable approach is to derive it from APP_URL's configured
  // functions region host at deploy time. Operators should set this via
  // the FUNCTIONS_BASE_URL environment config if their region/project
  // differs from the default inference below.
  return process.env.FUNCTIONS_BASE_URL || APP_URL.value().replace(/\/$/, '') + '/api';
}
