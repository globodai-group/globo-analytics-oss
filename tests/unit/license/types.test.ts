import { describe, it, expect } from "vitest";
import {
  TIER_FEATURES,
  TIER_LIMITS,
  TIER_NAMES,
  FEATURE_NAMES,
  type LicenseTier,
  type LicenseFeature,
} from "@/lib/license/types";

describe("License Types", () => {
  describe("TIER_FEATURES", () => {
    it("should define community tier features", () => {
      expect(TIER_FEATURES.community).toContain("analytics_basic");
      expect(TIER_FEATURES.community).toContain("pageviews");
      expect(TIER_FEATURES.community).toContain("export_csv");
    });

    it("should include community features in pro tier", () => {
      const communityFeatures = TIER_FEATURES.community;
      communityFeatures.forEach((feature) => {
        expect(TIER_FEATURES.pro).toContain(feature);
      });
    });

    it("should include pro features only in pro and enterprise", () => {
      const proOnlyFeatures: LicenseFeature[] = [
        "heatmaps",
        "session_recording",
        "ab_testing",
      ];
      proOnlyFeatures.forEach((feature) => {
        expect(TIER_FEATURES.community).not.toContain(feature);
        expect(TIER_FEATURES.pro).toContain(feature);
        expect(TIER_FEATURES.enterprise).toContain(feature);
      });
    });

    it("should include enterprise features only in enterprise tier", () => {
      const enterpriseOnlyFeatures: LicenseFeature[] = [
        "sso_saml",
        "white_label",
        "ai_insights",
      ];
      enterpriseOnlyFeatures.forEach((feature) => {
        expect(TIER_FEATURES.community).not.toContain(feature);
        expect(TIER_FEATURES.pro).not.toContain(feature);
        expect(TIER_FEATURES.enterprise).toContain(feature);
      });
    });

    it("should have enterprise tier include all features from lower tiers", () => {
      const allLowerTierFeatures = [
        ...TIER_FEATURES.community,
        ...TIER_FEATURES.pro,
      ];
      const uniqueFeatures = [...new Set(allLowerTierFeatures)];
      uniqueFeatures.forEach((feature) => {
        expect(TIER_FEATURES.enterprise).toContain(feature);
      });
    });
  });

  describe("TIER_LIMITS", () => {
    it("should define community limits", () => {
      expect(TIER_LIMITS.community.maxDomains).toBe(3);
      expect(TIER_LIMITS.community.maxPageviews).toBe(10000);
      expect(TIER_LIMITS.community.maxUsers).toBe(1);
    });

    it("should define pro limits", () => {
      expect(TIER_LIMITS.pro.maxDomains).toBe(10);
      expect(TIER_LIMITS.pro.maxPageviews).toBe(1000000);
      expect(TIER_LIMITS.pro.maxUsers).toBe(10);
    });

    it("should define enterprise as unlimited (0)", () => {
      expect(TIER_LIMITS.enterprise.maxDomains).toBe(0);
      expect(TIER_LIMITS.enterprise.maxPageviews).toBe(0);
      expect(TIER_LIMITS.enterprise.maxUsers).toBe(0);
    });

    it("should have increasing limits from community to pro", () => {
      expect(TIER_LIMITS.pro.maxDomains).toBeGreaterThan(
        TIER_LIMITS.community.maxDomains,
      );
      expect(TIER_LIMITS.pro.maxPageviews).toBeGreaterThan(
        TIER_LIMITS.community.maxPageviews,
      );
      expect(TIER_LIMITS.pro.maxUsers).toBeGreaterThan(
        TIER_LIMITS.community.maxUsers,
      );
    });
  });

  describe("TIER_NAMES", () => {
    it("should have names for all tiers", () => {
      const tiers: LicenseTier[] = ["community", "pro", "enterprise"];
      tiers.forEach((tier) => {
        expect(TIER_NAMES[tier]).toBeDefined();
        expect(TIER_NAMES[tier].en).toBeDefined();
        expect(TIER_NAMES[tier].fr).toBeDefined();
      });
    });

    it("should have correct English names", () => {
      expect(TIER_NAMES.community.en).toBe("Community");
      expect(TIER_NAMES.pro.en).toBe("Pro");
      expect(TIER_NAMES.enterprise.en).toBe("Enterprise");
    });
  });

  describe("FEATURE_NAMES", () => {
    it("should have names for all features in TIER_FEATURES", () => {
      const allFeatures = new Set([
        ...TIER_FEATURES.community,
        ...TIER_FEATURES.pro,
        ...TIER_FEATURES.enterprise,
      ]);

      allFeatures.forEach((feature) => {
        expect(FEATURE_NAMES[feature]).toBeDefined();
        expect(FEATURE_NAMES[feature].en).toBeDefined();
        expect(FEATURE_NAMES[feature].fr).toBeDefined();
      });
    });

    it("should have non-empty feature names", () => {
      Object.values(FEATURE_NAMES).forEach((names) => {
        expect(names.en.length).toBeGreaterThan(0);
        expect(names.fr.length).toBeGreaterThan(0);
      });
    });
  });
});
