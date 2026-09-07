import { NextRequest, NextResponse } from "next/server";
import * as calendar from "@/lib/calendar";
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

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || undefined;

    if (businessId) {
      if (!userBusinessIds.includes(businessId)) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view calendar events for this business." },
          { status: 403 }
        );
      }
      const events = await db.getCalendarEvents(businessId);
      return NextResponse.json({
        events,
        isGoogleCalendarConfigured: calendar.isGoogleCalendarConfigured,
      });
    }

    // Return events across user's businesses
    const eventLists = await Promise.all(userBusinessIds.map((bId) => db.getCalendarEvents(bId)));
    const events = eventLists.flat().sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

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

    const session = getAuthenticatedSession(req);
    let targetBusinessId = params.businessId;

    if (session) {
      const userBusinesses = await db.getBusinesses(session.userId);
      const userBusinessIds = userBusinesses.map((b) => b.id);

      if (targetBusinessId && !userBusinessIds.includes(targetBusinessId)) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify calendar events for a business you do not own." },
          { status: 403 }
        );
      }
      if (!targetBusinessId && userBusinessIds.length > 0) {
        targetBusinessId = userBusinessIds[0];
      }
    }

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
        const event = await calendar.createEvent({
          ...params,
          businessId: targetBusinessId || "b-clinic-001",
        });
        return NextResponse.json(event, { status: 201 });
      }
      case "rescheduleEvent": {
        const event = await calendar.rescheduleEvent({
          ...params,
          businessId: targetBusinessId,
        });
        return NextResponse.json(event);
      }
      case "cancelEvent": {
        const event = await calendar.cancelEvent({
          ...params,
          businessId: targetBusinessId,
        });
        return NextResponse.json(event);
      }
      default:
        return NextResponse.json({ error: `Unknown calendar action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
