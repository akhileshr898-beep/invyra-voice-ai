import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { isDeepgramConfigured } from "@/lib/deepgram";
import { isGeminiConfigured } from "@/lib/gemini";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isGoogleCalendarConfigured } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      voiceService: isDeepgramConfigured ? "Active" : "Disconnected",
      aiAssistant: isGeminiConfigured ? "Active" : "Disconnected",
      database: isSupabaseConfigured ? "Connected" : "Disconnected",
      googleCalendar: isGoogleCalendarConfigured ? "Connected" : "Disconnected",
    });
  } catch (error: any) {
    return NextResponse.json({
      voiceService: "Disconnected",
      aiAssistant: "Disconnected",
      database: "Disconnected",
      googleCalendar: "Disconnected",
    });
  }
}
