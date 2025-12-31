import { describe, it, expect } from "vitest";
import {
  generateSecretKey,
  signPayload,
  verifySignature,
  createCanonicalPayload,
} from "@/lib/security/hmac";

describe("HMAC Security", () => {
  describe("generateSecretKey", () => {
    it("should generate a 64-character hex string", () => {
      const key = generateSecretKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[a-f0-9]+$/);
    });

    it("should generate unique keys each time", () => {
      const key1 = generateSecretKey();
      const key2 = generateSecretKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("signPayload", () => {
    it("should return a 64-character hex signature", () => {
      const payload = "test-payload";
      const secretKey = generateSecretKey();
      const signature = signPayload(payload, secretKey);

      expect(signature).toHaveLength(64);
      expect(signature).toMatch(/^[a-f0-9]+$/);
    });

    it("should produce consistent signatures for same input", () => {
      const payload = "test-payload";
      const secretKey = generateSecretKey();

      const sig1 = signPayload(payload, secretKey);
      const sig2 = signPayload(payload, secretKey);

      expect(sig1).toBe(sig2);
    });

    it("should produce different signatures for different payloads", () => {
      const secretKey = generateSecretKey();

      const sig1 = signPayload("payload-1", secretKey);
      const sig2 = signPayload("payload-2", secretKey);

      expect(sig1).not.toBe(sig2);
    });

    it("should produce different signatures for different keys", () => {
      const payload = "test-payload";

      const sig1 = signPayload(payload, generateSecretKey());
      const sig2 = signPayload(payload, generateSecretKey());

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifySignature", () => {
    it("should return true for valid signature", () => {
      const payload = "test-payload";
      const secretKey = generateSecretKey();
      const signature = signPayload(payload, secretKey);

      expect(verifySignature(payload, signature, secretKey)).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const payload = "test-payload";
      const secretKey = generateSecretKey();
      const invalidSignature = "a".repeat(64);

      expect(verifySignature(payload, invalidSignature, secretKey)).toBe(false);
    });

    it("should return false for wrong secret key", () => {
      const payload = "test-payload";
      const secretKey1 = generateSecretKey();
      const secretKey2 = generateSecretKey();
      const signature = signPayload(payload, secretKey1);

      expect(verifySignature(payload, signature, secretKey2)).toBe(false);
    });

    it("should return false for modified payload", () => {
      const secretKey = generateSecretKey();
      const signature = signPayload("original-payload", secretKey);

      expect(verifySignature("modified-payload", signature, secretKey)).toBe(
        false,
      );
    });

    it("should return false for empty signature", () => {
      expect(verifySignature("payload", "", generateSecretKey())).toBe(false);
    });

    it("should return false for wrong length signature", () => {
      expect(verifySignature("payload", "short", generateSecretKey())).toBe(
        false,
      );
    });

    it("should return false for empty secret key", () => {
      const payload = "test-payload";
      const signature = "a".repeat(64);

      expect(verifySignature(payload, signature, "")).toBe(false);
    });
  });

  describe("createCanonicalPayload", () => {
    it("should create pipe-separated payload string", () => {
      const data = {
        tid: "project-123",
        cid: "visitor-456",
        t: "pageview",
        dp: "/home",
        ts: 1704067200000,
      };

      const payload = createCanonicalPayload(data);

      expect(payload).toBe(
        "project-123|visitor-456|pageview|/home|1704067200000",
      );
    });

    it("should handle missing optional fields", () => {
      const data = {
        tid: "project-123",
        cid: "visitor-456",
        t: "pageview",
      };

      const payload = createCanonicalPayload(data);

      // Should have empty dp and auto-generated timestamp
      expect(payload).toMatch(/^project-123\|visitor-456\|pageview\|\|\d+$/);
    });

    it("should produce consistent output for same input", () => {
      const data = {
        tid: "project-123",
        cid: "visitor-456",
        t: "event",
        dp: "/page",
        ts: 1704067200000,
      };

      const payload1 = createCanonicalPayload(data);
      const payload2 = createCanonicalPayload(data);

      expect(payload1).toBe(payload2);
    });
  });
});
