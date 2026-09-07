import { NextRequest, NextResponse } from "next/server";
import { getUserByResetToken, updateUserPassword } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, new_password } = body;
    const targetPassword = password || new_password;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "A valid reset token is required." },
        { status: 400 }
      );
    }

    if (!targetPassword || typeof targetPassword !== "string" || targetPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const hasUpper = /[A-Z]/.test(targetPassword);
    const hasLower = /[a-z]/.test(targetPassword);
    const hasNumOrSpecial = /[0-9\W]/.test(targetPassword);
    if (!hasUpper || !hasLower || !hasNumOrSpecial) {
      return NextResponse.json(
        { error: "Password must include at least one uppercase letter, one lowercase letter, and one number or symbol." },
        { status: 400 }
      );
    }

    // Verify token validity and expiration in DB
    const user = await getUserByResetToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "The password reset token is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password with fresh salt
    const { hash, salt } = hashPassword(targetPassword);

    // Save updated password and invalidate token
    const updated = await updateUserPassword(user.id, hash, salt);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
