import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { getUserById, getBusinesses } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "User account not found" },
        { status: 401 }
      );
    }

    // Only fetch businesses owned by this specific authenticated user
    const businesses = await getBusinesses(user.id);
    const currentBusiness = businesses.find((b) => b.id === session.businessId) || businesses[0] || null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        owner_name: user.owner_name,
      },
      businesses,
      current_business: currentBusiness,
    });
  } catch (err: any) {
    console.error("Auth verification error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
