import { Router, Response } from "express";
import { db } from "../firebase.ts";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.ts";

const router = Router();

// Helper to safely get parameter string in Express v5
function getIdParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || "";
}

// Protect all admin endpoints
router.use(authenticate);
router.use(requireAdmin);

// ==========================================
// MOVIES MANAGEMENT
// ==========================================

router.get("/movies", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("movies").get();
    const movies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: movies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch movies." });
  }
});

router.post("/movies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("movies").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create movie." });
  }
});

router.put("/movies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    const nowIso = new Date().toISOString();
    await db.collection("movies").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });
    res.json({ success: true, message: "Movie updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update movie." });
  }
});

router.delete("/movies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("movies").doc(id).delete();
    res.json({ success: true, message: "Movie deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete movie." });
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch cinemas." });
  }
});

router.post("/cinemas", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("cinemas").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create cinema." });
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
    res.json({ success: true, message: "Cinema updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update cinema." });
  }
});

router.delete("/cinemas/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("cinemas").doc(id).delete();
    res.json({ success: true, message: "Cinema deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete cinema." });
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch halls." });
  }
});

router.post("/halls", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("halls").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create hall." });
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
    res.json({ success: true, message: "Hall updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update hall." });
  }
});

router.delete("/halls/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("halls").doc(id).delete();
    res.json({ success: true, message: "Hall deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete hall." });
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch seats." });
  }
});

router.post("/seats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("seats").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create seat." });
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
    res.json({ success: true, message: "Seat updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update seat." });
  }
});

router.delete("/seats/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("seats").doc(id).delete();
    res.json({ success: true, message: "Seat deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete seat." });
  }
});

// ==========================================
// SHOWTIMES MANAGEMENT
// ==========================================

router.get("/showtimes", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await db.collection("showtimes").get();
    const showtimes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: showtimes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch showtimes." });
  }
});

router.post("/showtimes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const nowIso = new Date().toISOString();
    const docRef = await db.collection("showtimes").add({
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create showtime." });
  }
});

router.put("/showtimes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    const data = req.body;
    const nowIso = new Date().toISOString();
    await db.collection("showtimes").doc(id).update({
      ...data,
      updatedAt: nowIso,
    });
    res.json({ success: true, message: "Showtime updated successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update showtime." });
  }
});

router.delete("/showtimes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    await db.collection("showtimes").doc(id).delete();
    res.json({ success: true, message: "Showtime deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete showtime." });
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch reservations." });
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch users." });
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

    res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update user role." });
  }
});

export default router;
