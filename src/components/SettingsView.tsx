"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  Mic, 
  Database, 
  Calendar, 
  Key, 
  Copy, 
  Check,
  Building2,
  PlusCircle,
  Trash2,
  ShieldCheck,
  Server
} from "lucide-react";
import { Business } from "@/lib/types";

interface SettingsViewProps {
  businesses?: Business[];
  onDeleteBusiness?: (id: string) => Promise<void> | void;
  onOpenNewBusinessModal?: () => void;
}

export function SettingsView({
  businesses = [],
  onDeleteBusiness,
  onOpenNewBusinessModal,
}: SettingsViewProps) {
  const [copied, setCopied] = useState(false);

  const envTemplate = `# AI & Voice Pipeline
GEMINI_API_KEY=your-gemini-api-key-here
DEEPGRAM_API_KEY=your-deepgram-api-key-here

# Database (Supabase PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Calendar Autonomous Integration
GOOGLE_CALENDAR_ID=primary
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----\\n"
`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-indigo-400" />
              System Architecture & Telemetry
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            Integrations & Service Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Status of autonomous LLM reasoning, serverless voice models, multi-tenant database, and Google Calendar tool calling.
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Gemini AI Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Google Gemini AI</h4>
                <p className="text-[11px] text-slate-400">LLM Reasoning & Function Calling</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Powers the conversational assistant, multilingual Hindi/English translation, conditional urgency logic, and autonomous tool calling decisions.
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Env: <code className="text-cyan-300">GEMINI_API_KEY</code>
          </div>
        </div>

        {/* Deepgram Voice Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Deepgram Voice AI</h4>
                <p className="text-[11px] text-slate-400">Nova-2 STT & Aura TTS</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
              No Browser APIs
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strictly uses serverless Deepgram Nova-2 for real-time speech-to-text and Deepgram Aura for natural neural text-to-speech audio streaming.
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Env: <code className="text-teal-300">DEEPGRAM_API_KEY</code>
          </div>
        </div>

        {/* Supabase PostgreSQL Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Supabase Database</h4>
                <p className="text-[11px] text-slate-400">PostgreSQL Cloud Persistence</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
              Multi-Tenant RLS
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stores businesses, workflows, transcripts, and records. Automatically falls back to persistent local storage when credentials are not yet supplied.
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Env: <code className="text-blue-300">NEXT_PUBLIC_SUPABASE_URL</code>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Google Calendar API</h4>
                <p className="text-[11px] text-slate-400">Autonomous Agent Tool</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Tool Calling
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enables the AI to check calendar slot availability, book events, reschedule appointments, and handle cancellations autonomously.
          </p>
          <div className="text-[11px] text-slate-500 font-mono">
            Env: <code className="text-indigo-300">GOOGLE_CALENDAR_ID</code>
          </div>
        </div>

      </div>

      {/* Configured Business Profiles Directory */}
      <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Configured Business Profiles ({businesses?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active businesses receiving automated missed-call callbacks. You can add new profiles or remove existing ones.
            </p>
          </div>

          {onOpenNewBusinessModal && (
            <button
              onClick={onOpenNewBusinessModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-95 self-start sm:self-center border border-indigo-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              Add Business Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {businesses?.map((biz) => {
            const canDelete = businesses.length > 1;
            return (
              <div
                key={biz.id}
                className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {biz.industry}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1.5">{biz.name}</h4>
                    </div>
                    {onDeleteBusiness && (
                      <button
                        onClick={() => {
                          if (!canDelete) {
                            alert("Cannot remove the last remaining business profile. At least one profile is required.");
                            return;
                          }
                          if (confirm(`Are you sure you want to remove "${biz.name}"?\n\nThis will also remove its associated workflows.`)) {
                            onDeleteBusiness(biz.id);
                          }
                        }}
                        className={`p-2 rounded-xl border transition ${
                          canDelete
                            ? "bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/40"
                            : "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                        }`}
                        title={canDelete ? `Remove ${biz.name}` : "At least one business profile is required"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-2 space-y-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono text-cyan-300">{biz.phone}</span>
                    </div>
                    {biz.operating_hours && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Hours:</span>
                        <span className="text-slate-300 truncate">{biz.operating_hours}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>TZ: {biz.timezone || "America/New_York"}</span>
                  <span>ID: {biz.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environment Config Code Block */}
      <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Environment Configuration (.env.local)</h3>
          </div>
          <button
            onClick={copyEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Template"}
          </button>
        </div>
        <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {envTemplate}
        </pre>
      </div>

    </div>
  );
}
