import { NextRequest, NextResponse } from "next/server";
import { initializeAlgoliaIndices } from "@/lib/algolia";
import { validateAlgoliaConfig } from "@/lib/algolia/config";
import { logger } from "@/lib/logger";

/**
 * POST /api/algolia/init
 *
 * Initialize Algolia indices with proper settings.
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate Algolia configuration
  const validation = validateAlgoliaConfig();
  if (!validation.valid) {
    logger.error(`Algolia not configured. Missing: ${validation.missing.join(", ")}`);
    return NextResponse.json(
      { error: "Algolia not configured", missing: validation.missing },
      { status: 500 }
    );
  }

  try {
    await initializeAlgoliaIndices();

    logger.info("Algolia indices initialized successfully");
    return NextResponse.json({
      success: true,
      message: "Algolia indices initialized",
    });
  } catch (error) {
    logger.error(`Failed to initialize Algolia indices: ${error}`);
    return NextResponse.json(
      { error: "Failed to initialize indices", details: String(error) },
      { status: 500 }
    );
  }
}
