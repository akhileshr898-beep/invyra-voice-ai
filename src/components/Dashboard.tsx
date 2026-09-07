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
  Layers,
  Activity,
  RefreshCw
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

  // Filter Tab Badges
  const relevantConvs = conversations.filter((c) => c.business_id === business.id || !c.business_id);
  const statusCounts: Record<string, number> = {
    all: relevantConvs.length,
    pending: relevantConvs.filter((c) => c.follow_up_status === "pending").length,
    contacted: relevantConvs.filter((c) => c.follow_up_status === "contacted").length,
    completed: relevantConvs.filter((c) => c.follow_up_status === "completed").length,
    closed: relevantConvs.filter((c) => c.follow_up_status === "closed").length,
  };

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
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            URGENT
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            High Priority
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" />
              Customer Records & Triage Dashboard
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Business: <strong className="text-slate-200">{business.name}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            Missed-Call Follow-ups & Captured Leads
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of caller conversations, extracted parameters, Gemini AI summaries, and automated triage follow-up states.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition active:scale-95 border border-slate-700 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          Refresh Records
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-lg backdrop-blur-md">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Handled</div>
          <div className="text-3xl font-extrabold text-white mt-1">{totalCalls}</div>
          <div className="text-[11px] text-cyan-400 font-medium mt-1">Autonomous callbacks</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-rose-950/40 border border-rose-500/40 rounded-3xl p-5 shadow-[0_0_25px_rgba(244,63,94,0.15)] backdrop-blur-md">
          <div className="text-xs text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Urgent Alerts
          </div>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">{urgentCount}</div>
          <div className="text-[11px] text-rose-300 font-medium mt-1">Condition rules triggered</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-amber-950/40 border border-amber-500/40 rounded-3xl p-5 shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">Pending Contact</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-300 font-medium mt-1">Requires follow-up</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900/90 to-emerald-950/40 border border-emerald-500/40 rounded-3xl p-5 shadow-[0_0_25px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Resolved</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{closedCount}</div>
          <div className="text-[11px] text-emerald-300 font-medium mt-1">Completed & closed</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caller name, phone, intent..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(["all", "pending", "contacted", "completed", "closed"] as const).map((st) => {
            const count = statusCounts[st] || 0;
            const isSelected = filterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap border ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Records Cards List with Left Border Urgency Indicators */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center text-slate-500">
            <LayoutDashboard className="w-12 h-12 mx-auto text-slate-600 mb-2.5" />
            <div className="font-bold text-slate-300 text-base">No records found matching current criteria</div>
            <div className="text-xs text-slate-500 mt-1">Try simulating a new missed-call callback in the Voice Simulator tab!</div>
          </div>
        ) : (
          filtered.map((record) => {
            const urgencyBorder = 
              record.priority === "urgent" 
                ? "border-l-4 border-l-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.12)]" 
                : record.priority === "high" 
                ? "border-l-4 border-l-amber-500" 
                : "border-l-4 border-l-emerald-500";

            return (
              <div
                key={record.id}
                className={`bg-slate-900/75 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 shadow-lg hover:border-slate-700 transition-all space-y-4 ${urgencyBorder}`}
              >
                {/* Header Row: Caller info, Urgency & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-indigo-500/25">
                      {record.caller_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-base text-white">{record.caller_name}</span>
                        <span className="text-xs font-mono text-cyan-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">{record.caller_phone}</span>
                        {getUrgencyBadge(record.priority)}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Business: <strong className="text-slate-300">{record.business_name || business.name}</strong></span>
                        <span>&bull;</span>
                        <span>Workflow: <span className="font-semibold text-slate-300">{record.workflow_name || "Callback"}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-center font-medium">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{new Date(record.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                </div>

                {/* Middle Row: Intent, Summary, and Action */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                      Customer Intent
                    </div>
                    <div className="text-white font-bold text-sm leading-snug">{record.intent}</div>
                    <div className="mt-2 text-[11px] text-slate-400 font-medium">
                      Status: <span className="capitalize font-bold text-slate-200">{record.status}</span> &bull; Lang: <span className="uppercase font-bold text-cyan-300">{record.language || "en"}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        AI-Generated Summary
                      </div>
                      <button
                        onClick={() => copySummary(record.id, record.summary)}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        {copiedId === record.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === record.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-slate-200 leading-relaxed font-medium">{record.summary}</div>
                    <div className="pt-2 border-t border-slate-800 text-cyan-300 font-bold text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Action: {record.action_performed}</span>
                    </div>
                  </div>

                </div>

                {/* Information Collected Badges */}
                {record.collected_data && Object.keys(record.collected_data).length > 0 && (
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Structured Data Extracted
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(record.collected_data).map(([k, v]) => (
                        <span
                          key={k}
                          className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs text-slate-200 font-medium"
                        >
                          <span className="text-slate-400 font-normal">{k}:</span> <strong className="text-white">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: Follow-up Status Update & View Transcript */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  
                  {/* Follow-up status selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Follow-up:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                      {(["pending", "contacted", "completed", "closed"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(record.id, st)}
                          disabled={isUpdatingStatus}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                            record.follow_up_status === st
                              ? st === "pending"
                                ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                : st === "contacted"
                                ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                : "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                              : "text-slate-400 hover:text-white hover:bg-slate-900"
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition self-start sm:self-auto active:scale-95 border border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  Full Conversation Dialogue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Caller: <strong className="text-slate-200">{selectedRecord.caller_name}</strong> ({selectedRecord.caller_phone}) &bull; {new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-950/80">
              {selectedRecord.transcript && selectedRecord.transcript.length > 0 ? (
                selectedRecord.transcript.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  if (isSystem) {
                    return (
                      <div key={i} className="text-center my-2">
                        <span className="text-[10px] bg-slate-900 text-slate-400 font-semibold px-3 py-1 rounded-full border border-slate-800">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className="max-w-[80%] space-y-1">
                        <div className={`p-4 rounded-3xl text-xs leading-relaxed ${
                          isUser ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md" : "bg-slate-900 text-slate-100 border border-slate-800 shadow-md"
                        }`}>
                          <p>{msg.message}</p>
                          {msg.tool_call && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800 bg-slate-950 p-2.5 rounded-xl text-[10px] text-cyan-300 font-mono border border-cyan-500/20">
                              <span className="font-bold text-cyan-400">Tool: {msg.tool_call.name}</span>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(msg.tool_call.args, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] text-slate-500 font-medium ${isUser ? "text-right" : "text-left"}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-slate-700">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-slate-500 py-12">
                  No dialogue messages recorded for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between rounded-b-3xl">
              <div className="text-xs text-slate-400">
                Action: <strong className="text-white">{selectedRecord.action_performed}</strong>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
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
