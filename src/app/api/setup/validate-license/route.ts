import { NextRequest, NextResponse } from "next/server";
import { validateLicenseOffline } from "@/lib/license/validator";

/**
 * POST /api/setup/validate-license
 * Validate a license key during setup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: "No license key provided" },
        { status: 400 },
      );
    }

    // Validate the license
    const result = await validateLicenseOffline(licenseKey);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error || "Invalid license key" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      tier: result.license?.data.tier,
      organization: result.license?.data.organization,
      features: result.license?.data.features,
      expiresAt: result.license?.data.expiresAt,
    });
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { valid: false, error: "License validation failed" },
      { status: 500 },
    );
  }
}
