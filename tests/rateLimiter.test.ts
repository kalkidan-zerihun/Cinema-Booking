import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Rate Limiting Middleware Logic Suite", () => {
  class InMemoryRateLimiter {
    private requests = new Map<string, number[]>();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
      this.windowMs = windowMs;
      this.maxRequests = maxRequests;
    }

    public check(ip: string): { allowed: boolean; remaining: number } {
      const now = Date.now();
      const timestamps = (this.requests.get(ip) || []).filter((t) => now - t < this.windowMs);

      if (timestamps.length >= this.maxRequests) {
        this.requests.set(ip, timestamps);
        return { allowed: false, remaining: 0 };
      }

      timestamps.push(now);
      this.requests.set(ip, timestamps);
      return { allowed: true, remaining: this.maxRequests - timestamps.length };
    }
  }

  test("Allows requests within acceptable threshold and blocks excessive bursts", () => {
    const limiter = new InMemoryRateLimiter(60 * 1000, 5); // 5 requests per minute
    const clientIp = "192.168.1.100";

    for (let i = 0; i < 5; i++) {
      const result = limiter.check(clientIp);
      assert.equal(result.allowed, true, `Request ${i + 1} should be allowed`);
    }

    // 6th request should be blocked
    const blockedResult = limiter.check(clientIp);
    assert.equal(blockedResult.allowed, false, "Request exceeding limit should be blocked");
    assert.equal(blockedResult.remaining, 0);
  });
});
