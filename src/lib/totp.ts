import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GloboAnalytics";

/**
 * Generate a new TOTP secret
 */
export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generate recovery codes (8 codes of 8 characters each)
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Create a TOTP instance from a secret
 */
function createTotp(secret: string, email: string): TOTP {
  return new TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

/**
 * Get the TOTP URI for QR code generation
 */
export function getTotpUri(secret: string, email: string): string {
  const totp = createTotp(secret, email);
  return totp.toString();
}

/**
 * Generate QR code as data URL
 */
export async function generateTotpQrCode(
  secret: string,
  email: string,
): Promise<string> {
  const uri = getTotpUri(secret, email);
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    width: 256,
    margin: 2,
  });
}

/**
 * Verify a TOTP code
 */
export function verifyTotpCode(
  secret: string,
  email: string,
  code: string,
): boolean {
  const totp = createTotp(secret, email);

  // Allow for 1 period of drift (30 seconds before/after)
  const delta = totp.validate({ token: code, window: 1 });

  // delta is null if invalid, or a number (-1, 0, 1) indicating which window matched
  return delta !== null;
}

/**
 * Verify a recovery code
 * Returns the index of the used code if valid, -1 otherwise
 */
export function verifyRecoveryCode(
  codes: string[],
  inputCode: string,
): { valid: boolean; index: number } {
  // Normalize input: remove dashes and convert to uppercase
  const normalizedInput = inputCode.replace(/-/g, "").toUpperCase();

  for (let i = 0; i < codes.length; i++) {
    const normalizedCode = codes[i].replace(/-/g, "").toUpperCase();
    if (normalizedCode === normalizedInput) {
      return { valid: true, index: i };
    }
  }

  return { valid: false, index: -1 };
}

/**
 * Hash recovery codes for secure storage
 * Note: In this implementation, we store them in plain text for simplicity
 * In production, you might want to hash them
 */
export function hashRecoveryCodes(codes: string[]): string[] {
  // For now, return as-is since we need to display them to users
  // and they're already random
  return codes;
}
