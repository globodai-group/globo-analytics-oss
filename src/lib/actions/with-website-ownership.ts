import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Website } from "@prisma/client";

/**
 * Verify that a user owns a website
 * Centralized function to eliminate duplicate implementations across action files
 */
export async function verifyWebsiteOwnership(
  websiteId: number,
  userId: string,
): Promise<Website | null> {
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId },
  });
  return website;
}

/**
 * Simple boolean check for website ownership
 * For backwards compatibility with existing code
 */
export async function hasWebsiteAccess(websiteId: number): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const website = await verifyWebsiteOwnership(websiteId, session.user.id);
  return !!website;
}

/**
 * Convenience wrapper that combines auth check and ownership verification
 * Returns { authorized: true, website, userId } or { authorized: false }
 */
export async function checkWebsiteAccess(
  websiteId: number,
): Promise<
  | { authorized: true; website: Website; userId: string }
  | { authorized: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized" };
  }

  const website = await verifyWebsiteOwnership(websiteId, session.user.id);
  if (!website) {
    return { authorized: false, error: "Website not found" };
  }

  return { authorized: true, website, userId: session.user.id };
}
