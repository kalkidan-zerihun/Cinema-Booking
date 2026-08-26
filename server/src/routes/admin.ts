import { Router, Response } from "express";
import { db } from "../firebase.ts";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.ts";
import { adminRateLimiter } from "../middleware/rateLimit.ts";
import { logAdminAction } from "../utils/auditLog.ts";

const router = Router();

// Helper to safely get parameter string in Express v5
function getIdParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || "";
}

// Convert "HH:MM" (e.g. "14:30") or ISO string to total minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    return d.getHours() * 60 + d.getMinutes();
  }
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  return 0;
}

// Protect all admin endpoints with authentication, admin role verification, and rate limiting
router.use(authenticate);
router.use(requireAdmin);
router.use(adminRateLimiter);

// ==========================================
// AUDIT LOGS ENDPOINT
// ==========================================

router.get("/audit-logs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limitNum = Math.min(Number(req.query.limit) || 50, 100);
    const snap = await db
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(limitNum)
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Fetch audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs." });
  }
});

// ==========================================
// MOVIES MANAGEMENT
// ==========================================

router.get("/movies", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("movies").get();
    const movies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: movies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch movies." });
  }
});

router.post("/movies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      res.status(400).json({ success: false, message: "Movie title is required." });
      return;
    }
    const duration = Number(data.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
      res.status(400).json({ success: false, message: "Valid duration (1-600 minutes) is required." });
      return;
    }
    if (!data.genre || (typeof data.genre !== "string" && !Array.isArray(data.genre))) {
      res.status(400).json({ success: false, message: "Movie genre is required." });
      return;
    }

    const nowIso = new Date().toISOString();
    const docRef = await db.collection("movies").add({
      ...data,
      title: data.title.trim(),
      duration,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CREATED_MOVIE",
      "movie",
      docRef.id,
      { title: data.title.trim(), duration },
      req.user?.email
    );

    res.status(201).json({ success: true, data: { id: docRef.id, ...data, duration } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to create movie." });
  }
});

router.put("/movies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    if (data.title !== undefined && (!data.title || typeof data.title !== "string" || !data.title.trim())) {
      res.status(400).json({ success: false, message: "Movie title cannot be empty." });
      return;
    }
    if (data.duration !== undefined) {
      const duration = Number(data.duration);
      if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
        res.status(400).json({ success: false, message: "Valid duration (1-600 minutes) is required." });
        return;
      }
      data.duration = duration;
    }

    const nowIso = new Date().toISOString();
    await db.collection("movies").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_UPDATED_MOVIE",
      "movie",
      id,
      { updatedFields: Object.keys(data) },
      req.user?.email
    );

    res.json({ success: true, message: "Movie updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update movie." });
  }
});

router.delete("/movies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);

    // Data Safety Guard: Check if showtimes reference this movie
    const showtimesSnap = await db.collection("showtimes").where("movieId", "==", id).limit(1).get();
    if (!showtimesSnap.empty) {
      res.status(409).json({
        success: false,
        message: "Cannot delete movie because active or scheduled showtimes reference it. Please remove or update associated showtimes first.",
      });
      return;
    }

    await db.collection("movies").doc(id).delete();

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_MOVIE",
      "movie",
      id,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Movie deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete movie." });
  }
});

// ==========================================
// CINEMAS MANAGEMENT
// ==========================================

router.get("/cinemas", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("cinemas").get();
    const cinemas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: cinemas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch cinemas." });
  }
});

router.post("/cinemas", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      res.status(400).json({ success: false, message: "Cinema name is required." });
      return;
    }
    if (!data.location || typeof data.location !== "string" || !data.location.trim()) {
      res.status(400).json({ success: false, message: "Cinema location is required." });
      return;
    }

    const nowIso = new Date().toISOString();
    const docRef = await db.collection("cinemas").add({
      ...data,
      name: data.name.trim(),
      location: data.location.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CREATED_CINEMA",
      "cinema",
      docRef.id,
      { name: data.name.trim(), location: data.location.trim() },
      req.user?.email
    );

    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to create cinema." });
  }
});

router.put("/cinemas/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    const nowIso = new Date().toISOString();
    await db.collection("cinemas").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_UPDATED_CINEMA",
      "cinema",
      id,
      { updatedFields: Object.keys(data) },
      req.user?.email
    );

    res.json({ success: true, message: "Cinema updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update cinema." });
  }
});

