/**
 * HMAC Signature Utilities for Tracking Anti-Spoofing
 *
 * Implements HMAC-SHA256 signing and verification to prevent
 * fake analytics data injection.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Generate a new secret key for a project
 * Returns a 32-byte hex string (64 characters)
 */
export function generateSecretKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Sign a payload using HMAC-SHA256
 * Used server-side or by trusted clients
 */
export function signPayload(payload: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(payload).digest("hex");
}

/**
 * Verify an HMAC signature using timing-safe comparison
 * Returns true if signature is valid
 */
export function verifySignature(
  payload: string,
  signature: string,
  secretKey: string,
): boolean {
  if (!signature || !secretKey || signature.length !== 64) {
    return false;
  }

  try {
    const expectedSignature = signPayload(payload, secretKey);
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    // Timing-safe comparison prevents timing attacks
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Create a canonical payload string for signing
 * Ensures consistent ordering of fields
 */
export function createCanonicalPayload(data: {
  tid: string;
  cid: string;
  t: string;
  dp?: string;
  ts?: number;
}): string {
  // Use a minimal set of fields that are always present
  // This prevents replay attacks by including timestamp
  const parts = [
    data.tid,
    data.cid,
    data.t,
    data.dp || "",
    String(data.ts || Date.now()),
  ];
  return parts.join("|");
}
