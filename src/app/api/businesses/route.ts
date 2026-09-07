import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    // Only return businesses owned by the authenticated user
    const businesses = await db.getBusinesses(session.userId);
    return NextResponse.json({ businesses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    // Force owner_user_id to the authenticated user (prevent spoofing/IDOR)
    const businessData = {
      ...body,
      owner_user_id: session.userId,
      owner_name: body.owner_name || session.ownerName,
      email: body.email || session.email,
    };

    const created = await db.createBusiness(businessData);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // body wasn't JSON
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing business ID to delete" }, { status: 400 });
    }

    // Enforce that the user can only delete businesses they own
    const result = await db.deleteBusiness(id, session.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
