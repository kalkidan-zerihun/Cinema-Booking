import { Router, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const RESERVATIONS = "reservations";
const PAYMENTS = "payments";
const SHOWTIMES = "showtimes";
const HALLS = "halls";
const SEATS = "seats";
const RESERVATION_SEATS = "reservationSeats";

const RESERVATION_HOLD_MINUTES = 15;
const MAX_SEATS_PER_RESERVATION = 10;

function getIdParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || "";
}

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "KC-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * POST /api/reservations
 * Creates a new reservation atomically with seat locking and server-calculated pricing.
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { showtimeId, seatIds, customerName, customerEmail } = req.body as {
      showtimeId?: string;
      seatIds?: string[];
      customerName?: string;
      customerEmail?: string;
    };

    if (!showtimeId || typeof showtimeId !== "string") {
      res.status(400).json({ success: false, message: "showtimeId is required." });
      return;
    }
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({ success: false, message: "Please select at least one seat." });
      return;
    }

    const uniqueSeatIds = Array.from(
      new Set(seatIds.filter((s) => typeof s === "string" && s.length > 0))
    );

    if (uniqueSeatIds.length === 0) {
      res.status(400).json({ success: false, message: "Please select at least one seat." });
      return;
    }
    if (uniqueSeatIds.length > MAX_SEATS_PER_RESERVATION) {
      res.status(400).json({
        success: false,
        message: `A single reservation may not exceed ${MAX_SEATS_PER_RESERVATION} seats.`,
      });
      return;
    }

    const userId = req.user!.uid;

    const result = await db.runTransaction(async (tx) => {
      // 1. Verify showtime existence
      const showtimeRef = db.collection(SHOWTIMES).doc(showtimeId);
      const showtimeSnap = await tx.get(showtimeRef);
      if (!showtimeSnap.exists) {
        throw new Error("Showtime not found or has been removed.");
      }
      const showtime = showtimeSnap.data()!;
      const hallId = showtime.hallId;
      if (!hallId) {
        throw new Error("Showtime is missing its hall assignment.");
      }

      // 2. Verify hall existence
      const hallSnap = await tx.get(db.collection(HALLS).doc(hallId));
      if (!hallSnap.exists) {
        throw new Error("The hall for this showtime no longer exists.");
      }

      const ticketPrice = Number(showtime.ticketPrice) || 250;

      // 3. Verify seats and calculate authentic server price
      const seatSnaps = await Promise.all(
        uniqueSeatIds.map((id) => tx.get(db.collection(SEATS).doc(id)))
      );
      const seatLabels: string[] = [];
      let calculatedTotalPrice = 0;

      for (let i = 0; i < uniqueSeatIds.length; i++) {
        const seatSnap = seatSnaps[i];
        if (!seatSnap.exists) {
          throw new Error(`Seat ${uniqueSeatIds[i]} does not exist.`);
        }
        const seat = seatSnap.data()!;
        if (seat.hallId !== hallId) {
          throw new Error("One or more seats do not belong to this hall.");
        }
        seatLabels.push(seat.label || `${seat.row}${seat.number}`);
        const priceModifier = Number(seat.priceModifier) || 1.0;
        calculatedTotalPrice += Math.round(ticketPrice * priceModifier);
      }

      // 4. Double-booking guard check
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
          data.status === "RESERVED" &&
          (!data.expiresAt || new Date(data.expiresAt).getTime() > now);
        if (stillActive) {
          throw new Error(
            `Seat ${seatLabels[i] || uniqueSeatIds[i]} is no longer available. Please choose other seats.`
          );
        }
      }

      // 5. Create reservation and seat locks atomically
      const reservationRef = db.collection(RESERVATIONS).doc();
      const nowIso = new Date(now).toISOString();
      const expiresAt = new Date(now + RESERVATION_HOLD_MINUTES * 60 * 1000).toISOString();
      const bookingCode = generateBookingCode();

      const reservationPayload = {
        userId,
        showtimeId,
        status: "PENDING" as const,
        totalPrice: calculatedTotalPrice,
        seatIds: uniqueSeatIds,
        seatLabels,
        customerName:
          (typeof customerName === "string" && customerName.trim()) || "Cinema Guest",
        customerEmail:
          (typeof customerEmail === "string" && customerEmail.trim()) ||
          req.user?.email ||
          "",
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
          status: "RESERVED",
          createdAt: nowIso,
          expiresAt,
        });
      }

      return { id: reservationRef.id, ...reservationPayload };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Create reservation error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create reservation." });
  }
});

/**
 * GET /api/reservations/user
 * Gets all reservations for the currently authenticated user.
 */
router.get("/user", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const snap = await db
      .collection(RESERVATIONS)
      .where("userId", "==", userId)
      .get();

    const reservations = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    res.json({ success: true, data: reservations });
  } catch (error: any) {
    console.error("Get user reservations error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch user reservations." });
  }
});

/**
 * GET /api/reservations/:id
 * Fetches reservation details with ownership verification.
 */
