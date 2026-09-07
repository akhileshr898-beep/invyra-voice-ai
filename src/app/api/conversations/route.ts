import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

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
  try {
    const body = await req.json();
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

    const updated = await db.updateConversationStatus(id, followUpStatus);
    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
