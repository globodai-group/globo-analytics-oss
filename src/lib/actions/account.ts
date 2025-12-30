"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Update user profile (firstName, lastName, email)
 */
export async function updateProfileAction(
  data: { firstName: string; lastName: string; email: string },
  locale: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if email is being changed
    if (data.email !== user.email) {
      // Check if new email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return {
          success: false,
          error:
            locale === "fr"
              ? "Cet email est déjà utilisé"
              : "This email is already in use",
        };
      }

      // Generate verification token for new email
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          pendingEmail: data.email,
          pendingEmailToken: token,
        },
      });

      // Send verification email to new address
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/${locale}/verify-email?token=${token}&type=change`;

      await sendEmail({
        to: data.email,
        subject:
          locale === "fr"
            ? "Confirmez votre nouvelle adresse email"
            : "Confirm your new email address",
        html: `
          <h1>${locale === "fr" ? "Confirmez votre email" : "Confirm your email"}</h1>
          <p>${locale === "fr" ? "Cliquez sur le lien ci-dessous pour confirmer votre nouvelle adresse email:" : "Click the link below to confirm your new email address:"}</p>
          <a href="${verifyUrl}">${locale === "fr" ? "Confirmer l'email" : "Confirm email"}</a>
        `,
      });

      return { success: true };
    }

    // Just update the name fields
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Change user password
 */
export async function changePasswordAction(
  data: { currentPassword: string; newPassword: string },
  locale: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error:
          locale === "fr"
            ? "Impossible de changer le mot de passe pour ce compte"
            : "Cannot change password for this account",
      };
    }

    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      return {
        success: false,
        error:
          locale === "fr"
            ? "Mot de passe actuel incorrect"
            : "Current password is incorrect",
      };
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}

/**
 * Toggle 2FA
 */
export async function toggle2FAAction(enabled: boolean): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        tfaEnabled: enabled,
        tfaCode: null,
        tfaCodeCreatedAt: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    return { success: false, error: "Failed to update 2FA settings" };
  }
}

/**
 * Update user preferences
 */
export async function updatePreferencesAction(data: {
  locale: string;
  timezone: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        locale: data.locale,
        timezone: data.timezone,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}

/**
 * Regenerate API token
 */
export async function regenerateApiTokenAction(): Promise<
  ActionResult & { token?: string }
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { apiToken: token },
    });

    return { success: true, token };
  } catch (error) {
    console.error("Error regenerating API token:", error);
    return { success: false, error: "Failed to regenerate token" };
  }
}

/**
 * Delete user account
 */
export async function deleteAccountAction(
  confirmText: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const expectedText = locale === "fr" ? "SUPPRIMER" : "DELETE";
    if (confirmText !== expectedText) {
      return {
        success: false,
        error:
          locale === "fr"
            ? `Veuillez taper "${expectedText}" pour confirmer`
            : `Please type "${expectedText}" to confirm`,
      };
    }

    // Delete user and all related data (cascade)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
