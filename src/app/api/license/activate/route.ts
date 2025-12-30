/**
 * License Activation API
 *
 * POST /api/license/activate
 *
 * Activates a license key for this instance.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activateLicense } from "@/lib/license";
import { logger } from "@/lib/logger";
import { z } from "zod";

const activateSchema = z.object({
  licenseKey: z
    .string()
    .min(20, "Invalid license key format")
    .regex(/^GLOB-(COMMUNITY|PRO|ENTERPRISE)-/i, "Invalid license key format"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role (only admins can activate licenses)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid license key" },
        { status: 400 }
      );
    }

    const { licenseKey } = parsed.data;

    // Attempt activation
    const result = await activateLicense(licenseKey);

    if (!result.valid) {
      logger.warn({
        type: "license",
        event: "activation_failed",
        error: result.error,
        userId: session.user.id,
      });

      return NextResponse.json(
        { error: result.error || "License activation failed" },
        { status: 400 }
      );
    }

    logger.info({
      type: "license",
      event: "activated",
      tier: result.license?.data.tier,
      organization: result.license?.data.organization,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      license: {
        tier: result.license?.data.tier,
        tierName:
          result.license?.data.tier === "pro"
            ? "Pro"
            : result.license?.data.tier === "enterprise"
              ? "Enterprise"
              : "Community",
        organization: result.license?.data.organization,
        features: result.license?.data.features,
        expiresAt: result.license?.data.expiresAt,
        daysRemaining: result.license?.daysRemaining,
      },
    });
  } catch (error) {
    logger.error({
      type: "api",
      event: "license_activation_error",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Failed to activate license" }, { status: 500 });
  }
}
