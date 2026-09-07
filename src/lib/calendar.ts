import { google } from "googleapis";
import * as db from "./db";
import { CalendarEvent } from "./types";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const isGoogleCalendarConfigured = Boolean(
  SERVICE_ACCOUNT_EMAIL &&
  PRIVATE_KEY &&
  !SERVICE_ACCOUNT_EMAIL.includes("your-service-account")
);

function getGoogleCalendarClient() {
  if (!isGoogleCalendarConfigured) return null;

  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    return google.calendar({ version: "v3", auth });
  } catch (err) {
    console.error("Failed to initialize Google Calendar client:", err);
    return null;
  }
}

/**
 * 1. Check availability for a specific date and time slot
 */
export async function checkAvailability(
  dateStr: string,
  startTimeStr: string,
  endTimeStr?: string,
  doctorOrService?: string
): Promise<{ available: boolean; reason?: string; suggestedSlots?: string[] }> {
  const targetDate = new Date(`${dateStr}T${startTimeStr.includes(":") ? (startTimeStr.length === 5 ? startTimeStr + ":00" : startTimeStr) : "10:00:00"}`);
  
  const targetEnd = endTimeStr 
    ? new Date(`${dateStr}T${endTimeStr.includes(":") ? (endTimeStr.length === 5 ? endTimeStr + ":00" : endTimeStr) : "10:45:00"}`)
    : new Date(targetDate.getTime() + 45 * 60 * 1000);

  const gcal = getGoogleCalendarClient();

  if (gcal) {
    try {
      const freebusyRes = await gcal.freebusy.query({
        requestBody: {
          timeMin: targetDate.toISOString(),
          timeMax: targetEnd.toISOString(),
          items: [{ id: CALENDAR_ID }],
        },
      });

      const busySlots = freebusyRes.data.calendars?.[CALENDAR_ID]?.busy || [];
      if (busySlots.length > 0) {
        return {
          available: false,
          reason: `Google Calendar has a conflicting event between ${busySlots[0].start} and ${busySlots[0].end}`,
          suggestedSlots: ["11:00 AM", "2:30 PM", "4:30 PM"],
        };
      }
    } catch (err) {
      console.warn("Google Calendar freebusy check failed, falling back to database check:", err);
    }
  }

  // Check database/local calendar events
  const existingEvents = await db.getCalendarEvents();
  const conflict = existingEvents.find((evt) => {
    if (evt.status === "cancelled") return false;
    const evtStart = new Date(evt.start_time).getTime();
    const evtEnd = new Date(evt.end_time).getTime();
    const reqStart = targetDate.getTime();
    const reqEnd = targetEnd.getTime();

    return (reqStart < evtEnd && reqEnd > evtStart);
  });

  if (conflict) {
    return {
      available: false,
      reason: `Slot is already booked for "${conflict.title}"`,
      suggestedSlots: ["10:30 AM", "2:00 PM", "4:30 PM"],
    };
  }

  return {
    available: true,
    reason: `Slot on ${dateStr} at ${startTimeStr} is open!`,
  };
}

/**
 * 2. Create a calendar event
 */
export async function createEvent(params: {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  attendeeName: string;
  attendeePhone: string;
  doctorOrService?: string;
  notes?: string;
  conversationId?: string;
}): Promise<CalendarEvent> {
  const startIso = new Date(`${params.date}T${params.startTime.length === 5 ? params.startTime + ":00" : params.startTime}`).toISOString();
  const endIso = params.endTime
    ? new Date(`${params.date}T${params.endTime.length === 5 ? params.endTime + ":00" : params.endTime}`).toISOString()
    : new Date(new Date(startIso).getTime() + 45 * 60 * 1000).toISOString();

  let googleEventId: string | undefined;
  const gcal = getGoogleCalendarClient();

  if (gcal) {
    try {
      const res = await gcal.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: params.title,
          description: `${params.notes || ""}\nDoctor/Service: ${params.doctorOrService || "Standard"}\nAttendee Phone: ${params.attendeePhone}`,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
        },
      });
      googleEventId = res.data.id || undefined;
    } catch (err) {
      console.warn("Failed to insert into real Google Calendar, persisting locally:", err);
    }
  }

  const saved = await db.createCalendarEvent({
    conversation_id: params.conversationId,
    title: params.title,
    start_time: startIso,
    end_time: endIso,
    attendee_name: params.attendeeName,
    attendee_phone: params.attendeePhone,
    doctor_or_service: params.doctorOrService,
    notes: params.notes,
    google_event_id: googleEventId || `gcal_mock_${Date.now()}`,
    status: "confirmed",
  });

  return saved;
}

/**
 * 3. Reschedule an existing event
 */
export async function rescheduleEvent(params: {
  eventIdOrKeyword: string;
  newDate: string;
  newStartTime: string;
  newEndTime?: string;
  reason?: string;
}): Promise<CalendarEvent | null> {
  const newStartIso = new Date(`${params.newDate}T${params.newStartTime.length === 5 ? params.newStartTime + ":00" : params.newStartTime}`).toISOString();
  const newEndIso = params.newEndTime
    ? new Date(`${params.newDate}T${params.newEndTime.length === 5 ? params.newEndTime + ":00" : params.newEndTime}`).toISOString()
    : new Date(new Date(newStartIso).getTime() + 45 * 60 * 1000).toISOString();

  const gcal = getGoogleCalendarClient();
  if (gcal && !params.eventIdOrKeyword.startsWith("cal-")) {
    try {
      await gcal.events.patch({
        calendarId: CALENDAR_ID,
        eventId: params.eventIdOrKeyword,
        requestBody: {
          start: { dateTime: newStartIso },
          end: { dateTime: newEndIso },
          description: `Rescheduled: ${params.reason || "Patient request"}`,
        },
      });
    } catch (err) {
      console.warn("Failed to reschedule on Google Calendar directly:", err);
    }
  }

  return await db.rescheduleCalendarEvent(
    params.eventIdOrKeyword,
    newStartIso,
    newEndIso,
    params.reason
  );
}

/**
 * 4. Cancel/delete an existing event
 */
export async function cancelEvent(params: {
  eventIdOrKeyword: string;
  reason?: string;
}): Promise<CalendarEvent | null> {
  const gcal = getGoogleCalendarClient();
  if (gcal && !params.eventIdOrKeyword.startsWith("cal-")) {
    try {
      await gcal.events.delete({
        calendarId: CALENDAR_ID,
        eventId: params.eventIdOrKeyword,
      });
    } catch (err) {
      console.warn("Failed to delete event on Google Calendar directly:", err);
    }
  }

  return await db.cancelCalendarEvent(params.eventIdOrKeyword, params.reason);
}
