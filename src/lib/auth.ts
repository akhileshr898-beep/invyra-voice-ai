import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthSession, User } from "./types";

const SESSION_SECRET = process.env.SESSION_SECRET || "invyra-secure-auth-secret-key-2026-min-32-chars-long";
export const AUTH_COOKIE_NAME = "invyra_auth_token";
const SESSION_DURATION_SEC = 7 * 24 * 60 * 60; // 7 days

/**
 * Hashes a plaintext password using native scrypt with a unique cryptographically secure salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

/**
 * Verifies a plaintext password against a stored hash and salt using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const hashBuf = Buffer.from(storedHash, "hex");
    const derivedBuf = Buffer.from(derivedHash, "hex");
    if (hashBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, derivedBuf);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Creates a tamper-proof HMAC-SHA256 signed session token.
 */
export function createSessionToken(session: Omit<AuthSession, "expiresAt">, durationSec: number = SESSION_DURATION_SEC): string {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSec;
  const payload: AuthSession = {
    ...session,
    expiresAt,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies and parses a signed session token.
 * Returns null if the signature is invalid or the session has expired.
 */
export function verifySessionToken(token: string): AuthSession | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  try {
    const providedBuf = Buffer.from(providedSig);
    const expectedBuf = Buffer.from(expectedSig);
    if (providedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload: AuthSession = JSON.parse(jsonStr);

    // Verify expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < nowSec) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated session from a NextRequest.
 * Supports both HTTP-only Cookies and Authorization: Bearer headers.
 */
export function getAuthenticatedSession(req: NextRequest): AuthSession | null {
  // 1. Check Cookie
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const session = verifySessionToken(cookie.value);
    if (session) return session;
  }

  // 2. Check Authorization Header fallback
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const session = verifySessionToken(token);
    if (session) return session;
  }

  return null;
}

/**
 * Sets an HTTP-only, secure authentication cookie on a Next.js response.
 */
export function setAuthCookie(res: NextResponse, token: string, durationSec: number = SESSION_DURATION_SEC): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: durationSec,
  });
}

/**
 * Clears the authentication cookie on logout.
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Strict backend ownership verification helper.
 * Enforces that:
 * 1. User is authenticated (returns 401 if missing).
 * 2. If targetBusinessId is specified, verifies it matches the authenticated session's businessId (returns 403 if mismatch).
 */
export function verifyBusinessOwnership(
  session: AuthSession | null,
  targetBusinessId?: string
): { authorized: boolean; error?: string; status: number } {
  if (!session || !session.userId) {
    return { authorized: false, error: "Authentication required. Please log in.", status: 401 };
  }

  if (targetBusinessId && session.businessId && session.businessId !== targetBusinessId) {
    return { authorized: false, error: "Access forbidden. You do not have permission to access this business's data.", status: 403 };
  }

  return { authorized: true, status: 200 };
}
