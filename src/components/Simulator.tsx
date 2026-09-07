"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Languages, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  Wrench,
  Bot,
  User,
  Info,
  Signal,
  Wifi,
  Battery,
  Sparkles,
  PhoneForwarded,
  Activity,
  Cpu,
  Radio,
  Clock
} from "lucide-react";
import { Business, Workflow, TranscriptMessage } from "@/lib/types";

interface SimulatorProps {
  business: Business;
  workflows: Workflow[];
  onConversationFinished?: () => void;
}

export function Simulator({ business, workflows, onConversationFinished }: SimulatorProps) {
  const activeWorkflow = workflows.find((w) => w.business_id === business.id) || workflows[0];

  // Call States
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "auto">("en");
  
  // Audio & Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSTT, setIsProcessingSTT] = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Transcript & Input
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [latestTools, setLatestTools] = useState<Array<{ name: string; args: any; result: any }>>([]);
  const [callerName, setCallerName] = useState("Eleanor Vance");
  const [callerPhone, setCallerPhone] = useState("+1 (555) 438-9201");
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Preset caller test identities for quick evaluation
  const CALLER_PRESETS = [
    { 
      name: "Eleanor Vance", 
      phone: "+1 (555) 438-9201", 
      label: "Eleanor Vance", 
      role: "Clinic Patient",
      scenario: "Dr. Sharma callback & rescheduling",
      lang: "en" as const 
    },
    { 
      name: "Marcus Lee", 
      phone: "+1 (555) 729-1144", 
      label: "Marcus Lee", 
      role: "Urgent Customer",
      scenario: "Same-day 2kg truffle cake triage",
      lang: "en" as const 
    },
    { 
      name: "Aarav Gupta", 
      phone: "+91 98765 43210", 
      label: "Aarav Gupta", 
      role: "हिन्दी Bilingual",
      scenario: "कल सुबह 10 बजे डॉक्टर अपॉइंटमेंट",
      lang: "hi" as const 
    },
  ];

  const selectPreset = (preset: typeof CALLER_PRESETS[0]) => {
    if (callState === "connected" || callState === "calling") return;
    setCallerName(preset.name);
    setCallerPhone(preset.phone);
    setSelectedLanguage(preset.lang);
  };

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isAgentThinking, isPlayingTTS]);

  useEffect(() => {
    if (callState === "connected") {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const playTTSAudio = async (text: string) => {
    if (isMuted) return;
    try {
      setIsPlayingTTS(true);
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "aura-asteria-en" }),
      });

      if (!res.ok) {
        setIsPlayingTTS(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (json.isSimulated) {
          setApiNotice("Deepgram Voice: Running in simulated synthesis mode until DEEPGRAM_API_KEY is supplied. Assistant text reply shown below.");
        }
        setIsPlayingTTS(false);
        return;
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play();
        audioElementRef.current.onended = () => {
          setIsPlayingTTS(false);
        };
      }
    } catch (err) {
      console.warn("TTS Playback error:", err);
      setIsPlayingTTS(false);
    }
  };

  const startCall = async () => {
    setCallState("calling");
    setTranscript([]);
    setLatestTools([]);
    setApiNotice(null);

    setTimeout(() => {
      setCallState("connected");
      const greeting = activeWorkflow?.greeting || 
        (selectedLanguage === "hi" 
          ? `नमस्ते! हम ${business.name} से कॉल कर रहे हैं। क्या हम आपकी कोई सहायता कर सकते हैं?`
          : `Hello! This is ${business.name} calling back after missing your call. How can I assist you today?`);

      const initialMessage: TranscriptMessage = {
        role: "assistant",
        message: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setTranscript([initialMessage]);
      playTTSAudio(greeting);
    }, 1200);
  };

  const endCall = () => {
    setCallState("ended");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlayingTTS(false);
    if (onConversationFinished) {
      onConversationFinished();
    }
  };

  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await processRecordedAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      alert("Could not access microphone. Please allow microphone permissions in your browser, or type in the console below!");
    }
  };

  const stopMicrophoneRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    setIsProcessingSTT(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_input.webm");
      formData.append("language", selectedLanguage);

      const res = await fetch("/api/voice/stt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setIsProcessingSTT(false);

      if (data.text && data.text.trim().length > 0) {
        await sendMessageToAI(data.text);
      } else {
        if (data.warning) {
          setApiNotice(data.warning);
        } else {
          alert("Deepgram did not capture any speech. Please speak clearly or use text input.");
        }
      }
    } catch (err) {
      console.error("STT Process error:", err);
      setIsProcessingSTT(false);
    }
  };

  const sendMessageToAI = async (messageText: string) => {
    if (!messageText.trim() || callState !== "connected") return;

    const userMsg: TranscriptMessage = {
      role: "user",
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    const updatedTranscript = [...transcript, userMsg];
    setTranscript(updatedTranscript);
    setTextInput("");
    setIsAgentThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          workflowId: activeWorkflow?.id,
          transcript: updatedTranscript,
          latestUserMessage: messageText,
          callerName,
          callerPhone,
        }),
      });

      const data = await res.json();
      setIsAgentThinking(false);

      if (data.toolCallsExecuted && data.toolCallsExecuted.length > 0) {
        setLatestTools((prev) => [...prev, ...data.toolCallsExecuted]);
      }

      const assistantMsg: TranscriptMessage = {
        role: "assistant",
        message: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        tool_call: data.toolCallsExecuted?.[0],
      };

      setTranscript((prev) => [...prev, assistantMsg]);
      playTTSAudio(data.replyText);

      if (data.isComplete) {
        if (onConversationFinished) onConversationFinished();
      }
    } catch (err) {
      console.error("Chat turn error:", err);
      setIsAgentThinking(false);
    }
  };

  const isClinic = business.industry.toLowerCase().includes("clinic") || business.name.toLowerCase().includes("care");
  const promptSuggestions = isClinic
    ? [
        { label: "Book Dr. Sharma Tomorrow 4 PM", text: "I want to schedule an appointment with Dr. Sharma tomorrow at 4 PM" },
        { label: "डॉक्टर अपॉइंटमेंट (Hindi)", text: "नमस्ते, मुझे कल सुबह 10 बजे डॉक्टर से मिलना है" },
        { label: "Reschedule to 5 PM", text: "Could you reschedule Eleanor's appointment to tomorrow at 5 PM?" },
        { label: "Emergency Chest Pain", text: "I am having acute chest pain and trouble breathing" },
      ]
    : [
        { label: "Urgent Chocolate Cake (Today)", text: "I need a 2kg Belgian chocolate truffle cake for a birthday today evening" },
        { label: "Next Week Red Velvet (Pickup)", text: "I want to enquire about a 1kg red velvet cake for pickup next Sunday" },
        { label: "चॉकलेट केक आर्डर (Hindi)", text: "नमस्ते! मुझे आज शाम तक एक 2kg चॉकलेट केक चाहिए" },
        { label: "Track Delivery Order", text: "Can you check the delivery status of order TRK-101?" },
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <audio ref={audioElementRef} className="hidden" />

      {/* Top Studio Telemetry & Control Center */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col gap-5">
        
        {/* Header Strip with Live System Pipeline Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-3 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-cyan-300 rounded-full border border-cyan-500/30 shadow-xs flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                {business.industry}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Workflow: <strong className="text-slate-200">{activeWorkflow?.name || "Standard Callback"}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight flex items-center gap-2.5">
              <span>Voice Operations Command Studio</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Autonomous missed-call callback engine powered by <strong className="text-cyan-300">Deepgram Nova-2 (STT)</strong>, reasoned via <strong className="text-indigo-300">Gemini 1.5 Tool Calling</strong>, and synthesized with <strong className="text-teal-300">Deepgram Aura (TTS)</strong>.
            </p>
          </div>

          {/* Language Selector & Audio Mute */}
          <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-center">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-800 text-xs font-semibold text-slate-200 shadow-inner">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-transparent border-none outline-none text-slate-200 font-semibold cursor-pointer text-xs"
              >
                <option value="en" className="bg-slate-900 text-white">🇺🇸 English</option>
                <option value="hi" className="bg-slate-900 text-white">🇮🇳 हिन्दी (Hindi)</option>
                <option value="auto" className="bg-slate-900 text-white">✨ Auto-Detect</option>
              </select>
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                isMuted 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry HUD Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">STT Nova-2</div>
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ~140ms Latency
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Gemini Reason</div>
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Tool Calling Active
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Aura TTS Voice</div>
              <div className="text-xs font-bold text-teal-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Asteria Neural
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Telephony Trunk</div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SLA 99.9% Uptime
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Caller Persona Cards */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Simulated Caller Identity:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CALLER_PRESETS.map((preset) => {
              const isSelected = callerName === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  disabled={callState === "connected" || callState === "calling"}
                  className={`p-3 rounded-2xl text-left transition-all border relative flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/70 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/30"
                      : "bg-slate-950/50 hover:bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700"
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                      {preset.label}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                      isSelected ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-slate-800 text-slate-400"
                    }`}>
                      {preset.lang.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-cyan-400/80">
                    {preset.phone}
                  </div>

                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {preset.scenario}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {apiNotice && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200 shadow-lg">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold text-amber-300">Operational Notice:</strong> {apiNotice}
          </div>
          <button onClick={() => setApiNotice(null)} className="text-amber-400 hover:text-amber-200 font-bold px-1">✕</button>
        </div>
      )}

      {/* Main High-Tech Softphone Console */}
      <div className="bg-slate-950/95 rounded-[2.5rem] border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10 phone-bezel">
        
        {/* Smartphone Hardware Style Top Status Bar */}
        <div className="bg-black/90 px-6 pt-3 pb-2 flex items-center justify-between text-slate-400 text-[11px] font-mono select-none border-b border-slate-900">
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-sans font-semibold text-slate-300">Invyra Telecom</span>
            <span>&bull;</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-1.5 py-0.2 rounded font-sans font-bold">5G Ultra</span>
          </div>

          {/* Center Dynamic Island Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1 bg-slate-900/90 rounded-full border border-slate-800 text-[11px] text-slate-300 shadow-inner">
            {callState === "connected" ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">{formatTime(callDuration)}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="truncate max-w-[120px] font-sans font-medium text-slate-200">{business.name}</span>
              </div>
            ) : callState === "calling" ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Connecting Outbound...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Invyra Standby</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-sans font-semibold text-slate-200">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
              <span>98%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Call Management Bar */}
        <div className="bg-slate-900/90 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md transition-all ${
              callState === "connected"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40"
                : callState === "calling"
                ? "bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse"
                : "bg-slate-800/80 text-slate-400 border border-slate-700"
            }`}>
              {callState === "connected" ? <PhoneCall className="w-5 h-5 animate-pulse" /> : <PhoneForwarded className="w-5 h-5" />}
            </div>

            <div>
              <div className="font-bold text-base flex items-center gap-2">
                <span>{callState === "connected" ? business.name : callState === "calling" ? "Outbound Callback Connecting..." : "Assistant On Standby"}</span>
                {callState === "connected" && (
                  <span className="text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 px-2 py-0.5 rounded-full">
                    {formatTime(callDuration)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                <span>Caller: <strong className="text-slate-200">{callerName}</strong></span>
                <span>&bull;</span>
                <span className="font-mono text-cyan-400">{callerPhone}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div>
            {callState === "idle" || callState === "ended" ? (
              <button
                onClick={startCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all active:scale-95 border border-emerald-400/30"
              >
                <PhoneCall className="w-4 h-4" />
                Simulate Missed Call Callback
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.35)] transition-all active:scale-95 border border-rose-400/30"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Equalizer / Visualizer Bar */}
        {callState === "connected" && (
          <div className="bg-slate-950 px-6 py-3.5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              {isPlayingTTS ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-6 bg-teal-400 rounded-full wave-bar-1" />
                  <div className="w-1.5 h-8 bg-cyan-400 rounded-full wave-bar-2" />
                  <div className="w-1.5 h-5 bg-indigo-400 rounded-full wave-bar-3" />
                  <div className="w-1.5 h-7 bg-purple-400 rounded-full wave-bar-4" />
                  <div className="w-1.5 h-4 bg-teal-300 rounded-full wave-bar-5" />
                  <span className="text-xs text-teal-300 font-semibold ml-2 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-teal-400" />
                    Deepgram Aura Speaking...
                  </span>
                </div>
              ) : isRecording ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-6 bg-rose-400 rounded-full wave-bar-1" />
                  <div className="w-1.5 h-8 bg-amber-400 rounded-full wave-bar-2" />
                  <div className="w-1.5 h-5 bg-red-400 rounded-full wave-bar-3" />
                  <div className="w-1.5 h-7 bg-rose-500 rounded-full wave-bar-4" />
                  <span className="text-xs text-rose-300 font-semibold ml-2 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                    Listening to your microphone...
                  </span>
                </div>
              ) : isAgentThinking ? (
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Gemini Reasoning & Executing Tools...</span>
                </div>
              ) : isProcessingSTT ? (
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Deepgram Nova-2 Transcribing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Audio Channel Open &bull; Speak or type below</span>
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-cyan-400/80 hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Serverless Voice Pipeline
            </div>
          </div>
        )}

        {/* Conversation Dialog Feed */}
        <div className="h-96 sm:h-[430px] overflow-y-auto p-6 space-y-4 bg-slate-950/80 backdrop-blur-md">
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <PhoneCall className="w-9 h-9 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-white text-lg">Voice Callback Assistant Ready</h3>
              <p className="text-xs max-w-sm mt-1.5 text-slate-400 leading-relaxed">
                Click <strong className="text-emerald-400">"Simulate Missed Call Callback"</strong> above to experience the autonomous triage & appointment booking pipeline for {business.name}.
              </p>
            </div>
          ) : (
            transcript.map((item, idx) => {
              const isUser = item.role === "user";
              const isSystem = item.role === "system";

              if (isSystem) {
                return (
                  <div key={idx} className="text-center my-2">
                    <span className="text-[11px] bg-slate-900 text-slate-300 font-semibold px-3 py-1 rounded-full border border-slate-800">
                      {item.message}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.35)] mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed transition-all ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs font-medium shadow-lg shadow-blue-500/20"
                          : "bg-slate-900/90 text-slate-100 border border-slate-800/90 rounded-bl-xs shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      <p>{item.message}</p>

                      {/* Attached Tool Execution Inspector Card */}
                      {item.tool_call && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 bg-slate-950/90 p-3 rounded-2xl text-slate-200 text-[11px] space-y-1 border border-cyan-500/20">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Executed Tool: {item.tool_call.name}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800 overflow-x-auto">
                            {JSON.stringify(item.tool_call.args)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`text-[10px] text-slate-400 px-1 font-medium ${isUser ? "text-right" : "text-left"}`}>
                      {isUser ? callerName : "Invyra Voice AI"} &bull; {item.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 border border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isAgentThinking && (
            <div className="flex gap-3 items-start animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span className="text-xs text-slate-300 font-semibold ml-1">Checking availability & formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Active Tool Executions Drawer */}
        {latestTools.length > 0 && (
          <div className="bg-slate-900/90 border-t border-slate-800/80 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Live Tool Executions ({latestTools.length})
              </span>
              <button
                onClick={() => setLatestTools([])}
                className="text-[11px] text-slate-400 hover:text-white font-semibold"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {latestTools.slice(-3).map((tool, idx) => (
                <div key={idx} className="bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-[11px] min-w-[240px] max-w-[300px] shadow-md flex-shrink-0">
                  <div className="font-bold text-indigo-300 truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {tool.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-1">
                    {JSON.stringify(tool.args)}
                  </div>
                  {tool.result && (
                    <div className="text-[10px] text-emerald-400 font-semibold truncate mt-1">
                      Result: {tool.result.reason || tool.result.confirmedTime || tool.result.status || "Success"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips Styled with Obsidian Glass */}
        {callState === "connected" && (
          <div className="px-5 pt-3 pb-1 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Quick Reply:</span>
            {promptSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => sendMessageToAI(sug.text)}
                disabled={isAgentThinking || isRecording}
                className="text-[11px] font-semibold px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/60 hover:text-cyan-300 text-slate-300 rounded-xl whitespace-nowrap transition border border-slate-800 hover:border-indigo-500/50 active:scale-95 disabled:opacity-50"
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Console */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center gap-3">
          
          {/* Deepgram Voice Recording Mic Button */}
          <button
            onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
            disabled={callState !== "connected" || isAgentThinking || isProcessingSTT}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md active:scale-95 flex-shrink-0 ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)] ring-2 ring-rose-400"
                : callState === "connected"
                ? "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.35)]"
                : "bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed"
            }`}
            title={isRecording ? "Stop Recording Voice" : "Speak into Microphone (Deepgram Nova-2)"}
          >
            {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          {/* Text Input Console */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessageToAI(textInput);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={callState !== "connected" || isAgentThinking}
              placeholder={
                callState === "connected"
                  ? isRecording
                    ? "Recording audio... click microphone to send"
                    : "Speak or type your message..."
                  : "Click 'Simulate Missed Call Callback' to start"
              }
              className="flex-1 px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={callState !== "connected" || !textInput.trim() || isAgentThinking}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 rounded-2xl flex items-center justify-center transition shadow-md active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
