import { describe, it, expect } from "vitest";
import {
  generateTotpSecret,
  generateRecoveryCodes,
  getTotpUri,
  verifyRecoveryCode,
} from "@/lib/totp";

describe("TOTP", () => {
  describe("generateTotpSecret", () => {
    it("should generate a base32 encoded secret", () => {
      const secret = generateTotpSecret();
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it("should generate unique secrets", () => {
      const secret1 = generateTotpSecret();
      const secret2 = generateTotpSecret();
      expect(secret1).not.toBe(secret2);
    });

    it("should generate secrets of consistent length", () => {
      const secret = generateTotpSecret();
      // 20 bytes = 32 base32 characters
      expect(secret.length).toBe(32);
    });
  });

  describe("generateRecoveryCodes", () => {
    it("should generate 8 codes by default", () => {
      const codes = generateRecoveryCodes();
      expect(codes).toHaveLength(8);
    });

    it("should generate specified number of codes", () => {
      const codes = generateRecoveryCodes(5);
      expect(codes).toHaveLength(5);
    });

    it("should generate codes in XXXX-XXXX format", () => {
      const codes = generateRecoveryCodes();
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      });
    });

    it("should generate unique codes", () => {
      const codes = generateRecoveryCodes(10);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("getTotpUri", () => {
    it("should generate a valid otpauth URI", () => {
      const secret = generateTotpSecret();
      const uri = getTotpUri(secret, "user@example.com");

      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain("secret=");
      expect(uri).toContain("issuer=");
    });

    it("should include email in the URI", () => {
      const secret = generateTotpSecret();
      const email = "test@example.com";
      const uri = getTotpUri(secret, email);

      expect(uri).toContain(encodeURIComponent(email));
    });
  });

  describe("verifyRecoveryCode", () => {
    const testCodes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"];

    it("should return valid for matching code", () => {
      const result = verifyRecoveryCode(testCodes, "ABCD-1234");
      expect(result.valid).toBe(true);
      expect(result.index).toBe(0);
    });

    it("should return valid for second code", () => {
      const result = verifyRecoveryCode(testCodes, "EFGH-5678");
      expect(result.valid).toBe(true);
      expect(result.index).toBe(1);
    });

    it("should be case-insensitive", () => {
      const result = verifyRecoveryCode(testCodes, "abcd-1234");
      expect(result.valid).toBe(true);
      expect(result.index).toBe(0);
    });

    it("should work without dashes", () => {
      const result = verifyRecoveryCode(testCodes, "ABCD1234");
      expect(result.valid).toBe(true);
      expect(result.index).toBe(0);
    });

    it("should return invalid for non-matching code", () => {
      const result = verifyRecoveryCode(testCodes, "XXXX-XXXX");
      expect(result.valid).toBe(false);
      expect(result.index).toBe(-1);
    });

    it("should return invalid for empty input", () => {
      const result = verifyRecoveryCode(testCodes, "");
      expect(result.valid).toBe(false);
    });

    it("should return invalid for empty codes array", () => {
      const result = verifyRecoveryCode([], "ABCD-1234");
      expect(result.valid).toBe(false);
    });
  });
});
