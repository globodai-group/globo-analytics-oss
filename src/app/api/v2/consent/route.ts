import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logError } from "@/lib/logger";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, analytics, marketing, preferences, expires, consentedAt } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find project by tracking ID
    const project = await prisma.project.findUnique({
      where: { trackingId: projectId },
      include: { consentConfig: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate visitor ID from request
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Create a privacy-friendly hash for the visitor
    const visitorData = `${ip}-${userAgent}-${project.id}`;
    const visitorId = crypto
      .createHash("sha256")
      .update(visitorData)
      .digest("hex")
      .substring(0, 32);

    // Hash the IP for proof of consent
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);

    // Calculate expiration
    const expiresAt = expires ? new Date(expires) : null;
    const consentedAtDate = consentedAt ? new Date(consentedAt) : new Date();

    // Upsert visitor consent
    await prisma.visitorConsent.upsert({
      where: {
        projectId_visitorId: {
          projectId: project.id,
          visitorId,
        },
      },
      update: {
        analytics: analytics ?? false,
        marketing: marketing ?? false,
        preferences: preferences ?? false,
        consentedAt: consentedAtDate,
        expiresAt,
        ipHash,
      },
      create: {
        projectId: project.id,
        visitorId,
        analytics: analytics ?? false,
        marketing: marketing ?? false,
        preferences: preferences ?? false,
        consentedAt: consentedAtDate,
        expiresAt,
        ipHash,
      },
    });

    return NextResponse.json({ success: true, visitorId }, { headers: corsHeaders });
  } catch (error) {
    logError(error, { context: "consent", operation: "post" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET endpoint to check consent status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const visitorId = searchParams.get("visitorId");

    if (!projectId || !visitorId) {
      return NextResponse.json(
        { error: "Project ID and Visitor ID required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find project by tracking ID
    const project = await prisma.project.findUnique({
      where: { trackingId: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const consent = await prisma.visitorConsent.findUnique({
      where: {
        projectId_visitorId: {
          projectId: project.id,
          visitorId,
        },
      },
      select: {
        analytics: true,
        marketing: true,
        preferences: true,
        consentedAt: true,
        expiresAt: true,
      },
    });

    if (!consent) {
      return NextResponse.json({ hasConsent: false }, { headers: corsHeaders });
    }

    // Check if consent has expired
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return NextResponse.json({ hasConsent: false, expired: true }, { headers: corsHeaders });
    }

    return NextResponse.json(
      {
        hasConsent: true,
        analytics: consent.analytics,
        marketing: consent.marketing,
        preferences: consent.preferences,
        consentedAt: consent.consentedAt,
        expiresAt: consent.expiresAt,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    logError(error, { context: "consent", operation: "get" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
