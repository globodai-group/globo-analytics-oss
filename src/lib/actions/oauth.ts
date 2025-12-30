"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Types
interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface OAuthClientInput {
  name: string;
  description?: string;
  redirectUris: string[];
  scopes: string[];
}

interface OAuthClientData {
  id: number;
  clientId: string;
  name: string;
  description: string | null;
  redirectUris: string[];
  scopes: string[];
  isActive: boolean;
  createdAt: Date;
}

// Available scopes
export const OAUTH_SCOPES = [
  { value: "read:stats", label: "Read analytics data" },
  { value: "read:projects", label: "Read projects" },
  { value: "write:projects", label: "Create and edit projects" },
  { value: "read:goals", label: "Read goals" },
  { value: "write:goals", label: "Create and edit goals" },
  { value: "read:segments", label: "Read segments" },
  { value: "write:segments", label: "Create and edit segments" },
  { value: "read:reports", label: "Read reports" },
  { value: "write:reports", label: "Create and edit reports" },
] as const;

// Get user's OAuth clients
export async function getOAuthClientsAction(
  locale: string
): Promise<ActionResult<OAuthClientData[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const clients = await prisma.oAuthClient.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        clientId: true,
        name: true,
        description: true,
        redirectUris: true,
        scopes: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching OAuth clients:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Create OAuth client
export async function createOAuthClientAction(
  input: OAuthClientInput,
  locale: string
): Promise<ActionResult<{ clientId: string; clientSecret: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Validate redirect URIs
    for (const uri of input.redirectUris) {
      try {
        new URL(uri);
      } catch {
        return {
          success: false,
          error:
            locale === "fr"
              ? `URI de redirection invalide: ${uri}`
              : `Invalid redirect URI: ${uri}`,
        };
      }
    }

    // Generate client credentials
    const clientId = `gr_${crypto.randomBytes(16).toString("hex")}`;
    const clientSecret = `grs_${crypto.randomBytes(32).toString("hex")}`;

    // Hash the secret for storage
    const hashedSecret = await bcrypt.hash(clientSecret, 10);

    await prisma.oAuthClient.create({
      data: {
        userId: session.user.id,
        clientId,
        clientSecret: hashedSecret,
        name: input.name,
        description: input.description,
        redirectUris: input.redirectUris,
        scopes: input.scopes,
      },
    });

    revalidatePath("/account/developers");

    return {
      success: true,
      data: { clientId, clientSecret },
      message:
        locale === "fr"
          ? "Client OAuth créé. Sauvegardez le secret, il ne sera plus affiché."
          : "OAuth client created. Save the secret, it won't be shown again.",
    };
  } catch (error) {
    console.error("Error creating OAuth client:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Update OAuth client
export async function updateOAuthClientAction(
  clientId: number,
  input: Partial<OAuthClientInput>,
  locale: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return {
        success: false,
        error: locale === "fr" ? "Client non trouvé" : "Client not found",
      };
    }

    // Validate redirect URIs if provided
    if (input.redirectUris) {
      for (const uri of input.redirectUris) {
        try {
          new URL(uri);
        } catch {
          return {
            success: false,
            error:
              locale === "fr"
                ? `URI de redirection invalide: ${uri}`
                : `Invalid redirect URI: ${uri}`,
          };
        }
      }
    }

    await prisma.oAuthClient.update({
      where: { id: clientId },
      data: {
        name: input.name,
        description: input.description,
        redirectUris: input.redirectUris,
        scopes: input.scopes,
      },
    });

    revalidatePath("/account/developers");

    return {
      success: true,
      message: locale === "fr" ? "Client mis à jour" : "Client updated",
    };
  } catch (error) {
    console.error("Error updating OAuth client:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Delete OAuth client
export async function deleteOAuthClientAction(
  clientId: number,
  locale: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return {
        success: false,
        error: locale === "fr" ? "Client non trouvé" : "Client not found",
      };
    }

    await prisma.oAuthClient.delete({
      where: { id: clientId },
    });

    revalidatePath("/account/developers");

    return {
      success: true,
      message: locale === "fr" ? "Client supprimé" : "Client deleted",
    };
  } catch (error) {
    console.error("Error deleting OAuth client:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Regenerate client secret
export async function regenerateClientSecretAction(
  clientId: number,
  locale: string
): Promise<ActionResult<{ clientSecret: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return {
        success: false,
        error: locale === "fr" ? "Client non trouvé" : "Client not found",
      };
    }

    // Generate new secret
    const clientSecret = `grs_${crypto.randomBytes(32).toString("hex")}`;
    const hashedSecret = await bcrypt.hash(clientSecret, 10);

    // Revoke all existing tokens
    await prisma.oAuthToken.deleteMany({
      where: { clientId: client.id },
    });

    // Update secret
    await prisma.oAuthClient.update({
      where: { id: clientId },
      data: { clientSecret: hashedSecret },
    });

    revalidatePath("/account/developers");

    return {
      success: true,
      data: { clientSecret },
      message:
        locale === "fr"
          ? "Secret régénéré. Tous les tokens existants ont été révoqués."
          : "Secret regenerated. All existing tokens have been revoked.",
    };
  } catch (error) {
    console.error("Error regenerating client secret:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Get client's active tokens
export async function getClientTokensAction(
  clientId: number,
  locale: string
): Promise<
  ActionResult<
    {
      id: number;
      scopes: string[];
      expiresAt: Date;
      createdAt: Date;
    }[]
  >
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return {
        success: false,
        error: locale === "fr" ? "Client non trouvé" : "Client not found",
      };
    }

    const tokens = await prisma.oAuthToken.findMany({
      where: {
        clientId: client.id,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: tokens };
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Revoke a specific token
export async function revokeTokenAction(tokenId: number, locale: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    const token = await prisma.oAuthToken.findFirst({
      where: {
        id: tokenId,
        userId: session.user.id,
      },
    });

    if (!token) {
      return {
        success: false,
        error: locale === "fr" ? "Token non trouvé" : "Token not found",
      };
    }

    await prisma.oAuthToken.delete({
      where: { id: tokenId },
    });

    return {
      success: true,
      message: locale === "fr" ? "Token révoqué" : "Token revoked",
    };
  } catch (error) {
    console.error("Error revoking token:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}
