import { auth, db } from "../firebase.js";

/**
 * Server-side bootstrap function running with Firebase Admin SDK.
 * Finds admin accounts (such as admin@kalicinema.com) in Firebase Auth
 * and ensures their Firestore document users/{UID} exists with role: 'ADMIN'.
 */
export async function bootstrapAdminUsers(): Promise<void> {
  try {
    const adminEmail = "admin@kalicinema.com";
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
    } catch {
      // Admin account not created in Firebase Auth yet
      return;
    }

    if (userRecord && userRecord.uid) {
      const userDocRef = db.collection("users").doc(userRecord.uid);
      const userSnap = await userDocRef.get();

      if (!userSnap.exists || userSnap.data()?.role !== "ADMIN") {
        const nowIso = new Date().toISOString();
        await userDocRef.set(
          {
            uid: userRecord.uid,
            name: userRecord.displayName || "Kali Administrator",
            email: adminEmail,
            role: "ADMIN",
            updatedAt: nowIso,
            ...(userSnap.exists ? {} : { createdAt: nowIso }),
          },
          { merge: true }
        );
        console.log(`[Admin Bootstrap] Granted ADMIN role to users/${userRecord.uid} (${adminEmail})`);
      }
    }
  } catch (err) {
    console.error("[Admin Bootstrap Error]", err);
  }
}
