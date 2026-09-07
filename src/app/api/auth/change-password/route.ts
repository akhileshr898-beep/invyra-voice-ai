import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, hashPassword, verifyPassword } from "@/lib/auth";
import * as db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash, user.salt);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const { hash, salt } = await hashPassword(newPassword);
    await db.updateUserPassword(user.id, hash, salt);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
