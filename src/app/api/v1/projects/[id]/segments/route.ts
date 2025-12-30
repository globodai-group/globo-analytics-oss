import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/projects/:id/segments
 * Get all segments for a project (user's own + shared)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdStr } = await context.params;
    const projectId = parseInt(projectIdStr);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get segments: user's own + shared
    const segments = await prisma.segment.findMany({
      where: {
        projectId,
        OR: [{ userId: session.user.id }, { isShared: true }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        conditions: true,
        isShared: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Transform for frontend
    const transformedSegments = segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      conditions: segment.conditions,
      matchType: (segment.conditions as { type?: string })?.type === "OR" ? "any" : "all",
      isShared: segment.isShared,
      createdAt: segment.createdAt,
      isOwner: segment.user.id === session.user.id,
    }));

    return NextResponse.json({ segments: transformedSegments });
  } catch (error) {
    logError(error, { context: "api", operation: "getSegments" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
