"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  generateTotpSecret,
  generateTotpQrCode,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from "@/lib/totp";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  getUserPasskeys,
  deletePasskey,
  renamePasskey,
} from "@/lib/passkey";
import { checkRateLimitOrError } from "@/lib/security/rate-limit";
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from "@simplewebauthn/types";
import {
  ActionResult,
  ActionSuccess,
  ActionError,
  ActionSuccessVoid,
  ActionErrors,
} from "@/lib/types/actions";

// ==================== TOTP Actions ====================

/**
 * Start TOTP setup - generate secret and QR code
 */
export async function startTotpSetupAction(
  locale: string = "en"
): Promise<ActionResult<{ secret: string; qrCode: string; recoveryCodes: string[] }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpVerified: true },
  });

  if (!user) {
    return ActionError(ActionErrors.notFound(locale, "User"));
  }

  if (user.totpVerified) {
    return ActionError(
      locale === "fr"
        ? "L'authentification TOTP est déjà activée"
        : "TOTP authentication is already enabled"
    );
  }

  try {
    const secret = generateTotpSecret();
    const qrCode = await generateTotpQrCode(secret, user.email);
    const recoveryCodes = generateRecoveryCodes(8);

    // Store the secret temporarily (not verified yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: secret,
        recoveryCodes: recoveryCodes,
      },
    });

    return ActionSuccess({ secret, qrCode, recoveryCodes });
  } catch (error) {
    console.error("TOTP setup error:", error);
    return ActionError(
      locale === "fr" ? "Erreur lors de la configuration TOTP" : "Error setting up TOTP"
    );
  }
}

/**
 * Verify TOTP code and enable 2FA
 */
export async function verifyTotpSetupAction(
  code: string,
  locale: string = "en"
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpSecret: true, totpVerified: true },
  });

  if (!user) {
    return ActionError(ActionErrors.notFound(locale, "User"));
  }

  if (user.totpVerified) {
    return ActionError(
      locale === "fr"
        ? "L'authentification TOTP est déjà activée"
        : "TOTP authentication is already enabled"
    );
  }

  if (!user.totpSecret) {
    return ActionError(
      locale === "fr" ? "Veuillez d'abord configurer TOTP" : "Please set up TOTP first"
    );
  }

  // Verify the code
  const isValid = verifyTotpCode(user.totpSecret, user.email, code);

  if (!isValid) {
    return ActionError(locale === "fr" ? "Code invalide" : "Invalid code");
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      tfaEnabled: true,
      totpVerified: true,
      tfaDefaultMethod: "totp",
    },
  });

  return ActionSuccessVoid();
}

/**
 * Disable TOTP
 */
export async function disableTotpAction(locale: string = "en"): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  // Check if user has passkeys
  const [user, passkeyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpVerified: true },
    }),
    prisma.passkey.count({ where: { userId: session.user.id } }),
  ]);

  if (!user?.totpVerified) {
    return ActionError(locale === "fr" ? "TOTP n'est pas activé" : "TOTP is not enabled");
  }

  // Disable TOTP
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpSecret: null,
      totpVerified: false,
      recoveryCodes: [],
      // If no passkeys, disable 2FA entirely
      tfaEnabled: passkeyCount > 0,
      tfaDefaultMethod: passkeyCount > 0 ? "passkey" : null,
    },
  });

  return ActionSuccessVoid();
}

/**
 * Verify TOTP code during login
 * SECURITY: Rate limited to prevent brute-force attacks
 */
export async function verifyTotpLoginAction(
  userId: string,
  code: string,
  locale: string = "en"
): Promise<ActionResult<void>> {
  // SECURITY: Rate limit by userId to prevent brute-force
  const rateLimitError = await checkRateLimitOrError("TFA_VERIFY", userId, locale);
  if (rateLimitError) {
    return ActionError(rateLimitError);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, totpSecret: true, totpVerified: true },
  });

  if (!user || !user.totpSecret || !user.totpVerified) {
    return ActionError(locale === "fr" ? "TOTP non configuré" : "TOTP not configured");
  }

  const isValid = verifyTotpCode(user.totpSecret, user.email, code);

  if (!isValid) {
    return ActionError(locale === "fr" ? "Code invalide" : "Invalid code");
  }

  return ActionSuccessVoid();
}

