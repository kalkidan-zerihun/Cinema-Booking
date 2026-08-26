import { Router, Request, Response } from "express";
import { db, auth } from "../firebase.js";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";
import { isAuthorizedAdminEmail, bootstrapAdminUsers, PRESET_ACCOUNTS } from "../utils/adminBootstrap.js";

const router = Router();

/**
 * POST /api/auth/provision-preset
 * Ensures default admin and demo customer credentials exist in Firebase Auth & Firestore.
 */
router.post("/provision-preset", async (_req: Request, res: Response) => {
  try {
    await bootstrapAdminUsers();
    res.json({
      success: true,
      message: "Preset accounts provisioned and synced successfully.",
      accounts: PRESET_ACCOUNTS.map((a) => ({ email: a.email, role: a.role })),
    });
  } catch (error: any) {
    console.error("Provision preset error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to provision presets." });
  }
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile and synchronizes ADMIN role if eligible.
 */
router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || "";

    const userDocRef = db.collection("users").doc(uid);
    const userSnap = await userDocRef.get();

    const isEligibleAdmin = isAuthorizedAdminEmail(email);
    let currentRole = userSnap.exists ? userSnap.data()?.role : "CUSTOMER";

    const nowIso = new Date().toISOString();

    // If eligible admin but not yet marked ADMIN in Firestore, promote automatically
    if (isEligibleAdmin && currentRole !== "ADMIN") {
      currentRole = "ADMIN";
      await userDocRef.set(
        {
          uid,
          email,
          role: "ADMIN",
          updatedAt: nowIso,
          ...(userSnap.exists ? {} : { createdAt: nowIso, name: "Administrator" }),
        },
        { merge: true }
      );
    } else if (!userSnap.exists) {
      // Create initial profile if missing
      await userDocRef.set({
        uid,
        email,
        name: "Cinema Member",
        role: isEligibleAdmin ? "ADMIN" : "CUSTOMER",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      currentRole = isEligibleAdmin ? "ADMIN" : "CUSTOMER";
    }

    const freshSnap = await userDocRef.get();
    const data = freshSnap.data();

    res.json({
      success: true,
      data: {
        uid,
        email,
        name: data?.name || "Cinema Guest",
        role: currentRole,
        phone: data?.phone || "",
        createdAt: data?.createdAt || nowIso,
      },
    });
  } catch (error: any) {
    console.error("Auth /me error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to get user profile." });
  }
});

export default router;
