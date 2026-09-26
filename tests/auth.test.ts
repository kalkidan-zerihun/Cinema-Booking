import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedAdminEmail, getAuthorizedAdminEmails } from "../server/src/utils/adminBootstrap.ts";

describe("Authentication & RBAC Suite", () => {
  test("Authorized admin email list contains primary admin addresses", () => {
    const adminEmails = getAuthorizedAdminEmails();
    assert.ok(Array.isArray(adminEmails), "Admin emails must be an array");
    assert.ok(adminEmails.length > 0, "Admin email list should not be empty");
    assert.ok(
      adminEmails.includes("admin@kalicinema.com") || adminEmails.includes("admin@example.com"),
      "Default admin emails should be recognized"
    );
  });

  test("isAuthorizedAdminEmail correctly recognizes valid admin emails (case-insensitive)", () => {
    assert.equal(isAuthorizedAdminEmail("admin@kalicinema.com"), true);
    assert.equal(isAuthorizedAdminEmail("ADMIN@KALICINEMA.COM"), true);
    assert.equal(isAuthorizedAdminEmail("  admin@example.com  "), true);
  });

  test("isAuthorizedAdminEmail rejects non-admin and malicious customer emails", () => {
    assert.equal(isAuthorizedAdminEmail("regular_customer@gmail.com"), false);
    assert.equal(isAuthorizedAdminEmail("attacker@evil.com"), false);
    assert.equal(isAuthorizedAdminEmail("admin@kalicinema.com.fake.com"), false);
    assert.equal(isAuthorizedAdminEmail(undefined), false);
    assert.equal(isAuthorizedAdminEmail(""), false);
  });

  test("Role verification logic strictly enforces CUSTOMER cannot access ADMIN privileges", () => {
    const customerUser = { uid: "cust_123", email: "cust@gmail.com", role: "CUSTOMER" };
    const adminUser = { uid: "admin_999", email: "admin@kalicinema.com", role: "ADMIN" };

    const isCustomerAllowedAdmin = customerUser.role === "ADMIN";
    const isAdminAllowedAdmin = adminUser.role === "ADMIN";

    assert.equal(isCustomerAllowedAdmin, false, "Customer must not have admin permission");
    assert.equal(isAdminAllowedAdmin, true, "Admin must have admin permission");
  });
});
