"use client";

import React, { useState, useEffect } from "react";
import { CalendarEvent } from "@/lib/types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  RefreshCw, 
  Sparkles,
} from "lucide-react";

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      setEvents(data.events || []);
      setIsGoogleConfigured(data.isGoogleCalendarConfigured || false);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleQuickAvailabilityCheck = async () => {
    setTestStatus("Checking availability for tomorrow at 4:00 PM...");
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkAvailability",
          date: tomorrow,
          startTime: "16:00",
          doctorOrService: "Dr. Sharma",
        }),
      });
      const data = await res.json();
      setTestStatus(`Tool Result: ${data.reason || (data.available ? "Slot is Available!" : "Slot Busy")}`);
    } catch (err) {
      setTestStatus("Availability check failed.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-blue-100/80 text-blue-800 rounded-full border border-blue-200 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Google Calendar Synchronization
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Mode: <strong className={isGoogleConfigured ? "text-emerald-700 font-bold" : "text-blue-700 font-bold"}>
                {isGoogleConfigured ? "Live Google Calendar API Connected" : "Local / Supabase Synchronized"}
              </strong>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Appointment Agenda & Calendar Events
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Appointments created, rescheduled, or cancelled automatically by Gemini AI during missed-call callbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAvailabilityCheck}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition active:scale-95 border border-indigo-200/70"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Test Availability Tool
          </button>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {testStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{testStatus}</span>
          </div>
          <button onClick={() => setTestStatus(null)} className="text-blue-600 font-bold">✕</button>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="font-semibold text-sm">
            Scheduled Appointments ({events.length})
          </div>
          <div className="text-xs text-slate-400">
            Automated Calendar Tool Sync
          </div>
        </div>

        <div className="p-6 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No calendar events found. Try booking an appointment through the Voice Simulator!
            </div>
          ) : (
            events.map((event) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);

              return (
                <div
                  key={event.id}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex flex-col items-center justify-center font-bold flex-shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-blue-600">
                        {startDate.toLocaleString([], { month: "short" })}
                      </span>
                      <span className="text-base leading-none text-blue-900">
                        {startDate.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{event.title}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          event.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : event.status === "rescheduled"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {event.attendee_name}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {event.attendee_phone}
                        </span>
                      </div>

                      {event.notes && (
                        <div className="text-xs text-slate-600 italic">
                          Notes: {event.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 self-start sm:self-center font-mono">
                    ID: {event.google_event_id || event.id}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
