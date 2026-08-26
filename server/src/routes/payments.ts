import { Router, Request, Response } from "express";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.ts";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.ts";
import { initializeChapaPayment, verifyChapaPayment } from "../services/chapa.ts";

const router = Router();

const RESERVATIONS = "reservations";
const PAYMENTS = "payments";
const RESERVATION_SEATS = "reservationSeats";

export type PaymentMethod = "CHAPA" | "TELEBIRR" | "CARD" | "PAY_AT_CINEMA";

/**
 * Shared transaction finalization logic for Chapa payments.
 */
async function finalizeChapaTransaction(txRef: string, secretKey: string | undefined) {
  const paymentQuery = await db
    .collection(PAYMENTS)
    .where("transactionId", "==", txRef)
    .limit(1)
    .get();

  if (paymentQuery.empty) {
    return { handled: false as const };
  }

  const paymentDoc = paymentQuery.docs[0];
  const payment = paymentDoc.data();

  if (payment.status === "SUCCESS" || payment.status === "FAILED") {
    return { handled: true as const, status: payment.status as string };
  }

  const verification = await verifyChapaPayment(secretKey, txRef);

  const amountMatches = Math.abs(verification.amount - Number(payment.amount)) < 0.01;
  const currencyMatches = verification.currency === payment.currency;
  const isVerifiedSuccess = verification.status === "success" && amountMatches && currencyMatches;

  await db.runTransaction(async (tx) => {
    const freshPaymentSnap = await tx.get(paymentDoc.ref);
    const freshPayment = freshPaymentSnap.data()!;
    if (freshPayment.status === "SUCCESS" || freshPayment.status === "FAILED") {
      return;
    }

    const nowIso = new Date().toISOString();

    if (isVerifiedSuccess) {
      tx.update(paymentDoc.ref, {
        status: "SUCCESS",
        updatedAt: nowIso,
      });

      const reservationRef = db.collection(RESERVATIONS).doc(payment.reservationId);
      const reservationSnap = await tx.get(reservationRef);
      if (reservationSnap.exists && reservationSnap.data()!.status === "PENDING") {
        const reservation = reservationSnap.data()!;
        tx.update(reservationRef, {
          status: "CONFIRMED",
          paymentMethod: payment.method,
          transactionId: txRef,
          expiresAt: FieldValue.delete(),
          updatedAt: nowIso,
        });

        const seatIds: string[] = Array.isArray(reservation.seatIds) ? reservation.seatIds : [];
        for (const seatId of seatIds) {
          const seatRef = db
            .collection(RESERVATION_SEATS)
            .doc(`${reservation.showtimeId}_${seatId}`);
          tx.update(seatRef, { expiresAt: FieldValue.delete() });
        }
      }
    } else {
      tx.update(paymentDoc.ref, {
        status: "FAILED",
        updatedAt: nowIso,
      });
    }
  });

  return { handled: true as const, status: isVerifiedSuccess ? "SUCCESS" : "FAILED" };
}

/**
 * POST /api/payments/initialize
 * Initializes payment for a reservation.
 */
