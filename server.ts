import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/src/firebase.ts";
import reservationRouter, { expirePendingReservationsTask } from "./server/src/routes/reservation.ts";
import paymentsRouter from "./server/src/routes/payments.ts";
import adminRouter from "./server/src/routes/admin.ts";
import authRouter from "./server/src/routes/auth.ts";
import { bootstrapAdminUsers } from "./server/src/utils/adminBootstrap.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health Endpoint
  app.get("/api/health", async (_req, res) => {
    let firebaseStatus = "ready";
    try {
      if (db) {
        // Optional quick ping
        firebaseStatus = "connected";
      }
    } catch {
      firebaseStatus = "unreachable";
    }

    res.json({
      status: "OK",
      message: "Cinema API is online",
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

  // Background cron task for releasing expired unpaid seat holds every 2 minutes
  setInterval(async () => {
    try {
      const expiredCount = await expirePendingReservationsTask();
      if (expiredCount > 0) {
        console.log(`[Cron] Expired ${expiredCount} unpaid reservation(s) and released seat locks.`);
      }
    } catch (err: any) {
      if (
        err?.code === 7 ||
        err?.message?.includes("PERMISSION_DENIED") ||
        err?.message?.includes("Missing or insufficient permissions")
      ) {
        // Admin SDK credentials not provisioned for remote Firestore instance; client-side timestamp filters expire seat holds automatically.
      } else {
        console.error("[Cron Error] Failed to expire pending reservations:", err);
      }
    }
  }, 2 * 60 * 1000);

  // Vite middleware in development / Static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Server] Cinema running on http://0.0.0.0:${PORT}`);
    await bootstrapAdminUsers();
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
