import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, eachDayOfInterval, format } from "date-fns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Check project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Parse date range from query
  const searchParams = request.nextUrl.searchParams;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const endDate = toParam ? new Date(toParam) : new Date();
  const startDate = fromParam ? new Date(fromParam) : subDays(endDate, 30);

  // Generate all dates in range
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch daily stats
  const [dailyUsers, dailySessions] = await Promise.all([
    // Daily unique users
    prisma.visitor.groupBy({
      by: ["firstSeenAt"],
      where: {
        projectId,
        firstSeenAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    }),
    // Daily sessions
    prisma.projectSession.groupBy({
      by: ["startedAt"],
      where: {
        projectId,
        startedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      _sum: { pageviews: true },
    }),
  ]);

  // Build date-indexed maps
  const usersMap = new Map<string, number>();
  const sessionsMap = new Map<string, number>();
  const pageviewsMap = new Map<string, number>();

  for (const u of dailyUsers) {
    const date = format(new Date(u.firstSeenAt), "yyyy-MM-dd");
    usersMap.set(date, (usersMap.get(date) || 0) + u._count.id);
  }

  for (const s of dailySessions) {
    const date = format(new Date(s.startedAt), "yyyy-MM-dd");
    sessionsMap.set(date, (sessionsMap.get(date) || 0) + s._count.id);
    pageviewsMap.set(
      date,
      (pageviewsMap.get(date) || 0) + (s._sum.pageviews || 0),
    );
  }

  // Build chart data
  const chartData = dateRange.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MMM dd");
    return {
      date: displayDate,
      users: usersMap.get(dateKey) || 0,
      sessions: sessionsMap.get(dateKey) || 0,
      pageviews: pageviewsMap.get(dateKey) || 0,
    };
  });

  return NextResponse.json(chartData);
}
