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
  CalendarCheck
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
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
              <CalendarCheck className="w-3 h-3 text-cyan-400" />
              Google Calendar Synchronization
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Mode: <strong className={isGoogleConfigured ? "text-emerald-400 font-bold" : "text-cyan-300 font-bold"}>
                {isGoogleConfigured ? "Live Google Calendar API Connected" : "Local / Supabase Synchronized"}
              </strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            Appointment Agenda & Calendar Events
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Appointments created, checked, or rescheduled autonomously by Gemini AI during missed-call callbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAvailabilityCheck}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition active:scale-95 border border-indigo-500/30 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Test Availability Tool
          </button>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition active:scale-95 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {testStatus && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-200 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{testStatus}</span>
          </div>
          <button onClick={() => setTestStatus(null)} className="text-indigo-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Events List */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="font-semibold text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-cyan-400" />
            Scheduled Appointments ({events.length})
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Autonomous Calendar Tool Sync
          </div>
        </div>

        <div className="p-6 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No calendar events found. Try booking an appointment through the Voice Simulator!
            </div>
          ) : (
            events.map((event) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);

              return (
                <div
                  key={event.id}
                  className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 rounded-2xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 flex flex-col items-center justify-center font-bold flex-shrink-0 shadow-sm">
                      <span className="text-[10px] uppercase font-semibold text-cyan-400">
                        {startDate.toLocaleString([], { month: "short" })}
                      </span>
                      <span className="text-base leading-none text-white">
                        {startDate.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{event.title}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          event.status === "confirmed"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                            : event.status === "rescheduled"
                            ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                            : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {event.attendee_name}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono text-cyan-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {event.attendee_phone}
                        </span>
                      </div>

                      {event.notes && (
                        <div className="text-xs text-slate-400 italic">
                          Notes: {event.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 self-start sm:self-center font-mono">
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