router.delete("/cinemas/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);

    // Data Safety Guard: Check if cinema has halls or showtimes
    const hallsSnap = await db.collection("halls").where("cinemaId", "==", id).limit(1).get();
    if (!hallsSnap.empty) {
      res.status(409).json({
        success: false,
        message: "Cannot delete cinema with existing halls. Please delete or reassign associated halls first.",
      });
      return;
    }

    const showtimesSnap = await db.collection("showtimes").where("cinemaId", "==", id).limit(1).get();
    if (!showtimesSnap.empty) {
      res.status(409).json({
        success: false,
        message: "Cannot delete cinema with scheduled showtimes. Please remove associated showtimes first.",
      });
      return;
    }

    await db.collection("cinemas").doc(id).delete();

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_CINEMA",
      "cinema",
      id,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Cinema deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete cinema." });
  }
});

// ==========================================
// HALLS MANAGEMENT
// ==========================================

router.get("/halls", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("halls").get();
    const halls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: halls });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch halls." });
  }
});

router.post("/halls", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.cinemaId || typeof data.cinemaId !== "string") {
      res.status(400).json({ success: false, message: "cinemaId is required." });
      return;
    }
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      res.status(400).json({ success: false, message: "Hall name is required." });
      return;
    }

    const cinemaSnap = await db.collection("cinemas").doc(data.cinemaId).get();
    if (!cinemaSnap.exists) {
      res.status(404).json({ success: false, message: "Associated cinema does not exist." });
      return;
    }

    const capacity = Number(data.capacity) || 50;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("halls").add({
      ...data,
      name: data.name.trim(),
      capacity,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CREATED_HALL",
      "hall",
      docRef.id,
      { name: data.name.trim(), cinemaId: data.cinemaId, capacity },
      req.user?.email
    );

    res.status(201).json({ success: true, data: { id: docRef.id, ...data, capacity } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to create hall." });
  }
});

router.put("/halls/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    const nowIso = new Date().toISOString();
    await db.collection("halls").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_UPDATED_HALL",
      "hall",
      id,
      { updatedFields: Object.keys(data) },
      req.user?.email
    );

    res.json({ success: true, message: "Hall updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update hall." });
  }
});

router.delete("/halls/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);

    // Data Safety Guard: Check if showtimes use this hall
    const showtimesSnap = await db.collection("showtimes").where("hallId", "==", id).limit(1).get();
    if (!showtimesSnap.empty) {
      res.status(409).json({
        success: false,
        message: "Cannot delete hall with scheduled showtimes. Please remove associated showtimes first.",
      });
      return;
    }

    await db.collection("halls").doc(id).delete();

    // Clean up seat layout for deleted hall
    const seatsSnap = await db.collection("seats").where("hallId", "==", id).get();
    if (!seatsSnap.empty) {
      const batch = db.batch();
      seatsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_HALL",
      "hall",
      id,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Hall and its seats deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete hall." });
  }
});

// ==========================================
// SEATS MANAGEMENT
// ==========================================

router.get("/seats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hallId = req.query.hallId as string;
    let queryRef: FirebaseFirestore.Query = db.collection("seats");

    if (hallId) {
      queryRef = queryRef.where("hallId", "==", hallId);
    }

    const snap = await queryRef.get();
    const seats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: seats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch seats." });
  }
});

router.post("/seats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.hallId || !data.row || data.number === undefined) {
      res.status(400).json({ success: false, message: "hallId, row, and number are required." });
      return;
    }
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("seats").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CREATED_SEAT",
      "seat",
      docRef.id,
      { hallId: data.hallId, label: data.label || `${data.row}${data.number}` },
      req.user?.email
    );

    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to create seat." });
  }
});

