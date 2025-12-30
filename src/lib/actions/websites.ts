"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createWebsiteSchema,
  updateWebsiteSchema,
} from "@/lib/validations/website";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// TODO: Migrate to centralized ActionResult from @/lib/types/actions
interface ActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
}

// Get all websites for the current user
export async function getWebsitesAction(
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  try {
    const websites = await prisma.website.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ favoritedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        url: true,
        domain: true,
        privacy: true,
        excludeBots: true,
        pageviewsMonth: true,
        favoritedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: websites,
    };
  } catch (error) {
    console.error("Error fetching websites:", error);
    return {
      error:
        locale === "fr"
          ? "Erreur lors de la récupération des sites"
          : "Error fetching websites",
    };
  }
}

// Get a single website by ID
export async function getWebsiteAction(
  websiteId: number,
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  try {
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: session.user.id,
      },
    });

    if (!website) {
      return {
        error: locale === "fr" ? "Site non trouvé" : "Website not found",
      };
    }

    return {
      success: true,
      data: website,
    };
  } catch (error) {
    console.error("Error fetching website:", error);
    return {
      error:
        locale === "fr"
          ? "Erreur lors de la récupération du site"
          : "Error fetching website",
    };
  }
}

// Create a new website
export async function createWebsiteAction(
  formData: FormData,
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  const rawData = {
    domain: formData.get("domain") as string,
    privacy: (formData.get("privacy") as string) || "1",
    password: formData.get("password") as string | undefined,
    email: formData.get("email") === "true",
    excludeBots: formData.get("excludeBots") !== "false",
    excludeIps: formData.get("excludeIps") as string | undefined,
    excludeParams: formData.get("excludeParams") as string | undefined,
  };

  const validatedFields = createWebsiteSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { domain, privacy, password, excludeBots, excludeIps, excludeParams } =
    validatedFields.data;

  // Normalize domain
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  const url = `https://${normalizedDomain}`;

  // Check if website already exists for this user
  const existingWebsite = await prisma.website.findFirst({
    where: {
      userId: session.user.id,
      domain: normalizedDomain,
    },
  });

  if (existingWebsite) {
    return {
      error:
        locale === "fr" ? "Ce site existe déjà" : "This website already exists",
    };
  }

  // Check license limits
  const { getLicenseStatus } = await import("@/lib/license/validator");
  const licenseStatus = await getLicenseStatus();
  const maxWebsites = licenseStatus.limits.domains.max;

  if (maxWebsites > 0) {
    const websiteCount = await prisma.website.count({
      where: { userId: session.user.id },
    });

    if (websiteCount >= maxWebsites) {
      return {
        error:
          locale === "fr"
            ? `Vous avez atteint la limite de ${maxWebsites} sites pour votre licence`
            : `You have reached the limit of ${maxWebsites} websites for your license`,
      };
    }
  }

  try {
    // Hash password if privacy is password-protected
    let hashedPassword: string | null = null;
    if (privacy === "2" && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const website = await prisma.website.create({
      data: {
        url,
        domain: normalizedDomain,
        userId: session.user.id,
        privacy: parseInt(privacy),
        password: hashedPassword,
        excludeBots,
        excludeIps: excludeIps || null,
        excludeParams: excludeParams || null,
      },
    });

    // Update user hasWebsites flag
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasWebsites: true },
    });

    revalidatePath("/websites");

    return {
      success: true,
      message:
        locale === "fr"
          ? "Site créé avec succès"
          : "Website created successfully",
      data: { id: website.id },
    };
  } catch (error) {
    console.error("Error creating website:", error);
    return {
      error:
        locale === "fr"
          ? "Erreur lors de la création du site"
          : "Error creating website",
    };
  }
}

