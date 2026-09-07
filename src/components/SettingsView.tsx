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
} from "lucide-react";

export function SettingsView() {
  const [copied, setCopied] = useState(false);

  const envTemplate = `# AI & Voice
GEMINI_API_KEY=your-gemini-api-key-here
DEEPGRAM_API_KEY=your-deepgram-api-key-here

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Calendar Integration
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              System Architecture & Configuration
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Integrations & Service Settings
          </h2>
          <p className="text-xs text-slate-500">
            Current status of AI reasoning, voice models, database persistence, and Google Calendar tool calling.
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Gemini AI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Google Gemini AI</h4>
                <p className="text-[11px] text-slate-500">LLM Reasoning & Function Calling</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Powers the conversational assistant, multilingual Hindi/English translation, conditional urgency logic, and autonomous tool calling decisions.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-slate-700">GEMINI_API_KEY</code>
          </div>
        </div>

        {/* Deepgram Voice Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Deepgram Voice AI</h4>
                <p className="text-[11px] text-slate-500">Nova-2 STT & Aura TTS</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
              No Browser APIs
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strictly uses serverless Deepgram Nova-2 for real-time speech-to-text and Deepgram Aura for natural neural text-to-speech audio streaming.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-slate-700">DEEPGRAM_API_KEY</code>
          </div>
        </div>

        {/* Supabase PostgreSQL Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Supabase Database</h4>
                <p className="text-[11px] text-slate-500">PostgreSQL Cloud Persistence</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Dual Mode
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stores businesses, workflows, transcripts, and records. Automatically falls back to persistent local storage when credentials are not yet supplied.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-slate-700">NEXT_PUBLIC_SUPABASE_URL</code>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Google Calendar API</h4>
                <p className="text-[11px] text-slate-500">Autonomous Agent Tool</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Tool Calling
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enables the AI to check calendar slot availability, book events, reschedule appointments, and handle cancellations autonomously.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Env: <code className="text-slate-700">GOOGLE_CALENDAR_ID</code>
          </div>
        </div>

      </div>

      {/* Environment Variable Template */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm">Environment Variables Template (.env)</h3>
          </div>
          <button
            onClick={copyEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy .env"}
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-2xl text-xs text-slate-300 font-mono overflow-x-auto border border-slate-800 leading-relaxed">
          {envTemplate}
        </pre>

        <p className="text-xs text-slate-400 leading-relaxed">
          Note: If you run the project without adding third-party API keys, the application automatically engages its smart internal simulation engine, allowing full evaluation of the workflow builder, voice interface, Google Calendar tool calls, and customer records without crashing!
        </p>
      </div>

    </div>
  );
}
