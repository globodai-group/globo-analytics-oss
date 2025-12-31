import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  addDomainSchema,
} from "@/lib/validations/project";

describe("Project Validations", () => {
  describe("createProjectSchema", () => {
    const validData = {
      name: "My Project",
      platform: "web" as const,
      privacy: "0" as const,
      excludeBots: true,
      sessionTimeout: 30,
      engagementThreshold: 10,
    };

    it("should accept valid project data", () => {
      const result = createProjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid platform", () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        platform: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all valid platforms", () => {
      for (const platform of ["web", "mobile", "both"]) {
        const result = createProjectSchema.safeParse({
          ...validData,
          platform,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept all valid privacy levels", () => {
      for (const privacy of ["0", "1", "2"]) {
        const result = createProjectSchema.safeParse({
          ...validData,
          privacy,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject session timeout below 1", () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        sessionTimeout: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject session timeout above 60", () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        sessionTimeout: 61,
      });
      expect(result.success).toBe(false);
    });

    it("should reject engagement threshold above 300", () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        engagementThreshold: 301,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("should accept partial updates", () => {
      const result = updateProjectSchema.safeParse({
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    it("should accept favorite toggle", () => {
      const result = updateProjectSchema.safeParse({
        favorite: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("addDomainSchema", () => {
    it("should accept valid domain", () => {
      const result = addDomainSchema.safeParse({
        domain: "example.com",
        type: "primary",
      });
      expect(result.success).toBe(true);
    });

    it("should accept subdomain", () => {
      const result = addDomainSchema.safeParse({
        domain: "app.example.com",
        type: "secondary",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid domain format", () => {
      const result = addDomainSchema.safeParse({
        domain: "not a domain",
        type: "primary",
      });
      expect(result.success).toBe(false);
    });

    it("should reject domain starting with hyphen", () => {
      const result = addDomainSchema.safeParse({
        domain: "-invalid.com",
        type: "primary",
      });
      expect(result.success).toBe(false);
    });

    it("should reject domain without TLD", () => {
      const result = addDomainSchema.safeParse({
        domain: "localhost",
        type: "primary",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid type", () => {
      const result = addDomainSchema.safeParse({
        domain: "example.com",
        type: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });
});
