import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { subMinutes } from "date-fns";
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

    // Check project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get realtime users (active in last 5 minutes)
    const fiveMinutesAgo = subMinutes(new Date(), 5);

    const realtimeUsers = await prisma.realtimeUser.findMany({
      where: {
        projectId,
        lastPingAt: { gte: fiveMinutesAgo },
      },
      orderBy: { lastPingAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      count: realtimeUsers.length,
      users: realtimeUsers.map((user) => ({
        id: user.id,
        currentPage: user.currentPage,
        currentTitle: user.currentTitle,
        country: user.country,
        city: user.city,
        device: user.device,
        platform: user.platform,
      })),
    });
  } catch (error) {
    logError(error, { context: "api", operation: "realtime" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
