import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const businesses = await db.getBusinesses();
    return NextResponse.json({ businesses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await db.createBusiness(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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

    const result = await db.deleteBusiness(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
