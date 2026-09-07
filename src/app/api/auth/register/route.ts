import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, owner_name } = body;

    // Validate email
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid business email address." },
        { status: 400 }
      );
    }

    // Validate owner_name
    if (!owner_name || typeof owner_name !== "string" || owner_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    // Validate password complexity
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumOrSpecial = /[0-9\W]/.test(password);
    if (!hasUpper || !hasLower || !hasNumOrSpecial) {
      return NextResponse.json(
        { error: "Password must include at least one uppercase letter, one lowercase letter, and one number or symbol." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password with cryptographically secure salt
    const { hash, salt } = hashPassword(password);

    // Create user record
    const newUser = await createUser({
      email: normalizedEmail,
      owner_name: owner_name.trim(),
      password_hash: hash,
      salt,
    });

    // Generate signed session token
    const token = createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      ownerName: newUser.owner_name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful. Welcome to Invyra AI!",
        user: {
          id: newUser.id,
          email: newUser.email,
          owner_name: newUser.owner_name,
          has_business: false,
        },
        token,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    setAuthCookie(response, token);

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
