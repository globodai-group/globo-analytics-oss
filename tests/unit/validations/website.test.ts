import { describe, it, expect } from "vitest";
import {
  createWebsiteSchema,
  updateWebsiteSchema,
  validateWebsitePasswordSchema,
} from "@/lib/validations/website";

describe("Website Validations", () => {
  describe("createWebsiteSchema", () => {
    const validData = {
      domain: "example.com",
      privacy: "0" as const,
      email: false,
      excludeBots: true,
    };

    it("should accept valid website data", () => {
      const result = createWebsiteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept domain with subdomain", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        domain: "blog.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty domain", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        domain: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid domain", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        domain: "not-a-valid-domain",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all privacy levels", () => {
      for (const privacy of ["0", "1", "2"]) {
        const result = createWebsiteSchema.safeParse({
          ...validData,
          privacy,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept optional password", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        privacy: "2",
        password: "secret123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional excludeIps", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        excludeIps: "192.168.1.1,10.0.0.1",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional excludeParams", () => {
      const result = createWebsiteSchema.safeParse({
        ...validData,
        excludeParams: "utm_source,fbclid",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateWebsiteSchema", () => {
    it("should accept partial updates", () => {
      const result = updateWebsiteSchema.safeParse({
        excludeBots: false,
      });
      expect(result.success).toBe(true);
    });

    it("should accept favorite toggle", () => {
      const result = updateWebsiteSchema.safeParse({
        favorite: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateWebsiteSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept privacy update", () => {
      const result = updateWebsiteSchema.safeParse({
        privacy: "1",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid privacy level", () => {
      const result = updateWebsiteSchema.safeParse({
        privacy: "3",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateWebsitePasswordSchema", () => {
    it("should accept valid password validation data", () => {
      const result = validateWebsitePasswordSchema.safeParse({
        websiteId: 123,
        password: "secret",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = validateWebsitePasswordSchema.safeParse({
        websiteId: 123,
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid websiteId type", () => {
      const result = validateWebsitePasswordSchema.safeParse({
        websiteId: "not-a-number",
        password: "secret",
      });
      expect(result.success).toBe(false);
    });
  });
});
