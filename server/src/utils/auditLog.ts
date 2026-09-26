import { db } from "../firebase.ts";

export interface AuditLogEntry {
  actorUid: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Lightweight, non-blocking audit logging utility for administrative actions.
 * Protects against logging passwords, tokens, or payment secrets.
 */
export async function logAdminAction(
  actorUid: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any> = {},
  actorEmail?: string
): Promise<void> {
  try {
    // Sanitize details to guarantee no sensitive data is stored in audit logs
    const sanitizedDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("credential")
      ) {
        continue;
      }
      sanitizedDetails[key] = value;
    }

    const logEntry: AuditLogEntry = {
      actorUid,
      actorEmail: actorEmail || "admin@cinema.com",
      action,
      resourceType,
      resourceId,
      details: sanitizedDetails,
      timestamp: new Date().toISOString(),
    };

    await db.collection("audit_logs").add(logEntry);
  } catch (err) {
    // Non-blocking: failure in audit logging should not crash the transaction
    console.error("[Audit Log Error] Failed to write audit log:", err);
  }
}
