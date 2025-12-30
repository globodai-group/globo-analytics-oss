import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        domains: {
          orderBy: { type: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      trackingId: project.trackingId,
      platform: project.platform,
      privacy: project.privacy,
      excludeBots: project.excludeBots,
      sessionTimeout: project.sessionTimeout,
      engagementThreshold: project.engagementThreshold,
      usersMonth: project.usersMonth,
      sessionsMonth: project.sessionsMonth,
      pageviewsMonth: project.pageviewsMonth,
      favoritedAt: project.favoritedAt,
      createdAt: project.createdAt,
      domains: project.domains.map((d) => ({
        id: d.id,
        domain: d.domain,
        type: d.type,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logError(error, { context: "api", operation: "getProject" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
