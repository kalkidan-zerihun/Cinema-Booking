import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Concurrency & Atomic Seat Locking Suite", () => {
  // In-memory atomic locking store simulating Firestore transaction locks
  class MockFirestoreTransactionManager {
    private reservedSeats = new Map<string, { reservationId: string; userId: string; expiresAt: number }>();

    public async attemptAtomicReservation(
      reservationId: string,
      userId: string,
      showtimeId: string,
      seatIds: string[],
      holdDurationMs: number = 15 * 60 * 1000
    ): Promise<{ success: boolean; conflictSeats?: string[] }> {
      const now = Date.now();
      const conflictSeats: string[] = [];

      // Step 1: Check all requested seat locks
      for (const seatId of seatIds) {
        const lockKey = `${showtimeId}_${seatId}`;
        const existing = this.reservedSeats.get(lockKey);
        if (existing && existing.expiresAt > now) {
          conflictSeats.push(seatId);
        }
      }

      // If any seat is locked/occupied, fail atomically
      if (conflictSeats.length > 0) {
        return { success: false, conflictSeats };
      }

      // Step 2: Lock all seats atomically
      for (const seatId of seatIds) {
        const lockKey = `${showtimeId}_${seatId}`;
        this.reservedSeats.set(lockKey, {
          reservationId,
          userId,
          expiresAt: now + holdDurationMs,
        });
      }

      return { success: true };
    }

    public isSeatLocked(showtimeId: string, seatId: string): boolean {
      const lockKey = `${showtimeId}_${seatId}`;
      const existing = this.reservedSeats.get(lockKey);
      return Boolean(existing && existing.expiresAt > Date.now());
    }
  }

  test("Simultaneous reservation conflict: Exactly one user wins the seat, the other receives conflict", async () => {
    const manager = new MockFirestoreTransactionManager();
    const showtimeId = "showtime_avengers_1";
    const contestedSeat = "hall_1_C4";

    // Simulate User A and User B clicking 'Proceed to Book' simultaneously
    const [resultA, resultB] = await Promise.all([
      manager.attemptAtomicReservation("res_user_a", "user_a", showtimeId, [contestedSeat]),
      manager.attemptAtomicReservation("res_user_b", "user_b", showtimeId, [contestedSeat]),
    ]);

    // One must succeed, one must fail with conflict
    const successCount = (resultA.success ? 1 : 0) + (resultB.success ? 1 : 0);
    const failureCount = (!resultA.success ? 1 : 0) + (!resultB.success ? 1 : 0);

    assert.equal(successCount, 1, "Exactly one concurrent reservation must succeed");
    assert.equal(failureCount, 1, "The competing concurrent reservation must fail");

    const failedResult = !resultA.success ? resultA : resultB;
    assert.deepEqual(failedResult.conflictSeats, [contestedSeat], "Conflicting seat must be accurately reported");
  });

  test("Disjoint seat selections by different users both succeed without blocking each other", async () => {
    const manager = new MockFirestoreTransactionManager();
    const showtimeId = "showtime_dune_2";

    const resultA = await manager.attemptAtomicReservation("res_1", "user_1", showtimeId, ["hall_1_A1", "hall_1_A2"]);
    const resultB = await manager.attemptAtomicReservation("res_2", "user_2", showtimeId, ["hall_1_B1", "hall_1_B2"]);

    assert.equal(resultA.success, true);
    assert.equal(resultB.success, true);
    assert.equal(manager.isSeatLocked(showtimeId, "hall_1_A1"), true);
    assert.equal(manager.isSeatLocked(showtimeId, "hall_1_B1"), true);
  });
});
