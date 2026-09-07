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

  // Update follow-up status (Contacted, Completed, Closed)
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

  const getUrgencyBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            URGENT
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            High Priority
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner & Refresh */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Live Customer Records
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Business: <strong className="text-slate-800">{business.name}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Missed-Call Follow-ups & Conversations
          </h2>
          <p className="text-xs text-slate-500">
            Complete records of caller details, intents, collected data, AI summaries, actions performed, and transcripts.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <Clock className="w-3.5 h-3.5" />
          Refresh Records
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Missed-Calls Logged</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Automated callback handled</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgent Priority Alerts
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{urgentCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Condition rules triggered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-600 font-medium">Pending Follow-Up</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires owner contact</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-600 font-medium">Resolved / Closed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{closedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Successfully concluded</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caller name, phone, intent..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["all", "pending", "contacted", "completed", "closed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Records Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
            <LayoutDashboard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="font-semibold text-slate-700">No records found matching current criteria</div>
            <div className="text-xs text-slate-500 mt-1">Try simulating a new missed-call callback in the Voice Simulator tab!</div>
          </div>
        ) : (
          filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition space-y-4"
            >
              {/* Header Row: Caller info, Urgency & Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {record.caller_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{record.caller_name}</span>
                      <span className="text-xs font-mono text-slate-500">({record.caller_phone})</span>
                      {getUrgencyBadge(record.priority)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Business: <strong className="text-slate-700">{record.business_name || business.name}</strong></span>
                      <span>&bull;</span>
                      <span>Workflow: <span className="font-medium text-slate-700">{record.workflow_name || "Callback"}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(record.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </div>

              {/* Middle Row: Intent, Summary, and Action */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                    Customer Intent
                  </div>
                  <div className="text-slate-800 font-semibold">{record.intent}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Status: <span className="capitalize font-medium text-slate-700">{record.status}</span> &bull; Lang: <span className="uppercase">{record.language || "en"}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                  <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    AI-Generated Summary
                  </div>
                  <div className="text-slate-800 leading-relaxed">{record.summary}</div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-blue-700 font-medium flex items-center gap-1">
                    <span>Action: {record.action_performed}</span>
                  </div>
                </div>

              </div>

              {/* Information Collected Badges */}
              {record.collected_data && Object.keys(record.collected_data).length > 0 && (
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Information Collected
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(record.collected_data).map(([k, v]) => (
                      <span
                        key={k}
                        className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-slate-700 font-medium"
                      >
                        <span className="text-slate-400 font-normal">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: Follow-up Status Update & View Transcript */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                
                {/* Follow-up status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Follow-up Status:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {(["pending", "contacted", "completed", "closed"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(record.id, st)}
                        disabled={isUpdatingStatus}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  View Full Transcript ({record.transcript?.length || 0} messages)
                </button>

              </div>

            </div>
          ))
        )}
      </div>

      {/* Full Transcript Modal Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Full Conversation Transcript
                </h3>
                <p className="text-xs text-slate-500">
                  Caller: {selectedRecord.caller_name} ({selectedRecord.caller_phone}) &bull; {new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
              {selectedRecord.transcript && selectedRecord.transcript.length > 0 ? (
                selectedRecord.transcript.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  if (isSystem) {
                    return (
                      <div key={i} className="text-center my-1.5">
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="max-w-[80%] space-y-1">
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isUser ? "bg-blue-600 text-white" : "bg-white text-slate-800 border border-slate-200"
                        }`}>
                          <p>{msg.message}</p>
                          {msg.tool_call && (
                            <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded text-[10px] text-slate-700">
                              <span className="font-bold text-blue-700">Tool: {msg.tool_call.name}</span>
                              <pre className="font-mono text-[9px] mt-0.5">{JSON.stringify(msg.tool_call.args)}</pre>
                            </div>
                          )}
                        </div>
                        <div className={`text-[9px] text-slate-400 ${isUser ? "text-right" : "text-left"}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  No transcript logged for this conversation.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between rounded-b-3xl">
              <div className="text-xs text-slate-500">
                Action: <strong className="text-slate-800">{selectedRecord.action_performed}</strong>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
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