router.post("/initialize", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservationId, method } = req.body as {
      reservationId?: string;
      method?: PaymentMethod;
    };

    if (!reservationId || typeof reservationId !== "string") {
      res.status(400).json({ success: false, message: "reservationId is required." });
      return;
    }

    const validMethods: PaymentMethod[] = ["CHAPA", "TELEBIRR", "CARD", "PAY_AT_CINEMA"];
    if (!method || !validMethods.includes(method)) {
      res.status(400).json({ success: false, message: "A valid payment method is required." });
      return;
    }

    const reservationRef = db.collection(RESERVATIONS).doc(reservationId);
    const reservationSnap = await reservationRef.get();
    if (!reservationSnap.exists) {
      res.status(404).json({ success: false, message: "Reservation not found." });
      return;
    }

    const reservation = reservationSnap.data()!;

    if (reservation.userId !== req.user!.uid && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "This reservation does not belong to you." });
      return;
    }
    if (reservation.status === "CANCELLED") {
      res.status(400).json({ success: false, message: "This reservation has been cancelled." });
      return;
    }

    const paymentRef = db.collection(PAYMENTS).doc(reservationId);
    const existingPaymentSnap = await paymentRef.get();

    if (existingPaymentSnap.exists) {
      const existing = existingPaymentSnap.data()!;
      if (existing.status === "SUCCESS") {
        res.json({
          success: true,
          alreadyConfirmed: true,
          message: "This reservation is already paid.",
        });
        return;
      }
    }

    const amount = Number(reservation.totalPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(500).json({ success: false, message: "Reservation has an invalid stored price." });
      return;
    }

    const nowIso = new Date().toISOString();

    if (method === "PAY_AT_CINEMA") {
      const transactionId = `PAYCTR-${reservationId}`;
      await paymentRef.set({
        reservationId,
        userId: req.user!.uid,
        amount,
        currency: "ETB",
        method,
        status: "PENDING",
        transactionId,
        createdAt: existingPaymentSnap.exists
          ? existingPaymentSnap.data()!.createdAt
          : nowIso,
        updatedAt: nowIso,
      });

      res.json({
        success: true,
        alreadyConfirmed: false,
        message: "Reservation secured. Please pay at the cinema counter before showtime.",
      });
      return;
    }

    const txRef = `KC-${reservationId}-${Date.now()}`;
    const [firstName, ...rest] = String(reservation.customerName || "Cinema Guest").split(" ");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const serverUrl = `http://localhost:${process.env.PORT || 3001}`;

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    let checkoutUrl: string;
    try {
      const result = await initializeChapaPayment(chapaSecretKey, {
        amount,
        currency: "ETB",
        email: reservation.customerEmail || req.user?.email || "guest@kalicinema.com",
        firstName: firstName || "Cinema",
        lastName: rest.join(" ") || "Guest",
        txRef,
        callbackUrl: `${serverUrl}/api/payments/webhook`,
        returnUrl: `${frontendUrl}/payment/callback?reservationId=${reservationId}`,
      });
      checkoutUrl = result.checkoutUrl;
    } catch (err: any) {
      console.error("Chapa initialization error:", err);
      res.status(400).json({
        success: false,
        message: err.message || "Payment gateway is currently not available.",
      });
      return;
    }

    await paymentRef.set({
      reservationId,
      userId: req.user!.uid,
      amount,
      currency: "ETB",
      method,
      status: "PENDING",
      transactionId: txRef,
      createdAt: existingPaymentSnap.exists
        ? existingPaymentSnap.data()!.createdAt
        : nowIso,
      updatedAt: nowIso,
    });

    res.json({ success: true, alreadyConfirmed: false, checkoutUrl });
  } catch (error: any) {
    console.error("Initialize payment error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to initialize payment." });
  }
});

/**
 * POST /api/payments/verify
 * Verifies payment status for a reservation.
 */
router.post("/verify", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reservationId } = req.body as { reservationId?: string };

    if (!reservationId || typeof reservationId !== "string") {
      res.status(400).json({ success: false, message: "reservationId is required." });
      return;
    }

    const paymentSnap = await db.collection(PAYMENTS).doc(reservationId).get();
    if (!paymentSnap.exists) {
      res.status(404).json({ success: false, message: "No payment found for this reservation." });
      return;
    }

    const payment = paymentSnap.data()!;
    if (payment.userId !== req.user!.uid && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "This payment does not belong to you." });
      return;
    }

    if (payment.method === "PAY_AT_CINEMA") {
      res.json({ success: true, status: "PENDING", message: "Please pay at the cinema counter." });
      return;
    }

    if (payment.status !== "PENDING") {
      res.json({ success: true, status: payment.status });
      return;
    }

    const result = await finalizeChapaTransaction(
      payment.transactionId,
      process.env.CHAPA_SECRET_KEY
    );

    res.json({ success: true, status: result.handled ? result.status : "PENDING" });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to verify payment." });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook handler for server-to-server callback from Chapa.
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const txRef = req.body?.tx_ref || req.query?.tx_ref;
    if (!txRef || typeof txRef !== "string") {
      res.status(400).send("Missing tx_ref");
      return;
    }

    const result = await finalizeChapaTransaction(txRef, process.env.CHAPA_SECRET_KEY);
    if (!result.handled) {
      res.status(404).send("Unknown transaction");
      return;
    }
    res.status(200).send("OK");
  } catch (err: any) {
    console.error("Chapa webhook error:", err);
    res.status(500).send("Internal error");
  }
});

export default router;
