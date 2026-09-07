"use client";

import React, { useState } from "react";
import { 
  ConversationRecord, 
  Business, 
} from "@/lib/types";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Clock, 
  Search, 
  Eye, 
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";

interface DashboardProps {
  business: Business;
  conversations: ConversationRecord[];
  onRefresh: () => void;
}

export function Dashboard({ business, conversations, onRefresh }: DashboardProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter conversations
  const filtered = conversations.filter((c) => {
    const matchesBiz = c.business_id === business.id || !c.business_id;
    const matchesStatus = filterStatus === "all" || c.follow_up_status === filterStatus;
    const matchesSearch = 
      c.caller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caller_phone.includes(searchQuery) ||
      c.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBiz && matchesStatus && matchesSearch;
  });

  // KPI Metrics
  const totalCalls = conversations.filter((c) => c.business_id === business.id).length;
  const urgentCount = conversations.filter(
    (c) => c.business_id === business.id && c.priority === "urgent"
  ).length;
  const pendingCount = conversations.filter(
    (c) => c.business_id === business.id && c.follow_up_status === "pending"
  ).length;
  const closedCount = conversations.filter(
    (c) => c.business_id === business.id && (c.follow_up_status === "completed" || c.follow_up_status === "closed")
  ).length;

  const handleUpdateStatus = async (recordId: string, newStatus: "pending" | "contacted" | "completed" | "closed") => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId, followUpStatus: newStatus }),
      });
      if (res.ok) {
        onRefresh();
        if (selectedRecord && selectedRecord.id === recordId) {
          setSelectedRecord({ ...selectedRecord, follow_up_status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copySummary = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getUrgencyBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100/90 text-rose-800 border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            URGENT
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100/90 text-amber-800 border border-amber-200">
            High Priority
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100/80 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Customer Records & Follow-up Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Business: <strong className="text-slate-800">{business.name}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Missed-Call Follow-ups & Captured Leads
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of caller conversations, extracted details, Gemini AI summaries, and follow-up statuses.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95"
        >
          <Clock className="w-3.5 h-3.5" />
          Refresh Records
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Handled</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{totalCalls}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Autonomous callbacks</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs bg-gradient-to-br from-white to-rose-50/30">
          <div className="text-xs text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgent Alerts
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">{urgentCount}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">Condition rules triggered</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">Pending Contact</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Requires follow-up</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Resolved</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{closedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Completed & closed</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caller name, phone, intent..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "pending", "contacted", "completed", "closed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Records Cards List with Left Border Urgency Indicators */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
            <LayoutDashboard className="w-12 h-12 mx-auto text-slate-300 mb-2.5" />
            <div className="font-bold text-slate-700 text-base">No records found matching current criteria</div>
            <div className="text-xs text-slate-500 mt-1">Try simulating a new missed-call callback in the Voice Simulator tab!</div>
          </div>
        ) : (
          filtered.map((record) => {
            const urgencyBorder = 
              record.priority === "urgent" 
                ? "border-l-4 border-l-rose-500" 
                : record.priority === "high" 
                ? "border-l-4 border-l-amber-500" 
                : "border-l-4 border-l-emerald-500";

            return (
              <div
                key={record.id}
                className={`bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all space-y-4 ${urgencyBorder}`}
              >
                {/* Header Row: Caller info, Urgency & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {record.caller_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-base text-slate-900">{record.caller_name}</span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{record.caller_phone}</span>
                        {getUrgencyBadge(record.priority)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Business: <strong className="text-slate-700">{record.business_name || business.name}</strong></span>
                        <span>&bull;</span>
                        <span>Workflow: <span className="font-semibold text-slate-700">{record.workflow_name || "Callback"}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-center font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(record.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                </div>

                {/* Middle Row: Intent, Summary, and Action */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                      Customer Intent
                    </div>
                    <div className="text-slate-900 font-bold text-sm leading-snug">{record.intent}</div>
                    <div className="mt-2 text-[11px] text-slate-500 font-medium">
                      Status: <span className="capitalize font-bold text-slate-700">{record.status}</span> &bull; Lang: <span className="uppercase font-bold">{record.language || "en"}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI-Generated Summary
                      </div>
                      <button
                        onClick={() => copySummary(record.id, record.summary)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                      >
                        {copiedId === record.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === record.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-slate-800 leading-relaxed font-medium">{record.summary}</div>
                    <div className="pt-2 border-t border-slate-200/80 text-blue-700 font-bold text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Action: {record.action_performed}</span>
                    </div>
                  </div>

                </div>

                {/* Information Collected Badges */}
                {record.collected_data && Object.keys(record.collected_data).length > 0 && (
                  <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Structured Data Extracted
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(record.collected_data).map(([k, v]) => (
                        <span
                          key={k}
                          className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs text-slate-800 font-medium shadow-2xs"
                        >
                          <span className="text-slate-400 font-normal">{k}:</span> <strong className="text-slate-800">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: Follow-up Status Update & View Transcript */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  
                  {/* Follow-up status selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Follow-up:</span>
                    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200">
                      {(["pending", "contacted", "completed", "closed"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(record.id, st)}
                          disabled={isUpdatingStatus}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                            record.follow_up_status === st
                              ? st === "pending"
                                ? "bg-amber-500 text-white shadow-xs"
                                : st === "contacted"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Full Transcript Drawer */}
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition self-start sm:self-auto active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    View Dialogue Transcript ({record.transcript?.length || 0} turns)
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Full Transcript Modal Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Full Conversation Dialogue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Caller: <strong>{selectedRecord.caller_name}</strong> ({selectedRecord.caller_phone}) &bull; {new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/60">
              {selectedRecord.transcript && selectedRecord.transcript.length > 0 ? (
                selectedRecord.transcript.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  if (isSystem) {
                    return (
                      <div key={i} className="text-center my-2">
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className="max-w-[80%] space-y-1">
                        <div className={`p-4 rounded-3xl text-xs leading-relaxed ${
                          isUser ? "bg-blue-600 text-white font-medium" : "bg-white text-slate-800 border border-slate-200/90 shadow-2xs"
                        }`}>
                          <p>{msg.message}</p>
                          {msg.tool_call && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-700 font-mono">
                              <span className="font-bold text-blue-700">Tool: {msg.tool_call.name}</span>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(msg.tool_call.args, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] text-slate-400 font-medium ${isUser ? "text-right" : "text-left"}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-slate-400 py-12">
                  No dialogue messages recorded for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between rounded-b-3xl">
              <div className="text-xs text-slate-500">
                Action: <strong className="text-slate-900">{selectedRecord.action_performed}</strong>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition"
              >
                Close Transcript
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
