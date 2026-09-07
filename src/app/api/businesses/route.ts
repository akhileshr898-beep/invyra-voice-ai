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
