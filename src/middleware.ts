import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "invyra-secure-auth-secret-key-2026-min-32-chars-long";
const AUTH_COOKIE_NAME = "invyra_auth_token";

// Edge-compatible HMAC-SHA256 signature verification using Web Crypto API
async function verifySessionTokenEdge(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    // Decode base64url signature to binary
    const base64Sig = sig.replace(/-/g, "+").replace(/_/g, "/");
    const padSig = base64Sig.padEnd(base64Sig.length + ((4 - (base64Sig.length % 4)) % 4), "=");
    const binStr = atob(padSig);
    const sigBytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      sigBytes[i] = binStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payloadB64)
    );

    if (!isValid) return false;

    // Decode base64url payload to check expiration
    const base64Payload = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padPayload = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), "=");
    const jsonStr = atob(padPayload);
    const payload = JSON.parse(jsonStr);

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < nowSec) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Static files and Next internals are always allowed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/voice") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // favicon.ico, images, fonts, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Extract token from cookie or Authorization header
  let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  const isAuthenticated = token ? await verifySessionTokenEdge(token) : false;

  const isPublicAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // 3. If authenticated user visits login or register, redirect them to dashboard
  if (isAuthenticated && isPublicAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 4. If unauthenticated user visits protected pages, redirect to /login
  if (!isAuthenticated && !isPublicAuthPage) {
    // For protected API endpoints, return 401 Unauthorized JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    // For UI pages (like / or /onboarding), redirect to /login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
