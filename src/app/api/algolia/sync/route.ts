import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fullSyncForUser } from "@/lib/algolia";
import { validateAlgoliaConfig } from "@/lib/algolia/config";
import { logger } from "@/lib/logger";

/**
 * POST /api/algolia/sync
 *
 * Sync current user's data to Algolia.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate Algolia configuration
  const validation = validateAlgoliaConfig();
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Algolia not configured", missing: validation.missing },
      { status: 500 }
    );
  }

  try {
    const stats = await fullSyncForUser(session.user.id);

    logger.info(`Algolia sync completed for user ${session.user.id}`);
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error(`Failed to sync user data to Algolia: ${error}`);
    return NextResponse.json(
      { error: "Failed to sync data", details: String(error) },
      { status: 500 }
    );
  }
}
