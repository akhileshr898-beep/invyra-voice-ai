import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || "TRK-2026-99";

  return NextResponse.json({
    trackingNumber: code,
    status: "In Transit - Out for Local Delivery",
    estimatedArrival: "Today by 4:30 PM",
    carrier: "SwiftLogistics Express Courier",
    lastCheckpoint: "Distribution Hub #4, Sector 18",
    recipientConfirmationRequired: true,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    success: true,
    message: "External CRM / Logistics dispatch received payload.",
    received: body,
    ticketId: `TICK-${Date.now()}`,
  });
}