router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reservationId = getIdParam(req.params.id);
    const docSnap = await db.collection(RESERVATIONS).doc(reservationId).get();

    if (!docSnap.exists) {
      res.status(404).json({ success: false, message: "Reservation not found." });
      return;
    }

    const reservation = docSnap.data()!;
    if (reservation.userId !== req.user!.uid && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Access denied. Private reservation." });
      return;
    }

    res.json({ success: true, data: { id: docSnap.id, ...reservation } });
  } catch (error: any) {
    console.error("Get reservation error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch reservation." });
  }
});

/**
 * POST /api/reservations/:id/cancel
 * Cancels a user reservation and frees reserved seats.
 */
router.post("/:id/cancel", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reservationId = getIdParam(req.params.id);

    await db.runTransaction(async (tx) => {
      const resRef = db.collection(RESERVATIONS).doc(reservationId);
      const resSnap = await tx.get(resRef);

      if (!resSnap.exists) {
        throw new Error("Reservation not found.");
      }

      const resData = resSnap.data()!;

      if (resData.userId !== req.user!.uid && req.user!.role !== "ADMIN") {
        throw new Error("Access denied. You do not own this reservation.");
      }

      if (resData.status === "CANCELLED") {
        throw new Error("This reservation is already cancelled.");
      }

      const nowIso = new Date().toISOString();
      tx.update(resRef, {
        status: "CANCELLED",
        cancelReason: "USER_CANCELLED",
        updatedAt: nowIso,
      });

      const seatIds: string[] = Array.isArray(resData.seatIds) ? resData.seatIds : [];
      for (const seatId of seatIds) {
        const seatRef = db.collection(RESERVATION_SEATS).doc(`${resData.showtimeId}_${seatId}`);
        tx.update(seatRef, {
          status: "CANCELLED",
          updatedAt: nowIso,
        });
      }
    });

    res.json({ success: true, message: "Reservation cancelled successfully." });
  } catch (error: any) {
    console.error("Cancel reservation error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to cancel reservation." });
  }
});

/**
 * POST /api/reservations/:id/confirm-offline
 * Admin-only confirmation for counter pay-at-cinema reservations.
 */
router.post("/:id/confirm-offline", authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reservationId = getIdParam(req.params.id);

    await db.runTransaction(async (tx) => {
      const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
      const paymentRef = db.collection(PAYMENTS).doc(reservationId);
      const [reservationSnap, paymentSnap] = await Promise.all([
        tx.get(reservationRef),
        tx.get(paymentRef),
      ]);

      if (!reservationSnap.exists) {
        throw new Error("Reservation not found.");
      }
      const reservation = reservationSnap.data()!;
      if (reservation.status !== "PENDING") {
        throw new Error(`Reservation is already ${reservation.status}.`);
      }
      if (!paymentSnap.exists || paymentSnap.data()!.method !== "PAY_AT_CINEMA") {
        throw new Error(
          "Only pay-at-cinema reservations can be confirmed manually. Online payments confirm automatically via Chapa."
        );
      }

      const nowIso = new Date().toISOString();
      tx.update(reservationRef, {
        status: "CONFIRMED",
        paymentMethod: "PAY_AT_CINEMA",
        expiresAt: FieldValue.delete(),
        updatedAt: nowIso,
      });
      tx.update(paymentRef, { status: "SUCCESS", updatedAt: nowIso });

      const seatIds: string[] = Array.isArray(reservation.seatIds) ? reservation.seatIds : [];
      for (const seatId of seatIds) {
        const seatRef = db.collection(RESERVATION_SEATS).doc(`${reservation.showtimeId}_${seatId}`);
        tx.update(seatRef, { expiresAt: FieldValue.delete() });
      }
    });

    res.json({ success: true, message: "Offline reservation confirmed successfully." });
  } catch (error: any) {
    console.error("Confirm offline payment error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to confirm offline payment." });
  }
});

/**
 * Scheduled/background expiration for PENDING reservations older than hold time.
 */
export async function expirePendingReservationsTask(): Promise<number> {
  const nowIso = new Date().toISOString();
  const expiredSnap = await db
    .collection(RESERVATIONS)
    .where("status", "==", "PENDING")
    .where("expiresAt", "<=", nowIso)
    .limit(200)
    .get();

  if (expiredSnap.empty) return 0;

  let expiredCount = 0;
  for (const reservationDoc of expiredSnap.docs) {
    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(reservationDoc.ref);
      if (!freshSnap.exists) return;
      const fresh = freshSnap.data()!;
      if (fresh.status !== "PENDING") return;

      tx.update(reservationDoc.ref, {
        status: "CANCELLED",
        cancelReason: "EXPIRED",
        updatedAt: new Date().toISOString(),
      });

      const seatIds: string[] = Array.isArray(fresh.seatIds) ? fresh.seatIds : [];
      for (const seatId of seatIds) {
        const seatRef = db.collection(RESERVATION_SEATS).doc(`${fresh.showtimeId}_${seatId}`);
        tx.update(seatRef, { status: "CANCELLED", updatedAt: new Date().toISOString() });
      }

      const paymentRef = db.collection(PAYMENTS).doc(reservationDoc.id);
      const paymentSnap = await tx.get(paymentRef);
      if (paymentSnap.exists && paymentSnap.data()!.status === "PENDING") {
        tx.update(paymentRef, { status: "FAILED", failReason: "EXPIRED", updatedAt: new Date().toISOString() });
      }
    });
    expiredCount++;
  }
  return expiredCount;
}

export default router;
