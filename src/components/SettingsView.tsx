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
  Server,
  Sparkles
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
    <div className="space-y-6">
      
      {/* VIBRANT BLUE GRADIENT HERO BANNER (MATCHING TEMPLATE) */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Decorative background glow rings */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 bg-white/15 backdrop-blur-md text-white rounded-full border border-white/20 flex items-center gap-1.5 shadow-xs">
              <Server className="w-3.5 h-3.5 text-blue-200" />
              System Architecture & Configuration
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2.5 tracking-tight">
            Integrations & Service Settings
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Status of autonomous LLM reasoning, serverless voice models, multi-tenant database, and Google Calendar tool calling.
          </p>
        </div>

        {onOpenNewBusinessModal && (
          <button
            onClick={onOpenNewBusinessModal}
            className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-bold transition active:scale-95 shadow-md shadow-blue-900/10 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            Add Business Profile
          </button>
        )}

      </div>

      {/* 4 INTEGRATION CARDS (CRISP WHITE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Gemini AI Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Google Gemini AI</h4>
                <p className="text-[11px] text-slate-400">LLM Reasoning & Function Calling</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Powers the conversational assistant, multilingual Hindi/English translation, conditional urgency logic, and autonomous tool calling decisions.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-blue-600 font-bold">GEMINI_API_KEY</code>
          </div>
        </div>

        {/* Deepgram Voice Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Deepgram Voice AI</h4>
                <p className="text-[11px] text-slate-400">Nova-2 STT & Aura TTS</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
              No Browser APIs
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strictly uses serverless Deepgram Nova-2 for real-time speech-to-text and Deepgram Aura for natural neural text-to-speech audio streaming.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-teal-600 font-bold">DEEPGRAM_API_KEY</code>
          </div>
        </div>

        {/* Supabase PostgreSQL Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Supabase Database</h4>
                <p className="text-[11px] text-slate-400">PostgreSQL Cloud Persistence</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Multi-Tenant RLS
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stores businesses, workflows, transcripts, and records. Automatically falls back to persistent local storage when credentials are not yet supplied.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-indigo-600 font-bold">NEXT_PUBLIC_SUPABASE_URL</code>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Google Calendar API</h4>
                <p className="text-[11px] text-slate-400">Autonomous Agent Tool</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Tool Calling
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enables the AI to check calendar slot availability, book events, reschedule appointments, and handle cancellations autonomously.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-blue-600 font-bold">GOOGLE_CALENDAR_ID</code>
          </div>
        </div>

      </div>

      {/* CONFIGURED BUSINESS PROFILES DIRECTORY (CRISP WHITE CARD) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Configured Business Profiles ({businesses?.length || 0})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active businesses receiving automated missed-call callbacks. You can add new profiles or remove existing ones.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {businesses?.map((biz) => {
            const canDelete = businesses.length > 1;
            return (
              <div
                key={biz.id}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800">
                        {biz.industry}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1.5">{biz.name}</h4>
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
                            ? "bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200"
                            : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                        }`}
                        title={canDelete ? `Remove ${biz.name}` : "At least one business profile is required"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-2 space-y-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-700">{biz.phone}</span>
                    </div>
                    {biz.operating_hours && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Hours:</span>
                        <span className="text-slate-700 truncate">{biz.operating_hours}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>TZ: {biz.timezone || "America/New_York"}</span>
                  <span>ID: {biz.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ENVIRONMENT CONFIG CODE BLOCK (CRISP WHITE CARD) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Environment Configuration (.env.local)</h3>
          </div>
          <button
            onClick={copyEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Template"}
          </button>
        </div>
        <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
          {envTemplate}
        </pre>
      </div>

    </div>
  );
}
