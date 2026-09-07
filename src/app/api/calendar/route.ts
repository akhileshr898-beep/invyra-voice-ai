import { NextRequest, NextResponse } from "next/server";
import * as calendar from "@/lib/calendar";
import * as db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await db.getCalendarEvents();
    return NextResponse.json({
      events,
      isGoogleCalendarConfigured: calendar.isGoogleCalendarConfigured,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "checkAvailability": {
        const result = await calendar.checkAvailability(
          params.date,
          params.startTime,
          params.endTime,
          params.doctorOrService
        );
        return NextResponse.json(result);
      }
      case "createEvent": {
        const event = await calendar.createEvent(params);
        return NextResponse.json(event, { status: 201 });
      }
      case "rescheduleEvent": {
        const event = await calendar.rescheduleEvent(params);
        return NextResponse.json(event);
      }
      case "cancelEvent": {
        const event = await calendar.cancelEvent(params);
        return NextResponse.json(event);
      }
      default:
        return NextResponse.json({ error: `Unknown calendar action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
