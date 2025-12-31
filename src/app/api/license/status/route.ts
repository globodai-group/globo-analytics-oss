/**
 * License Status API
 *
 * GET /api/license/status
 *
 * Returns the current license status including:
 * - Tier (community/pro/enterprise)
 * - Features available
 * - Usage limits
 * - Expiration info
 */

import { NextResponse } from "next/server";
import { getLicenseStatus } from "@/lib/license";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const status = await getLicenseStatus();

    return NextResponse.json(status);
  } catch (error) {
    logger.error({
      type: "api",
      event: "license_status_error",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Failed to get license status" },
      { status: 500 },
    );
  }
}
