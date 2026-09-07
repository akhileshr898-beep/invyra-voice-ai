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
  CheckCircle2,
  CalendarCheck,
  CalendarPlus,
  ArrowRight
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
    <div className="space-y-6">
      
      {/* VIBRANT BLUE GRADIENT HERO BANNER (MATCHING TEMPLATE) */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Decorative background glow rings */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 bg-white/15 backdrop-blur-md text-white rounded-full border border-white/20 flex items-center gap-1.5 shadow-xs">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-200" />
              Google Calendar Synchronization
            </span>
            <span className="text-xs text-blue-100 font-medium hidden md:inline">
              Mode: <strong className="text-white font-bold">{isGoogleConfigured ? "Live Google Calendar API Connected" : "Local / Supabase Synchronized"}</strong>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2.5 tracking-tight">
            Appointment Agenda & Calendar Events
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Real-time synchronization between Gemini AI autonomous tool calls and Google Calendar. Appointments booked, rescheduled, or checked during missed-call callbacks appear here immediately.
          </p>
        </div>

        {/* Action Buttons in Hero */}
        <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleQuickAvailabilityCheck}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold transition active:scale-95 border border-white/20 shadow-xs backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Test Availability Tool
          </button>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-bold transition active:scale-95 shadow-md shadow-blue-900/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

      </div>

      {/* Tool Test Notification Pill */}
      {testStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold">{testStatus}</span>
          </div>
          <button onClick={() => setTestStatus(null)} className="text-blue-700 font-bold px-1 hover:text-blue-900">✕</button>
        </div>
      )}

      {/* CRISP WHITE MAIN CONTAINER (MATCHING TEMPLATE) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
        
        {/* Subheader */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              Scheduled Appointments ({events.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live events synchronized with business operating hours and availability rules.
            </p>
          </div>

          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tool Calling Active
          </div>
        </div>

        {/* Events Feed */}
        <div className="space-y-3.5">
          {events.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <CalendarPlus className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700 text-sm">No scheduled events found</div>
              <p className="text-xs text-slate-400 mt-1">Try simulating an appointment booking callback in the Voice Simulator tab!</p>
            </div>
          ) : (
            events.map((event) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);

              return (
                <div
                  key={event.id}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-800 flex flex-col items-center justify-center font-bold flex-shrink-0 border border-blue-200 shadow-2xs group-hover:scale-105 transition-transform">
                      <span className="text-[10px] uppercase font-bold text-blue-600">
                        {startDate.toLocaleString([], { month: "short" })}
                      </span>
                      <span className="text-lg leading-none text-blue-950 font-extrabold mt-0.5">
                        {startDate.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{event.title}</span>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          event.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : event.status === "rescheduled"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {event.attendee_name}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {event.attendee_phone}
                        </span>
                      </div>

                      {event.notes && (
                        <div className="text-xs text-slate-500 italic mt-0.5">
                          Notes: {event.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 self-start sm:self-center font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    ID: {event.google_event_id || event.id.slice(0, 14)}
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
