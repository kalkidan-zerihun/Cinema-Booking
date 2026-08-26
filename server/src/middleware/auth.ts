import { Request, Response, NextFunction } from "express";
import { auth, db } from "../firebase.js";
import { isAuthorizedAdminEmail } from "../utils/adminBootstrap.js";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid Bearer token.",
    });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1]?.trim();

  if (!idToken) {
    res.status(401).json({
      success: false,
      message: "Authentication token missing.",
    });
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Fetch user profile from Firestore to determine actual role
    const userDocRef = db.collection("users").doc(uid);
    const userSnap = await userDocRef.get();
    let role = "CUSTOMER";

    if (userSnap.exists) {
      role = userSnap.data()?.role || "CUSTOMER";
    }

    // If email is in authorized admin list and not yet set in Firestore, promote
    if (email && isAuthorizedAdminEmail(email) && role !== "ADMIN") {
      role = "ADMIN";
      const nowIso = new Date().toISOString();
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
    }

    req.user = {
      uid,
      email: email || userSnap.data()?.email,
      role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
    return;
  }

  next();
}
