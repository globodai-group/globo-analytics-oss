import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { prisma } from "./prisma";

// RP (Relying Party) configuration
const rpName = process.env.NEXT_PUBLIC_APP_NAME || "GloboAnalytics";
const rpID = process.env.PASSKEY_RP_ID || "localhost";
const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Convert base64url string to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = Buffer.from(paddedBase64, "base64");
  return new Uint8Array(binary);
}

// Convert Uint8Array to base64url string
function uint8ArrayToBase64url(array: Uint8Array): string {
  return Buffer.from(array).toString("base64url");
}

export interface PasskeyCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  counter: bigint;
  deviceType: string | null;
  backedUp: boolean;
  transports: string[];
  name: string;
}

/**
 * Generate registration options for a new passkey
 */
export async function generatePasskeyRegistrationOptions(
  userId: string,
  email: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  // Get existing passkeys for this user to exclude
  const existingPasskeys = await prisma.passkey.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });

  const excludeCredentials = existingPasskeys.map((passkey) => ({
    id: passkey.credentialId,
    transports: passkey.transports as AuthenticatorTransportFuture[],
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,
    userDisplayName: email,
    // Prefer discoverable credentials (passkeys)
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform", // Use platform authenticators (like Touch ID, Face ID)
    },
    excludeCredentials,
    attestationType: "none", // We don't need attestation for passkeys
  });

  // Store the challenge temporarily (in a real app, use sessions or Redis)
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Store challenge in a temporary field or use a separate table
      // For now, we'll pass it back and verify it in the next step
    },
  });

  return options;
}

/**
 * Verify registration response and save the passkey
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  challenge: string,
  passkeyName?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const verification: VerifiedRegistrationResponse =
      await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Verification failed" };
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Save the passkey to the database
    // credential.id and credential.publicKey are Uint8Array in v13
    const credentialIdBase64 =
      typeof credential.id === "string"
        ? credential.id
        : uint8ArrayToBase64url(credential.id as unknown as Uint8Array);
    const publicKeyBase64 =
      typeof credential.publicKey === "string"
        ? credential.publicKey
        : uint8ArrayToBase64url(credential.publicKey as unknown as Uint8Array);

    await prisma.passkey.create({
      data: {
        userId,
        credentialId: credentialIdBase64,
        publicKey: publicKeyBase64,
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response.transports || [],
        name: passkeyName || "Passkey",
      },
    });

    // Enable 2FA if not already enabled
    await prisma.user.update({
      where: { id: userId },
      data: {
        tfaEnabled: true,
        tfaDefaultMethod: "passkey",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Passkey registration error:", error);
    return { success: false, error: "Failed to register passkey" };
  }
}

/**
 * Generate authentication options for passkey login
 */
export async function generatePasskeyAuthenticationOptions(
  userId?: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  let allowCredentials: {
    id: string;
    transports?: AuthenticatorTransportFuture[];
  }[] = [];

  if (userId) {
    // If we know the user, only allow their passkeys
    const passkeys = await prisma.passkey.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    allowCredentials = passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials:
      allowCredentials.length > 0 ? allowCredentials : undefined,
  });

  return options;
}

/**
 * Verify authentication response
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  challenge: string,
  userId?: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Find the passkey by credential ID
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId: response.id },
      include: { user: true },
    });

    if (!passkey) {
      return { success: false, error: "Passkey not found" };
    }

    // If userId is provided, verify it matches
    if (userId && passkey.userId !== userId) {
      return { success: false, error: "Passkey does not belong to this user" };
    }

    const verification: VerifiedAuthenticationResponse =
      await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialId,
          publicKey: base64urlToUint8Array(
            passkey.publicKey,
          ) as Uint8Array<ArrayBuffer>,
          counter: Number(passkey.counter),
          transports: passkey.transports as AuthenticatorTransportFuture[],
        },
      });

    if (!verification.verified) {
      return { success: false, error: "Verification failed" };
    }

    // Update the counter
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    return { success: true, userId: passkey.userId };
  } catch (error) {
    console.error("Passkey authentication error:", error);
    return { success: false, error: "Failed to verify passkey" };
  }
}

/**
 * Get all passkeys for a user
 */
export async function getUserPasskeys(
  userId: string,
): Promise<PasskeyCredential[]> {
  const passkeys = await prisma.passkey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return passkeys.map((p) => ({
    id: p.id,
    credentialId: p.credentialId,
    publicKey: p.publicKey,
    counter: p.counter,
    deviceType: p.deviceType,
    backedUp: p.backedUp,
    transports: p.transports,
    name: p.name,
  }));
}

/**
 * Delete a passkey
 */
export async function deletePasskey(
  userId: string,
  passkeyId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the passkey belongs to the user
    const passkey = await prisma.passkey.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      return { success: false, error: "Passkey not found" };
    }

    // Delete the passkey
    await prisma.passkey.delete({
      where: { id: passkeyId },
    });

    // Check if user has any remaining 2FA methods
    const [remainingPasskeys, user] = await Promise.all([
      prisma.passkey.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { totpVerified: true },
      }),
    ]);

    // If no 2FA methods remain, disable 2FA
    if (remainingPasskeys === 0 && !user?.totpVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tfaEnabled: false,
          tfaDefaultMethod: null,
        },
      });
    } else if (remainingPasskeys === 0 && user?.totpVerified) {
      // Switch default to TOTP
      await prisma.user.update({
        where: { id: userId },
        data: { tfaDefaultMethod: "totp" },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Delete passkey error:", error);
    return { success: false, error: "Failed to delete passkey" };
  }
}

/**
 * Rename a passkey
 */
export async function renamePasskey(
  userId: string,
  passkeyId: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const passkey = await prisma.passkey.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      return { success: false, error: "Passkey not found" };
    }

    await prisma.passkey.update({
      where: { id: passkeyId },
      data: { name },
    });

    return { success: true };
  } catch (error) {
    console.error("Rename passkey error:", error);
    return { success: false, error: "Failed to rename passkey" };
  }
}
