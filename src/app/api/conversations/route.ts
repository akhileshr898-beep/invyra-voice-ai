import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { checkRateLimit, sanitizeTextInput } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || undefined;
    const followUp = searchParams.get("followUp") || undefined;

    const records = await db.getConversations(businessId, followUp);
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

    const created = await db.createConversation(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
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

    const updated = await db.updateConversationStatus(id, followUpStatus);
    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
