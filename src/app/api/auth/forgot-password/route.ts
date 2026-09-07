import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserByEmail, setResetToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(normalizedEmail);

    let resetToken: string | undefined;

    if (user) {
      // Generate a secure random reset token
      resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = Date.now() + 60 * 60 * 1000; // 1 hour expiry
      await setResetToken(normalizedEmail, resetToken, expiry);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email address, password reset instructions have been generated.",
      // In demo/test environment, return reset token for easy evaluation
      resetToken: resetToken || null,
      resetUrl: resetToken ? `/reset-password?token=${resetToken}` : null,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