router.post("/seats/batch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { seats } = req.body as { seats: Array<any> };
    if (!Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ success: false, message: "Seats array is required." });
      return;
    }

    const batch = db.batch();
    const nowIso = new Date().toISOString();

    for (const seat of seats) {
      const ref = db.collection("seats").doc();
      batch.set(ref, {
        ...seat,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    await batch.commit();

    await logAdminAction(
      req.user!.uid,
      "ADMIN_BATCH_CREATED_SEATS",
      "seat",
      "batch",
      { count: seats.length },
      req.user?.email
    );

    res.json({ success: true, message: `Created ${seats.length} seats.` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to batch create seats." });
  }
});

router.post("/seats/generate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hallId, rowCount = 4, seatsPerRow = 6, vipRows = [], premiumRows = [] } = req.body;
    if (!hallId || typeof hallId !== "string") {
      res.status(400).json({ success: false, message: "hallId is required." });
      return;
    }

    const hallSnap = await db.collection("halls").doc(hallId).get();
    if (!hallSnap.exists) {
      res.status(404).json({ success: false, message: "Hall not found." });
      return;
    }

    // Delete existing seats for this hall
    const existingSnap = await db.collection("seats").where("hallId", "==", hallId).get();
    if (!existingSnap.empty) {
      const deleteBatch = db.batch();
      existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
    const rowsToGen = Math.min(Number(rowCount) || 4, rowLetters.length);
    const colsToGen = Number(seatsPerRow) || 6;
    const nowIso = new Date().toISOString();

    const insertBatch = db.batch();
    const generatedSeats: any[] = [];

    for (let r = 0; r < rowsToGen; r++) {
      const row = rowLetters[r];
      const isVip = vipRows.includes(row) || (vipRows.length === 0 && r === rowsToGen - 1 && rowsToGen > 2);
      const isPremium = premiumRows.includes(row);

      let type = "STANDARD";
      let priceModifier = 1.0;
      if (isVip) {
        type = "VIP";
        priceModifier = 1.35;
      } else if (isPremium) {
        type = "PREMIUM";
        priceModifier = 1.15;
      }

      for (let num = 1; num <= colsToGen; num++) {
        const docRef = db.collection("seats").doc();
        const seatData = {
          hallId,
          row,
          number: num,
          label: `${row}${num}`,
          type,
          priceModifier,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        insertBatch.set(docRef, seatData);
        generatedSeats.push({ id: docRef.id, ...seatData });
      }
    }

    await insertBatch.commit();

    // Update hall totalRows and seatsPerRow
    await db.collection("halls").doc(hallId).update({
      totalRows: rowsToGen,
      seatsPerRow: colsToGen,
      capacity: rowsToGen * colsToGen,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_GENERATED_SEATS",
      "hall",
      hallId,
      { totalSeats: generatedSeats.length, rows: rowsToGen, cols: colsToGen },
      req.user?.email
    );

    res.json({ success: true, data: generatedSeats });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to generate hall seats." });
  }
});

router.delete("/seats/hall/:hallId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hallId = getIdParam(req.params.hallId);
    const snap = await db.collection("seats").where("hallId", "==", hallId).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_HALL_SEATS",
      "hall",
      hallId,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Seats for hall deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete hall seats." });
  }
});

router.put("/seats/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    const nowIso = new Date().toISOString();
    await db.collection("seats").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_UPDATED_SEAT",
      "seat",
      id,
      { updatedFields: Object.keys(data) },
      req.user?.email
    );

    res.json({ success: true, message: "Seat updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update seat." });
  }
});

router.delete("/seats/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("seats").doc(id).delete();

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_SEAT",
      "seat",
      id,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Seat deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete seat." });
  }
});

// ==========================================
// SHOWTIMES MANAGEMENT & CONFLICT DETECTION
// ==========================================

async function checkShowtimeConflict(
  hallId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeShowtimeId?: string
): Promise<{ conflict: boolean; message?: string }> {
  const startMins = parseTimeToMinutes(startTime);
  // Add 15-minute cleaning and turnaround buffer between screenings
  const endMins = startMins + durationMinutes + 15;

  const existingSnap = await db
    .collection("showtimes")
    .where("hallId", "==", hallId)
    .where("date", "==", date)
    .get();

  for (const doc of existingSnap.docs) {
    if (excludeShowtimeId && doc.id === excludeShowtimeId) continue;
    const ex = doc.data();
    const exStartMins = parseTimeToMinutes(ex.startTime);
    let exDuration = 120;
    if (ex.movieId) {
      const mDoc = await db.collection("movies").doc(ex.movieId).get();
      if (mDoc.exists && mDoc.data()?.duration) {
        exDuration = Number(mDoc.data()!.duration);
      }
    }
    const exEndMins = exStartMins + exDuration + 15;

    // Check overlap: (startA < endB && endA > startB)
    if (startMins < exEndMins && endMins > exStartMins) {
      const exStartFormatted = `${Math.floor(exStartMins / 60)
        .toString()
        .padStart(2, "0")}:${(exStartMins % 60).toString().padStart(2, "0")}`;
      const exEndFormatted = `${Math.floor((exStartMins + exDuration) / 60)
        .toString()
        .padStart(2, "0")}:${((exStartMins + exDuration) % 60).toString().padStart(2, "0")}`;

      return {
        conflict: true,
        message: `Showtime schedule conflicts with an existing screening in this hall (${exStartFormatted} - ${exEndFormatted} including turnaround). Please select a different time or auditorium.`,
      };
    }
  }

  return { conflict: false };
}

router.get("/showtimes", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("showtimes").get();
    const showtimes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: showtimes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch showtimes." });
  }
});