// ==================== Recovery Codes Actions ====================

/**
 * Verify recovery code during login
 * SECURITY: Rate limited with stricter limits (recovery codes are more valuable)
 */
export async function verifyRecoveryCodeAction(
  userId: string,
  code: string,
  locale: string = "en"
): Promise<ActionResult<void>> {
  // SECURITY: Rate limit by userId - stricter than TOTP
  const rateLimitError = await checkRateLimitOrError("RECOVERY_CODE", userId, locale);
  if (rateLimitError) {
    return ActionError(rateLimitError);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { recoveryCodes: true },
  });

  if (!user || user.recoveryCodes.length === 0) {
    return ActionError(
      locale === "fr" ? "Aucun code de récupération disponible" : "No recovery codes available"
    );
  }

  const { valid, index } = verifyRecoveryCode(user.recoveryCodes, code);

  if (!valid) {
    return ActionError(locale === "fr" ? "Code de récupération invalide" : "Invalid recovery code");
  }

  // Remove the used recovery code
  const newCodes = [...user.recoveryCodes];
  newCodes.splice(index, 1);

  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCodes: newCodes },
  });

  return ActionSuccessVoid();
}

/**
 * Regenerate recovery codes
 */
export async function regenerateRecoveryCodesAction(
  locale: string = "en"
): Promise<ActionResult<{ recoveryCodes: string[] }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tfaEnabled: true },
  });

  if (!user?.tfaEnabled) {
    return ActionError(
      locale === "fr"
        ? "La double authentification n'est pas activée"
        : "Two-factor authentication is not enabled"
    );
  }

  const recoveryCodes = generateRecoveryCodes(8);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { recoveryCodes },
  });

  return ActionSuccess({ recoveryCodes });
}

// ==================== Passkey Actions ====================

/**
 * Start passkey registration
 */
export async function startPasskeyRegistrationAction(
  locale: string = "en"
): Promise<ActionResult<{ options: unknown; challenge: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) {
    return ActionError(ActionErrors.notFound(locale, "User"));
  }

  try {
    const options = await generatePasskeyRegistrationOptions(session.user.id, user.email);

    return ActionSuccess({ options, challenge: options.challenge });
  } catch (error) {
    console.error("Passkey registration options error:", error);
    return ActionError(
      locale === "fr" ? "Erreur lors de la configuration du passkey" : "Error setting up passkey"
    );
  }
}

/**
 * Complete passkey registration
 */
export async function completePasskeyRegistrationAction(
  response: RegistrationResponseJSON,
  challenge: string,
  passkeyName: string = "Passkey",
  locale: string = "en"
): Promise<ActionResult<{ recoveryCodes?: string[] }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  // Check if user needs recovery codes (first 2FA method)
  const [passkeyCount, user] = await Promise.all([
    prisma.passkey.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpVerified: true, recoveryCodes: true },
    }),
  ]);

  const needsRecoveryCodes =
    passkeyCount === 0 && !user?.totpVerified && user?.recoveryCodes.length === 0;

  const result = await verifyPasskeyRegistration(session.user.id, response, challenge, passkeyName);

  if (!result.success) {
    return ActionError(
      result.error || (locale === "fr" ? "Échec de l'enregistrement" : "Registration failed")
    );
  }

  // Generate recovery codes if this is the first 2FA method
  if (needsRecoveryCodes) {
    const recoveryCodes = generateRecoveryCodes(8);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { recoveryCodes },
    });
    return ActionSuccess({ recoveryCodes });
  }

  return ActionSuccess({});
}

/**
 * Get passkey authentication options
 */
