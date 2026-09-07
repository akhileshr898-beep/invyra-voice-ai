import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getBusinesses } from "@/lib/db";
import { verifyPassword, createSessionToken, setAuthCookie } from "@/lib/auth";

// In-memory brute-force rate limiter: IP -> { attempts: number, lockUntil: number }
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

function checkRateLimit(key: string): { allowed: boolean; remainingSec: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true, remainingSec: 0 };

  if (record.lockUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((record.lockUntil - now) / 1000) };
  }

  if (now - record.lockUntil > 0 && record.count >= 5) {
    // Lock expired, reset
    loginAttempts.delete(key);
    return { allowed: true, remainingSec: 0 };
  }

  return { allowed: true, remainingSec: 0 };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 5 * 60 * 1000; // 5 minute lockout after 5 failed attempts
  }
  loginAttempts.set(key, record);
}

function recordSuccessfulAttempt(key: string): void {
  loginAttempts.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local";
    const body = await req.json();
    const { email, password } = body;

    const rateLimitKey = `${clientIp}_${(email || "").toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${rateCheck.remainingSec} seconds.` 
        },
        { status: 429 }
      );
    }

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Login successful - clear rate limit counter
    recordSuccessfulAttempt(rateLimitKey);

    // Retrieve business profiles owned by this user
    const businesses = await getBusinesses(user.id);
    const primaryBusiness = businesses.length > 0 ? businesses[0] : null;

    // Create session token
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      ownerName: user.owner_name,
      businessId: primaryBusiness?.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        owner_name: user.owner_name,
        business_id: primaryBusiness?.id || null,
        has_business: businesses.length > 0,
      },
      token,
    });

    // Set secure HTTP-only cookie
    setAuthCookie(response, token);

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
