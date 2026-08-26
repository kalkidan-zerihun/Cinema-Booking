import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/src/firebase.js";
import reservationRouter, { expirePendingReservationsTask } from "./server/src/routes/reservation.js";
import paymentsRouter from "./server/src/routes/payments.js";
import adminRouter from "./server/src/routes/admin.js";
import authRouter from "./server/src/routes/auth.js";
import { bootstrapAdminUsers } from "./server/src/utils/adminBootstrap.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health Endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      await db.collection("movies").limit(1).get();
      res.json({
        status: "OK",
        message: "Cinema API is healthy",
        firebase: "connected",
      });
    } catch (error) {
      console.error("Firebase health check error:", error);
      res.status(500).json({
        status: "ERROR",
        message: "Firebase connection failed",
      });
    }
  });

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/reservations", reservationRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/admin", adminRouter);

  // Background cron task for releasing expired unpaid seat holds every 2 minutes
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
    console.log(`[Server] Kali Cinema running on http://0.0.0.0:${PORT}`);
    await bootstrapAdminUsers();
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
