import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { checkRateLimit, sanitizeTextInput } from "@/lib/security";
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

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || undefined;
    const followUp = searchParams.get("followUp") || undefined;

    if (businessId) {
      if (!userBusinessIds.includes(businessId)) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view conversations for this business." },
          { status: 403 }
        );
      }
      const records = await db.getConversations(businessId, followUp);
      return NextResponse.json({ records });
    }

    // Return conversations across all businesses owned by this user
    const recordsLists = await Promise.all(
      userBusinessIds.map((bId) => db.getConversations(bId, followUp))
    );
    const records = recordsLists.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limit
  const rateLimit = checkRateLimit(req, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    // Validate required fields
    if (!body.caller_name || !body.caller_phone) {
      return NextResponse.json({ error: "Missing required caller details" }, { status: 400 });
    }

    body.caller_name = sanitizeTextInput(body.caller_name, 100);
    body.caller_phone = sanitizeTextInput(body.caller_phone, 30);
    if (body.intent) body.intent = sanitizeTextInput(body.intent, 200);
    if (body.summary) body.summary = sanitizeTextInput(body.summary, 1000);

    // If request has authenticated session and no business_id is specified, assign user's business
    const session = getAuthenticatedSession(req);
    if (session && !body.business_id) {
      const userBusinesses = await db.getBusinesses(session.userId);
      if (userBusinesses.length > 0) {
        body.business_id = userBusinesses[0].id;
      }
    }

    const created = await db.createConversation(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, followUpStatus } = body;

    if (!id || !followUpStatus) {
      return NextResponse.json({ error: "Missing id or followUpStatus" }, { status: 400 });
    }

    // Validate enum
    const validStatuses = ["pending", "contacted", "completed", "closed"];
    if (!validStatuses.includes(followUpStatus)) {
      return NextResponse.json({ error: `Invalid followUpStatus. Allowed: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    // Verify record exists and belongs to a business owned by user
    const existing = await db.getConversationById(id);
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (!userBusinessIds.includes(existing.business_id)) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify conversation records for a business you do not own." },
        { status: 403 }
      );
    }

    const updated = await db.updateConversationStatus(id, followUpStatus, existing.business_id);
    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
