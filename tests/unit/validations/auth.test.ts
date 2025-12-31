import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  tfaSchema,
} from "@/lib/validations/auth";

describe("Auth Validations", () => {
  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const validData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
      acceptTerms: true,
    };

    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject short first name", () => {
      const result = registerSchema.safeParse({
        ...validData,
        firstName: "J",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "12345",
        confirmPassword: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: "different",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("should reject unaccepted terms", () => {
      const result = registerSchema.safeParse({
        ...validData,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should accept valid reset data", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token-123",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        password: "newpassword123",
        confirmPassword: "different",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should accept valid password update", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty current password", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short new password", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("tfaSchema", () => {
    it("should accept valid 6-digit code", () => {
      const result = tfaSchema.safeParse({ code: "123456" });
      expect(result.success).toBe(true);
    });

    it("should reject code with wrong length", () => {
      const result = tfaSchema.safeParse({ code: "12345" });
      expect(result.success).toBe(false);
    });

    it("should reject code with 7 digits", () => {
      const result = tfaSchema.safeParse({ code: "1234567" });
      expect(result.success).toBe(false);
    });
  });
});