// Update a website
export async function updateWebsiteAction(
  websiteId: number,
  formData: FormData,
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  // Check if website exists and belongs to user
  const existingWebsite = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: session.user.id,
    },
  });

  if (!existingWebsite) {
    return {
      error: locale === "fr" ? "Site non trouvé" : "Website not found",
    };
  }

  const rawData = {
    privacy: formData.get("privacy") as string | undefined,
    password: formData.get("password") as string | undefined,
    email: formData.has("email") ? formData.get("email") === "true" : undefined,
    excludeBots: formData.has("excludeBots")
      ? formData.get("excludeBots") === "true"
      : undefined,
    excludeIps: formData.get("excludeIps") as string | undefined,
    excludeParams: formData.get("excludeParams") as string | undefined,
    favorite: formData.has("favorite")
      ? formData.get("favorite") === "true"
      : undefined,
  };

  const validatedFields = updateWebsiteSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const {
    privacy,
    password,
    excludeBots,
    excludeIps,
    excludeParams,
    favorite,
  } = validatedFields.data;

  try {
    const updateData: Record<string, unknown> = {};

    if (privacy !== undefined) {
      updateData.privacy = parseInt(privacy);
    }

    if (privacy === "2" && password) {
      updateData.password = await bcrypt.hash(password, 10);
    } else if (privacy !== "2") {
      updateData.password = null;
    }

    if (excludeBots !== undefined) {
      updateData.excludeBots = excludeBots;
    }

    if (excludeIps !== undefined) {
      updateData.excludeIps = excludeIps || null;
    }

    if (excludeParams !== undefined) {
      updateData.excludeParams = excludeParams || null;
    }

    if (favorite !== undefined) {
      updateData.favoritedAt = favorite ? new Date() : null;
    }

    await prisma.website.update({
      where: { id: websiteId },
      data: updateData,
    });

    revalidatePath("/websites");
    revalidatePath(`/websites/${websiteId}`);

    return {
      success: true,
      message:
        locale === "fr"
          ? "Site mis à jour avec succès"
          : "Website updated successfully",
    };
  } catch (error) {
    console.error("Error updating website:", error);
    return {
      error:
        locale === "fr"
          ? "Erreur lors de la mise à jour du site"
          : "Error updating website",
    };
  }
}

// Delete a website
export async function deleteWebsiteAction(
  websiteId: number,
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  // Check if website exists and belongs to user
  const existingWebsite = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: session.user.id,
    },
  });

  if (!existingWebsite) {
    return {
      error: locale === "fr" ? "Site non trouvé" : "Website not found",
    };
  }

  try {
    await prisma.website.delete({
      where: { id: websiteId },
    });

    // Check if user still has websites
    const websiteCount = await prisma.website.count({
      where: { userId: session.user.id },
    });

    if (websiteCount === 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasWebsites: false },
      });
    }

    revalidatePath("/websites");

    return {
      success: true,
      message:
        locale === "fr"
          ? "Site supprimé avec succès"
          : "Website deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting website:", error);
    return {
      error:
        locale === "fr"
          ? "Erreur lors de la suppression du site"
          : "Error deleting website",
    };
  }
}

// Toggle website favorite status
export async function toggleFavoriteAction(
  websiteId: number,
  locale: string = "en",
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: locale === "fr" ? "Non autorisé" : "Unauthorized",
    };
  }

  const existingWebsite = await prisma.website.findFirst({
    where: {
      id: websiteId,
      userId: session.user.id,
    },
    select: { favoritedAt: true },
  });

  if (!existingWebsite) {
    return {
      error: locale === "fr" ? "Site non trouvé" : "Website not found",
    };
  }

  try {
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        favoritedAt: existingWebsite.favoritedAt ? null : new Date(),
      },
    });

    revalidatePath("/websites");

    return {
      success: true,
      message: existingWebsite.favoritedAt
        ? locale === "fr"
          ? "Retiré des favoris"
          : "Removed from favorites"
        : locale === "fr"
          ? "Ajouté aux favoris"
          : "Added to favorites",
    };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return {
      error:
        locale === "fr" ? "Erreur lors de la mise à jour" : "Error updating",
    };
  }
}

// Validate website password for public access
export async function validateWebsitePasswordAction(
  websiteId: number,
  password: string,
  locale: string = "en",
): Promise<ActionResult> {
  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      privacy: 2,
    },
    select: { password: true },
  });

  if (!website || !website.password) {
    return {
      error: locale === "fr" ? "Site non trouvé" : "Website not found",
    };
  }

  const isValid = await bcrypt.compare(password, website.password);

  if (!isValid) {
    return {
      error: locale === "fr" ? "Mot de passe incorrect" : "Incorrect password",
    };
  }

  return {
    success: true,
  };
}
