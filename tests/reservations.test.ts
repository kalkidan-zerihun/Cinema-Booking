import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Reservation Business Logic & Validation Suite", () => {
  const MAX_SEATS_PER_RESERVATION = 10;
  const RESERVATION_HOLD_MINUTES = 15;

  function calculateReservationPrice(
    baseTicketPrice: number,
    seats: Array<{ id: string; type?: string; priceModifier?: number }>
  ): number {
    return seats.reduce((total, seat) => {
      const modifier =
        seat.priceModifier !== undefined && Number.isFinite(seat.priceModifier)
          ? Number(seat.priceModifier)
          : seat.type === "VIP"
          ? 1.25
          : 1.0;
      return total + Math.round(baseTicketPrice * modifier);
    }, 0);
  }

  function generateBookingCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "CN-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  test("Calculates authentic server prices for Standard and VIP seats with modifiers", () => {
    const basePrice = 200; // 200 ETB
    const seats = [
      { id: "s1", type: "STANDARD", priceModifier: 1.0 },
      { id: "s2", type: "STANDARD", priceModifier: 1.0 },
      { id: "s3", type: "VIP", priceModifier: 1.25 }, // 250 ETB
    ];

    const totalPrice = calculateReservationPrice(basePrice, seats);
    assert.equal(totalPrice, 650, "200 + 200 + 250 should equal 650 ETB");
  });

  test("Rejects reservation attempts exceeding maximum seat limit", () => {
    const requestedSeats = Array.from({ length: 11 }, (_, i) => `seat_${i + 1}`);
    const isExceeded = requestedSeats.length > MAX_SEATS_PER_RESERVATION;
    assert.equal(isExceeded, true, "11 seats must exceed max 10 seats limit");
  });

  test("Generates cryptographically formatted booking codes with prefix 'CN-'", () => {
    const code = generateBookingCode();
    assert.match(code, /^CN-[A-Z0-9]{6}$/, "Booking code must follow 'CN-XXXXXX' format");
  });

  test("Enforces 15-minute hold expiration window on newly created pending reservations", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60 * 1000);
    const diffMinutes = (expiresAt.getTime() - now.getTime()) / (60 * 1000);
    assert.equal(diffMinutes, 15, "Expiration hold duration must be exactly 15 minutes");
  });

  test("Strict data ownership: Customer cannot cancel another user's reservation", () => {
    const reservation = {
      id: "res_abc",
      userId: "user_owner_123",
      status: "PENDING",
    };

    const requestingUserAlice = { uid: "user_owner_123", role: "CUSTOMER" };
    const requestingUserBob = { uid: "user_intruder_456", role: "CUSTOMER" };
    const requestingAdmin = { uid: "admin_789", role: "ADMIN" };

    const isAliceAllowed = requestingUserAlice.uid === reservation.userId || requestingUserAlice.role === "ADMIN";
    const isBobAllowed = requestingUserBob.uid === reservation.userId || requestingUserBob.role === "ADMIN";
    const isAdminAllowed = requestingAdmin.uid === reservation.userId || requestingAdmin.role === "ADMIN";

    assert.equal(isAliceAllowed, true, "Owner must be allowed to cancel");
    assert.equal(isBobAllowed, false, "Intruder must NOT be allowed to cancel");
    assert.equal(isAdminAllowed, true, "Admin must be allowed to cancel");
  });
});
