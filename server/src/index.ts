import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./firebase.ts";
import reservationRouter, { expirePendingReservationsTask } from "./routes/reservation.ts";
import paymentsRouter from "./routes/payments.ts";
import adminRouter from "./routes/admin.ts";
import authRouter from "./routes/auth.ts";
import { bootstrapAdminUsers } from "./utils/adminBootstrap.ts";

const app = express();

app.use(cors());
app.use(express.json());

// Health Endpoint
app.get("/api/health", async (_req, res) => {
  let firebaseStatus = "ready";
  try {
    if (db) {
      firebaseStatus = "connected";
    }
  } catch {
    firebaseStatus = "unreachable";
  }

  res.json({
    status: "OK",
    message: "Kali Cinema API is online",
    firebase: firebaseStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const getRouter = (r: any) => (r && typeof r === "object" && "default" in r ? r.default : r);
app.use("/api/auth", getRouter(authRouter));
app.use("/api/reservations", getRouter(reservationRouter));
app.use("/api/payments", getRouter(paymentsRouter));
app.use("/api/admin", getRouter(adminRouter));

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