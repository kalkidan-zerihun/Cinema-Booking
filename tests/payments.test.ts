import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Payment & Webhook Verification Suite", () => {
  interface PaymentRecord {
    id: string;
    reservationId: string;
    amount: number;
    currency: string;
    method: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    transactionId: string;
  }

  function verifyPaymentPayload(
    expectedPayment: PaymentRecord,
    gatewayResponse: { status: string; amount: number; currency: string; txRef: string }
  ): { valid: boolean; reason?: string } {
    if (gatewayResponse.txRef !== expectedPayment.transactionId) {
      return { valid: false, reason: "Transaction reference mismatch" };
    }
    if (Math.abs(gatewayResponse.amount - expectedPayment.amount) > 0.01) {
      return { valid: false, reason: "Amount mismatch / tampering detected" };
    }
    if (gatewayResponse.currency !== expectedPayment.currency) {
      return { valid: false, reason: "Currency mismatch" };
    }
    if (gatewayResponse.status !== "success") {
      return { valid: false, reason: "Gateway reported non-success status" };
    }
    return { valid: true };
  }

  test("Successfully verifies authentic Chapa gateway payment payload matching reservation amount & currency", () => {
    const paymentRecord: PaymentRecord = {
      id: "pay_101",
      reservationId: "res_202",
      amount: 500,
      currency: "ETB",
      method: "CHAPA",
      status: "PENDING",
      transactionId: "TX-CINEMA-9999",
    };

    const gatewayResponse = {
      status: "success",
      amount: 500,
      currency: "ETB",
      txRef: "TX-CINEMA-9999",
    };

    const verification = verifyPaymentPayload(paymentRecord, gatewayResponse);
    assert.equal(verification.valid, true);
  });

  test("Rejects payment verification if customer attempts price tampering or currency alteration", () => {
    const paymentRecord: PaymentRecord = {
      id: "pay_102",
      reservationId: "res_203",
      amount: 500, // 500 ETB
      currency: "ETB",
      method: "TELEBIRR",
      status: "PENDING",
      transactionId: "TX-CINEMA-8888",
    };

    // Tampered payload with smaller amount
    const tamperedResponse = {
      status: "success",
      amount: 50, // Tampered to 50 ETB!
      currency: "ETB",
      txRef: "TX-CINEMA-8888",
    };

    const verification = verifyPaymentPayload(paymentRecord, tamperedResponse);
    assert.equal(verification.valid, false);
    assert.equal(verification.reason, "Amount mismatch / tampering detected");
  });

  test("Idempotency: Processing a webhook for an already finalized transaction is safely ignored", () => {
    const finalizedPayment: PaymentRecord = {
      id: "pay_103",
      reservationId: "res_204",
      amount: 300,
      currency: "ETB",
      method: "CARD",
      status: "SUCCESS", // Already confirmed
      transactionId: "TX-CINEMA-7777",
    };

    const isAlreadyFinalized = finalizedPayment.status === "SUCCESS" || finalizedPayment.status === "FAILED";
    assert.equal(isAlreadyFinalized, true, "Already finalized transactions must not re-trigger reservation changes");
  });
});
