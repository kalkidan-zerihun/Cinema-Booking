import { Request, Response, NextFunction } from "express";
import { auth, db } from "../firebase.js";

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
      message: "Authentication required. Please provide a valid token.",
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

    // Fetch user profile from Firestore to determine actual role
    const userSnap = await db.collection("users").doc(uid).get();
    let role = "CUSTOMER";

    if (userSnap.exists) {
      role = userSnap.data()?.role || "CUSTOMER";
    }

    req.user = {
      uid,
      email: decodedToken.email || userSnap.data()?.email,
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
