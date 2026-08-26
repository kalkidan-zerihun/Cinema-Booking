import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Showtime Schedule & Conflict Prevention Suite", () => {
  interface ShowtimeRecord {
    id: string;
    cinemaId: string;
    hallId: string;
    date: string;
    startTime: string;
    endTime: string;
  }

  function parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  function checkShowtimeConflict(
    existingShowtimes: ShowtimeRecord[],
    candidate: Omit<ShowtimeRecord, "id">,
    excludeShowtimeId?: string
  ): { hasConflict: boolean; conflictingShowtime?: ShowtimeRecord } {
    const newStart = parseTimeToMinutes(candidate.startTime);
    const newEnd = parseTimeToMinutes(candidate.endTime);

    for (const existing of existingShowtimes) {
      if (excludeShowtimeId && existing.id === excludeShowtimeId) {
        continue;
      }

      // Conflict can only happen if same cinema, same hall, and same date
      if (
        existing.cinemaId === candidate.cinemaId &&
        existing.hallId === candidate.hallId &&
        existing.date === candidate.date
      ) {
        const existStart = parseTimeToMinutes(existing.startTime);
        const existEnd = parseTimeToMinutes(existing.endTime);

        // Overlap formula: StartA < EndB && EndA > StartB
        if (newStart < existEnd && newEnd > existStart) {
          return { hasConflict: true, conflictingShowtime: existing };
        }
      }
    }

    return { hasConflict: false };
  }

  const existingSchedule: ShowtimeRecord[] = [
    {
      id: "st_1",
      cinemaId: "cinema_edna",
      hallId: "hall_imax",
      date: "2026-05-20",
      startTime: "14:00",
      endTime: "16:30",
    },
    {
      id: "st_2",
      cinemaId: "cinema_edna",
      hallId: "hall_vip",
      date: "2026-05-20",
      startTime: "14:00",
      endTime: "16:30",
    },
  ];

  test("Rejects overlapping showtime in the same hall on the same date (Conflict)", () => {
    const candidate = {
      cinemaId: "cinema_edna",
      hallId: "hall_imax",
      date: "2026-05-20",
      startTime: "15:00", // Overlaps with 14:00 - 16:30!
      endTime: "17:15",
    };

    const result = checkShowtimeConflict(existingSchedule, candidate);
    assert.equal(result.hasConflict, true, "Must detect overlap conflict");
    assert.equal(result.conflictingShowtime?.id, "st_1");
  });

  test("Allows non-overlapping showtime in the same hall (Later time slot)", () => {
    const candidate = {
      cinemaId: "cinema_edna",
      hallId: "hall_imax",
      date: "2026-05-20",
      startTime: "17:00", // Begins after 16:30
      endTime: "19:30",
    };

    const result = checkShowtimeConflict(existingSchedule, candidate);
    assert.equal(result.hasConflict, false, "Must permit non-overlapping showtime");
  });

  test("Allows simultaneous showtime in a different hall in the same cinema", () => {
    const candidate = {
      cinemaId: "cinema_edna",
      hallId: "hall_screen_2", // Different hall
      date: "2026-05-20",
      startTime: "14:00",
      endTime: "16:30",
    };

    const result = checkShowtimeConflict(existingSchedule, candidate);
    assert.equal(result.hasConflict, false, "Different halls must operate independently");
  });

  test("Allows simultaneous showtime in a different cinema complex", () => {
    const candidate = {
      cinemaId: "cinema_century", // Different cinema
      hallId: "hall_imax",
      date: "2026-05-20",
      startTime: "14:00",
      endTime: "16:30",
    };

    const result = checkShowtimeConflict(existingSchedule, candidate);
    assert.equal(result.hasConflict, false, "Different cinemas must operate independently");
  });

  test("Editing an existing showtime excludes itself from overlap detection", () => {
    const candidate = {
      cinemaId: "cinema_edna",
      hallId: "hall_imax",
      date: "2026-05-20",
      startTime: "14:15", // Minor adjustment
      endTime: "16:45",
    };

    // Exclude self (st_1)
    const result = checkShowtimeConflict(existingSchedule, candidate, "st_1");
    assert.equal(result.hasConflict, false, "Must not conflict with itself when updating");
  });
});