router.post("/showtimes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.movieId || !data.cinemaId || !data.hallId || !data.date || !data.startTime) {
      res.status(400).json({
        success: false,
        message: "movieId, cinemaId, hallId, date, and startTime are required.",
      });
      return;
    }

    const ticketPrice = Number(data.ticketPrice);
    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      res.status(400).json({ success: false, message: "Valid ticket price is required." });
      return;
    }

    const movieSnap = await db.collection("movies").doc(data.movieId).get();
    if (!movieSnap.exists) {
      res.status(404).json({ success: false, message: "Movie not found." });
      return;
    }
    const movieDuration = Number(movieSnap.data()?.duration) || 120;

    // Check auditorium schedule conflict
    const conflictResult = await checkShowtimeConflict(
      data.hallId,
      data.date,
      data.startTime,
      movieDuration
    );
    if (conflictResult.conflict) {
      res.status(409).json({ success: false, message: conflictResult.message });
      return;
    }

    const nowIso = new Date().toISOString();
    const docRef = await db.collection("showtimes").add({
      ...data,
      ticketPrice,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CREATED_SHOWTIME",
      "showtime",
      docRef.id,
      { movieId: data.movieId, cinemaId: data.cinemaId, hallId: data.hallId, date: data.date, startTime: data.startTime },
      req.user?.email
    );

    res.status(201).json({ success: true, data: { id: docRef.id, ...data, ticketPrice } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to create showtime." });
  }
});

router.put("/showtimes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;

    const existingSnap = await db.collection("showtimes").doc(id).get();
    if (!existingSnap.exists) {
      res.status(404).json({ success: false, message: "Showtime not found." });
      return;
    }
    const current = existingSnap.data()!;

    const hallId = data.hallId || current.hallId;
    const date = data.date || current.date;
    const startTime = data.startTime || current.startTime;
    const movieId = data.movieId || current.movieId;

    if (movieId) {
      const movieSnap = await db.collection("movies").doc(movieId).get();
      const movieDuration = Number(movieSnap.data()?.duration) || 120;

      const conflictResult = await checkShowtimeConflict(
        hallId,
        date,
        startTime,
        movieDuration,
        id
      );
      if (conflictResult.conflict) {
        res.status(409).json({ success: false, message: conflictResult.message });
        return;
      }
    }

    const nowIso = new Date().toISOString();
    await db.collection("showtimes").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_UPDATED_SHOWTIME",
      "showtime",
      id,
      { updatedFields: Object.keys(data) },
      req.user?.email
    );

    res.json({ success: true, message: "Showtime updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update showtime." });
  }
});

router.delete("/showtimes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);

    // Data Safety Guard: Check if showtime has active or confirmed reservations
    const reservationsSnap = await db
      .collection("reservations")
      .where("showtimeId", "==", id)
      .limit(1)
      .get();

    if (!reservationsSnap.empty) {
      const activeRes = reservationsSnap.docs.find((d) => d.data().status !== "CANCELLED");
      if (activeRes) {
        res.status(409).json({
          success: false,
          message: "Cannot delete showtime because active bookings exist for this screening. Please cancel reservations first.",
        });
        return;
      }
    }

    await db.collection("showtimes").doc(id).delete();

    // Remove reservationSeat locks for this showtime
    const seatLocksSnap = await db.collection("reservationSeats").where("showtimeId", "==", id).get();
    if (!seatLocksSnap.empty) {
      const batch = db.batch();
      seatLocksSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await logAdminAction(
      req.user!.uid,
      "ADMIN_DELETED_SHOWTIME",
      "showtime",
      id,
      {},
      req.user?.email
    );

    res.json({ success: true, message: "Showtime deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete showtime." });
  }
});

// ==========================================
// RESERVATIONS MANAGEMENT
// ==========================================

router.get("/reservations", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("reservations").get();
    const reservations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: reservations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch reservations." });
  }
});

// ==========================================
// USERS MANAGEMENT
// ==========================================

router.get("/users", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("users").get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

router.put("/users/:id/role", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const { role } = req.body;

    if (!role || !["CUSTOMER", "ADMIN"].includes(role)) {
      res.status(400).json({ success: false, message: "Valid role ('CUSTOMER' or 'ADMIN') is required." });
      return;
    }

    if (id === req.user!.uid) {
      res.status(400).json({ success: false, message: "You cannot modify your own admin role." });
      return;
    }

    await db.collection("users").doc(id).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    await logAdminAction(
      req.user!.uid,
      "ADMIN_CHANGED_USER_ROLE",
      "user",
      id,
      { newRole: role },
      req.user?.email
    );

    res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to update user role." });
  }
});

export default router;
