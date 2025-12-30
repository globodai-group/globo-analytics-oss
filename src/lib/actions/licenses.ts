"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Helper to check admin access
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Generate a unique license key
function generateLicenseKey(type: "PRO" | "ENTERPRISE"): string {
  const prefix = type === "ENTERPRISE" ? "GLOB-ENT" : "GLOB-PRO";
  const randomPart = crypto.randomBytes(12).toString("hex").toUpperCase();
  // Format: GLOB-PRO-XXXX-XXXX-XXXX-XXXX
  const formatted = randomPart.match(/.{1,4}/g)?.join("-") || randomPart;
  return `${prefix}-${formatted}`;
}

// Get all licenses
export async function getLicensesAction() {
  await requireAdmin();

  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { activationLogs: true },
      },
    },
  });

  return { success: true, data: licenses };
}

// Get license by ID with activation logs
export async function getLicenseByIdAction(id: number) {
  await requireAdmin();

  const license = await prisma.license.findUnique({
    where: { id },
    include: {
      activationLogs: {
        orderBy: { activatedAt: "desc" },
        take: 50,
      },
    },
  });

  if (!license) {
    return { success: false, error: "License not found" };
  }

  return { success: true, data: license };
}

// Get license statistics
export async function getLicenseStatsAction() {
  await requireAdmin();

  const [total, active, pro, enterprise] = await Promise.all([
    prisma.license.count(),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.license.count({ where: { type: "PRO", status: "ACTIVE" } }),
    prisma.license.count({ where: { type: "ENTERPRISE", status: "ACTIVE" } }),
  ]);

  return {
    success: true,
    data: { total, active, pro, enterprise },
  };
}

// Create a new license
export async function createLicenseAction(data: {
  type: "PRO" | "ENTERPRISE";
  customerEmail: string;
  customerName?: string;
  companyName?: string;
  maxDomains?: number;
  maxActivations?: number;
  expiresAt?: Date | null;
  notes?: string;
}) {
  await requireAdmin();

  // Generate unique license key
  let licenseKey = generateLicenseKey(data.type);

  // Ensure uniqueness
  let exists = await prisma.license.findUnique({
    where: { licenseKey },
  });

  while (exists) {
    licenseKey = generateLicenseKey(data.type);
    exists = await prisma.license.findUnique({
      where: { licenseKey },
    });
  }

  const license = await prisma.license.create({
    data: {
      licenseKey,
      type: data.type,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      companyName: data.companyName,
      maxDomains: data.maxDomains || 1,
      maxActivations: data.maxActivations || 1,
      expiresAt: data.expiresAt,
      notes: data.notes,
    },
  });

  revalidatePath("/admin/licenses");

  return { success: true, data: license };
}

// Update a license
export async function updateLicenseAction(
  id: number,
  data: {
    customerEmail?: string;
    customerName?: string;
    companyName?: string;
    maxDomains?: number;
    maxActivations?: number;
    expiresAt?: Date | null;
    notes?: string;
  }
) {
  await requireAdmin();

  const license = await prisma.license.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/licenses");
  revalidatePath(`/admin/licenses/${id}`);

  return { success: true, data: license };
}

// Revoke a license
export async function revokeLicenseAction(id: number) {
  await requireAdmin();

  const license = await prisma.license.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  revalidatePath("/admin/licenses");

  return { success: true, data: license };
}

// Suspend a license
export async function suspendLicenseAction(id: number) {
  await requireAdmin();

  const license = await prisma.license.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/admin/licenses");

  return { success: true, data: license };
}

// Reactivate a license
export async function reactivateLicenseAction(id: number) {
  await requireAdmin();

  const license = await prisma.license.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin/licenses");

  return { success: true, data: license };
}

// Delete a license (hard delete)
export async function deleteLicenseAction(id: number) {
  await requireAdmin();

  await prisma.license.delete({
    where: { id },
  });

  revalidatePath("/admin/licenses");

  return { success: true };
}

// Verify license (called by OSS instances)
export async function verifyLicenseAction(licenseKey: string, domain: string) {
  const license = await prisma.license.findUnique({
    where: { licenseKey },
  });

  if (!license) {
    return { success: false, error: "Invalid license key" };
  }

  if (license.status !== "ACTIVE") {
    return { success: false, error: `License is ${license.status.toLowerCase()}` };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    // Auto-expire the license
    await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "License has expired" };
  }

  // Check activation limits
  const activeActivations = await prisma.licenseActivation.count({
    where: { licenseId: license.id, isActive: true },
  });

  // Check if this domain is already activated
  const existingActivation = await prisma.licenseActivation.findFirst({
    where: { licenseId: license.id, domain },
  });

  if (!existingActivation && activeActivations >= license.maxActivations) {
    return { success: false, error: "Maximum activations reached" };
  }

  return {
    success: true,
    data: {
      type: license.type,
      features: getFeaturesByType(license.type),
      expiresAt: license.expiresAt,
    },
  };
}

// Activate license (called by OSS instances on startup)
export async function activateLicenseAction(
  licenseKey: string,
  domain: string,
  ipAddress?: string,
  instanceId?: string,
  version?: string
) {
  const license = await prisma.license.findUnique({
    where: { licenseKey },
  });

  if (!license || license.status !== "ACTIVE") {
    return { success: false, error: "Invalid or inactive license" };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return { success: false, error: "License has expired" };
  }

  // Check if domain already activated
  const existingActivation = await prisma.licenseActivation.findFirst({
    where: { licenseId: license.id, domain },
  });

  if (existingActivation) {
    // Update last seen
    await prisma.licenseActivation.update({
      where: { id: existingActivation.id },
      data: { lastSeenAt: new Date(), version },
    });
  } else {
    // Check limits before new activation
    const activeCount = await prisma.licenseActivation.count({
      where: { licenseId: license.id, isActive: true },
    });

    if (activeCount >= license.maxActivations) {
      return { success: false, error: "Maximum activations reached" };
    }

    // Create new activation
    await prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        domain,
        ipAddress,
        instanceId,
        version,
      },
    });
  }

  // Update license usage stats
  await prisma.license.update({
    where: { id: license.id },
    data: {
      activations: { increment: existingActivation ? 0 : 1 },
      lastActivatedAt: new Date(),
      lastActivatedIp: ipAddress,
      lastActivatedDomain: domain,
    },
  });

  return {
    success: true,
    data: {
      type: license.type,
      features: getFeaturesByType(license.type),
      expiresAt: license.expiresAt,
    },
  };
}

// Helper to get features by license type
function getFeaturesByType(type: "COMMUNITY" | "PRO" | "ENTERPRISE") {
  const features = {
    COMMUNITY: {
      heatmaps: false,
      sessionRecording: false,
      botDetection: false,
      aiInsights: false,
      unlimitedGoals: false,
      abTesting: false,
      retentionAnalysis: false,
      pdfExport: false,
      whiteLabel: false,
      sso: false,
    },
    PRO: {
      heatmaps: true,
      sessionRecording: true,
      botDetection: true,
      aiInsights: false,
      unlimitedGoals: true,
      abTesting: true,
      retentionAnalysis: true,
      pdfExport: true,
      whiteLabel: false,
      sso: false,
    },
    ENTERPRISE: {
      heatmaps: true,
      sessionRecording: true,
      botDetection: true,
      aiInsights: true,
      unlimitedGoals: true,
      abTesting: true,
      retentionAnalysis: true,
      pdfExport: true,
      whiteLabel: true,
      sso: true,
    },
  };

  return features[type];
}
