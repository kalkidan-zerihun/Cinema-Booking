import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./firebase.js";
import reservationRouter, { expirePendingReservationsTask } from "./routes/reservation.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import { bootstrapAdminUsers } from "./utils/adminBootstrap.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health Endpoint - Protected Existing Feature
app.get("/api/health", async (_req, res) => {
  try {
    await db.collection("movies").limit(1).get();

    res.json({
      status: "OK",
      message: "Cinema API is healthy",
      firebase: "connected",
    });
  } catch (error) {
    console.error("Firebase error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Firebase connection failed",
    });
  }
});

// API Routes
app.use("/api/reservations", reservationRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);

// Start background cron task for releasing expired unpaid seat holds
setInterval(async () => {
  try {
    const expiredCount = await expirePendingReservationsTask();
    if (expiredCount > 0) {
      console.log(`[Cron] Expired ${expiredCount} unpaid reservation(s) and released seat locks.`);
    }
  } catch (err) {
    console.error("[Cron Error] Failed to expire pending reservations:", err);
  }
}, 2 * 60 * 1000);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, async () => {
  console.log(`Cinema API running on http://localhost:${PORT}`);
  await bootstrapAdminUsers();
});