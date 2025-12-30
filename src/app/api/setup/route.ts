import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  licenseKey: z.string().optional(),
});

/**
 * POST /api/setup
 * Create the first admin user (only works if no users exist)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Users already exist." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, licenseKey } = parsed.data;

    // Check if email already exists (shouldn't happen but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(), // Auto-verify for setup
        canTrack: true,
      },
    });

    // If license key provided, save it to settings or environment hint
    if (licenseKey) {
      // Store license key in settings table for reference
      await prisma.setting.upsert({
        where: { name: "license_key" },
        update: { value: licenseKey },
        create: { name: "license_key", value: licenseKey },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup
 * Check if setup is needed
 */
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      needsSetup: userCount === 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}
