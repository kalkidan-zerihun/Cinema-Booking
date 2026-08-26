import { auth, db } from "../firebase.js";

/**
 * List of authorized admin emails.
 * Reads from ADMIN_EMAILS environment variable (comma-separated),
 * falling back to default Kali Cinema administrative emails.
 */
export function getAuthorizedAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  const parsed = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const defaults = ["admin@kalicinema.com", "admin@example.com"];
  return Array.from(new Set([...defaults, ...parsed]));
}

export function isAuthorizedAdminEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAuthorizedAdminEmails();
  return admins.includes(normalized);
}

export const PRESET_ACCOUNTS = [
  {
    email: "admin@kalicinema.com",
    password: "Admin12345!",
    name: "Kali Cinema Admin",
    role: "ADMIN",
  },
  {
    email: "guest@kalicinema.com",
    password: "Cinema12345!",
    name: "Demo Customer",
    role: "CUSTOMER",
  },
];

/**
 * Server-side bootstrap function running with Firebase Admin SDK.
 * Proactively provisions default demo accounts in Firebase Auth and Firestore.
 */
export async function bootstrapAdminUsers(): Promise<void> {
  try {
    // 1. Provision standard preset accounts
    for (const acc of PRESET_ACCOUNTS) {
      try {
        let uid = "";
        try {
          const userRecord = await auth.getUserByEmail(acc.email);
          uid = userRecord.uid;
          // Update password to ensure it matches preset credentials
          await auth.updateUser(uid, {
            password: acc.password,
            displayName: acc.name,
          });
        } catch (authErr: any) {
          if (authErr.code === "auth/user-not-found") {
            const newUser = await auth.createUser({
              email: acc.email,
              password: acc.password,
              displayName: acc.name,
            });
            uid = newUser.uid;
            console.log(`[Bootstrap] Created preset account: ${acc.email} (${uid})`);
          } else {
            console.warn(`[Bootstrap] Error fetching ${acc.email}:`, authErr.message);
          }
        }

        if (uid) {
          const userDocRef = db.collection("users").doc(uid);
          const userSnap = await userDocRef.get();
          const nowIso = new Date().toISOString();

          await userDocRef.set(
            {
              uid,
              name: acc.name,
              email: acc.email,
              role: acc.role,
              updatedAt: nowIso,
              ...(userSnap.exists ? {} : { createdAt: nowIso }),
            },
            { merge: true }
          );
        }
      } catch (err: any) {
        console.warn(`[Bootstrap Warning] Could not provision preset ${acc.email}:`, err.message);
      }
    }

    // 2. Also check any additional environment admin emails
    const adminEmails = getAuthorizedAdminEmails();
    for (const adminEmail of adminEmails) {
      try {
        const userRecord = await auth.getUserByEmail(adminEmail);
        if (userRecord && userRecord.uid) {
          const userDocRef = db.collection("users").doc(userRecord.uid);
          const userSnap = await userDocRef.get();

          if (!userSnap.exists || userSnap.data()?.role !== "ADMIN") {
            const nowIso = new Date().toISOString();
            await userDocRef.set(
              {
                uid: userRecord.uid,
                name: userRecord.displayName || "Administrator",
                email: adminEmail,
                role: "ADMIN",
                updatedAt: nowIso,
                ...(userSnap.exists ? {} : { createdAt: nowIso }),
              },
              { merge: true }
            );
            console.log(`[Admin Bootstrap] Promoted users/${userRecord.uid} (${adminEmail}) to ADMIN`);
          }
        }
      } catch {
        // User with this email might not have registered yet in Auth, which is fine
      }
    }
  } catch (err) {
    console.error("[Admin Bootstrap Error]", err);
  }
}