export async function getPasskeyAuthOptionsAction(
  userId?: string,
  locale: string = "en"
): Promise<ActionResult<{ options: unknown; challenge: string }>> {
  try {
    const options = await generatePasskeyAuthenticationOptions(userId);

    return ActionSuccess({ options, challenge: options.challenge });
  } catch (error) {
    console.error("Passkey auth options error:", error);
    return ActionError(
      locale === "fr"
        ? "Erreur lors de la récupération des options"
        : "Error getting authentication options"
    );
  }
}

/**
 * Verify passkey authentication
 */
export async function verifyPasskeyAuthAction(
  response: AuthenticationResponseJSON,
  challenge: string,
  userId?: string,
  locale: string = "en"
): Promise<ActionResult<{ userId: string }>> {
  const result = await verifyPasskeyAuthentication(response, challenge, userId);

  if (!result.success || !result.userId) {
    return ActionError(
      result.error || (locale === "fr" ? "Échec de la vérification" : "Verification failed")
    );
  }

  return ActionSuccess({ userId: result.userId });
}

/**
 * Get user's passkeys
 */
export async function getUserPasskeysAction(
  locale: string = "en"
): Promise<ActionResult<{ passkeys: unknown[] }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const passkeys = await getUserPasskeys(session.user.id);

  return ActionSuccess({ passkeys });
}

/**
 * Delete a passkey
 */
export async function deletePasskeyAction(
  passkeyId: string,
  locale: string = "en"
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const result = await deletePasskey(session.user.id, passkeyId);

  if (!result.success) {
    return ActionError(
      result.error || (locale === "fr" ? "Erreur lors de la suppression" : "Error deleting passkey")
    );
  }

  return ActionSuccessVoid();
}

/**
 * Rename a passkey
 */
export async function renamePasskeyAction(
  passkeyId: string,
  name: string,
  locale: string = "en"
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const result = await renamePasskey(session.user.id, passkeyId, name);

  if (!result.success) {
    return ActionError(
      result.error || (locale === "fr" ? "Erreur lors du renommage" : "Error renaming passkey")
    );
  }

  return ActionSuccessVoid();
}

// ==================== 2FA Settings Actions ====================

/**
 * Set default 2FA method
 */
export async function setDefault2FAMethodAction(
  method: "totp" | "passkey" | "email",
  locale: string = "en"
): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const [user, passkeyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpVerified: true, tfaEnabled: true },
    }),
    prisma.passkey.count({ where: { userId: session.user.id } }),
  ]);

  if (!user?.tfaEnabled) {
    return ActionError(
      locale === "fr"
        ? "La double authentification n'est pas activée"
        : "Two-factor authentication is not enabled"
    );
  }

  // Validate the method is available
  if (method === "totp" && !user.totpVerified) {
    return ActionError(locale === "fr" ? "TOTP n'est pas configuré" : "TOTP is not configured");
  }

  if (method === "passkey" && passkeyCount === 0) {
    return ActionError(locale === "fr" ? "Aucun passkey configuré" : "No passkeys configured");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tfaDefaultMethod: method },
  });

  return ActionSuccessVoid();
}

/**
 * Get 2FA status for a user
 */
export async function get2FAStatusAction(locale: string = "en"): Promise<
  ActionResult<{
    enabled: boolean;
    defaultMethod: string | null;
    totpEnabled: boolean;
    passkeyCount: number;
    recoveryCodesCount: number;
  }>
> {
  const session = await auth();

  if (!session?.user?.id) {
    return ActionError(ActionErrors.unauthorized(locale));
  }

  const [user, passkeyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tfaEnabled: true,
        tfaDefaultMethod: true,
        totpVerified: true,
        recoveryCodes: true,
      },
    }),
    prisma.passkey.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) {
    return ActionError(ActionErrors.notFound(locale, "User"));
  }

  return ActionSuccess({
    enabled: user.tfaEnabled,
    defaultMethod: user.tfaDefaultMethod,
    totpEnabled: user.totpVerified,
    passkeyCount,
    recoveryCodesCount: user.recoveryCodes.length,
  });
}
