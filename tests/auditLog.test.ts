import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Admin Audit Logging & Data Protection Suite", () => {
  function sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
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
      sanitized[key] = value;
    }
    return sanitized;
  }

  test("Sanitizes sensitive security fields (passwords, secrets, tokens) before storing audit log", () => {
    const rawInput = {
      action: "USER_PROMOTED_ADMIN",
      targetEmail: "admin@kalicinema.com",
      password: "SuperSecretPassword123!",
      apiSecretKey: "chapa_sec_key_xyz",
      bearerToken: "eyJh...",
      userRole: "ADMIN",
    };

    const sanitized = sanitizeAuditDetails(rawInput);

    assert.equal(sanitized.targetEmail, "admin@kalicinema.com");
    assert.equal(sanitized.userRole, "ADMIN");
    assert.equal(sanitized.password, undefined, "Password must be stripped from audit log");
    assert.equal(sanitized.apiSecretKey, undefined, "Secret key must be stripped from audit log");
    assert.equal(sanitized.bearerToken, undefined, "Token must be stripped from audit log");
  });
});
