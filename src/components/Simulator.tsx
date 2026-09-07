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
  User,
  Info,
  Signal,
  Sparkles,
  ChevronDown,
  MoreVertical,
  Clock,
  FileText,
  Users,
  CalendarCheck,
  SendHorizontal,
  Circle,
  Loader2
} from "lucide-react";
import { Business, Workflow, TranscriptMessage } from "@/lib/types";

interface SimulatorProps {
  business: Business;
  workflows: Workflow[];
  onConversationFinished?: () => void;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
}

export function Simulator({ business, workflows, onConversationFinished, onStepChange }: SimulatorProps) {
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
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  // Transcript & Input
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [latestTools, setLatestTools] = useState<Array<{ name: string; args: any; result: any }>>([]);
  const [callerName, setCallerName] = useState("Eleanor Vance");
  const [callerPhone, setCallerPhone] = useState("+1 (555) 438-9201");
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Extracted Information Tracking (Dynamically populated from dialog & tool executions)
  const [extractedInfo, setExtractedInfo] = useState<{
    patientName?: string;
    phoneNumber?: string;
    patientStatus?: string;
    appointmentRequest?: string;
    preferredTiming?: string;
    additionalNotes?: string;
  }>({
    patientName: "Eleanor Vance",
    phoneNumber: "+1 (555) 438-9201",
    patientStatus: "Existing Patient",
  });

  // Preset caller test identities
  const CALLER_PRESETS = [
    { 
      name: "Eleanor Vance", 
      phone: "+1 (555) 438-9201", 
      initials: "EV",
      label: "Eleanor (Clinic Patient)", 
      request: "Dermatology Consultation",
      lang: "en" as const 
    },
    { 
      name: "Marcus Lee", 
      phone: "+1 (555) 729-1144", 
      initials: "ML",
      label: "Marcus (Urgent Cake Order)", 
      request: "2kg Belgian Chocolate Truffle Cake",
      lang: "en" as const 
    },
    { 
      name: "Aarav Gupta", 
      phone: "+91 98765 43210", 
      initials: "AG",
      label: "Aarav (हिन्दी Caller)", 
      request: "डॉक्टर अपॉइंटमेंट (कल सुबह)",
      lang: "hi" as const 
    },
  ];

  const selectPreset = (preset: typeof CALLER_PRESETS[0]) => {
    if (callState === "connected" || callState === "calling") return;
    setCallerName(preset.name);
    setCallerPhone(preset.phone);
    setSelectedLanguage(preset.lang);
    setExtractedInfo({
      patientName: preset.name,
      phoneNumber: preset.phone,
      patientStatus: "Existing Customer",
      appointmentRequest: preset.request,
    });
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
      if (onStepChange) onStepChange(3);
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState === "calling") {
      if (onStepChange) onStepChange(2);
    } else if (callState === "ended") {
      if (onStepChange) onStepChange(5);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState, onStepChange]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const playTTSAudio = async (text: string) => {
    if (isMuted || !speakerEnabled) return;
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
          setApiNotice("Deepgram Voice: Simulation mode active until DEEPGRAM_API_KEY is supplied. Assistant text reply shown in transcript.");
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
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setTranscript([initialMessage]);
      playTTSAudio(greeting);
    }, 1000);
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
      alert("Could not access microphone. Please allow microphone permissions, or type below!");
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
          alert("Deepgram did not capture speech. Please speak clearly or type below.");
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedTranscript = [...transcript, userMsg];
    setTranscript(updatedTranscript);
    setTextInput("");
    setIsAgentThinking(true);

    // Update extracted info heuristically
    const lower = messageText.toLowerCase();
    if (lower.includes("tomorrow") || lower.includes("morning") || lower.includes("afternoon") || lower.includes("4 pm") || lower.includes("5 pm")) {
      setExtractedInfo((prev) => ({
        ...prev,
        preferredTiming: messageText.length > 35 ? messageText.slice(0, 35) + "..." : messageText,
      }));
    }
    if (lower.includes("dermatology") || lower.includes("doctor") || lower.includes("checkup") || lower.includes("cake") || lower.includes("delivery")) {
      setExtractedInfo((prev) => ({
        ...prev,
        appointmentRequest: messageText.length > 40 ? messageText.slice(0, 40) + "..." : messageText,
      }));
    }

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
        if (onStepChange) onStepChange(4);
      }

      if (data.collectedData) {
        setExtractedInfo((prev) => ({
          ...prev,
          patientName: data.collectedData.caller_name || prev.patientName,
          phoneNumber: data.collectedData.phone_number || prev.phoneNumber,
          preferredTiming: data.collectedData.request_date || data.collectedData.preferred_time || prev.preferredTiming,
          appointmentRequest: data.collectedData.service_needed || data.collectedData.cake_flavor || prev.appointmentRequest,
        }));
      }

      const assistantMsg: TranscriptMessage = {
        role: "assistant",
        message: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tool_call: data.toolCallsExecuted?.[0],
      };

      setTranscript((prev) => [...prev, assistantMsg]);
      playTTSAudio(data.replyText);

      if (data.isComplete) {
        if (onStepChange) onStepChange(5);
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
        { label: "Dermatology Consultation", text: "I'm calling to see if I can book an appointment with a dermatologist next week." },
        { label: "Hindi Appointment", text: "नमस्ते, मुझे कल सुबह 10 बजे डॉक्टर से मिलना है" },
        { label: "Urgent Chest Pain", text: "I am having acute chest pain and trouble breathing" },
      ]
    : [
        { label: "Urgent Chocolate Cake", text: "I need a 2kg Belgian chocolate truffle cake for a birthday today evening" },
        { label: "Next Week Red Velvet", text: "I want to enquire about a 1kg red velvet cake for pickup next Sunday" },
        { label: "Order Tracking", text: "Can you check the delivery status of order TRK-101?" },
      ];

  // Caller Initials
  const callerInitials = callerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <audio ref={audioElementRef} className="hidden" />

      {/* Preset Caller Switcher Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Caller Identity Preset:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CALLER_PRESETS.map((preset) => {
              const isSelected = callerName === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  disabled={callState === "connected" || callState === "calling"}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  } disabled:opacity-50`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
          <span>Deepgram Nova-2 (STT)</span>
          <span>&bull;</span>
          <span>Gemini 1.5 Tools</span>
          <span>&bull;</span>
          <span>Aura (TTS)</span>
        </div>
      </div>

      {apiNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{apiNotice}</span>
          </div>
          <button onClick={() => setApiNotice(null)} className="text-amber-700 font-bold px-1">✕</button>
        </div>
      )}

      {/* 3-COLUMN STUDIO GRID LAYOUT (MATCHING REFERENCE DESIGN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* COLUMN 1: VOICE CALL CONTROL CONSOLE (lg:col-span-4)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between gap-5 min-h-[580px]">
          
          {/* Top Status & Language Bar */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${callState === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              <span className="text-xs font-bold text-slate-800">
                {callState === "connected" ? "Connected" : callState === "calling" ? "Calling..." : "Standby"}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-transparent border-none outline-none text-slate-700 font-semibold cursor-pointer text-xs"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="auto">Auto-Detect</option>
              </select>
            </div>
          </div>

          {/* Center: Glowing Animated Voice Orb */}
          <div className="flex flex-col items-center justify-center py-4 my-auto select-none">
            <div className="relative flex items-center justify-center">
              
              {/* Outer waveform pulse rings */}
              <div className={`absolute w-44 h-44 rounded-full border border-blue-400/30 transition-all duration-700 ${
                isPlayingTTS || isRecording ? "scale-110 opacity-80 animate-ping" : "opacity-30"
              }`} />
              <div className={`absolute w-36 h-36 rounded-full border border-cyan-400/40 transition-all duration-500 ${
                isPlayingTTS || isRecording ? "scale-105 opacity-90" : "opacity-40"
              }`} />

              {/* Holographic Voice Orb */}
              <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
                isPlayingTTS
                  ? "bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_40px_rgba(6,182,212,0.6)] ring-4 ring-cyan-400/40"
                  : isRecording
                  ? "bg-gradient-to-tr from-rose-500 via-red-600 to-amber-500 shadow-[0_0_40px_rgba(244,63,94,0.6)] ring-4 ring-rose-400/40"
                  : callState === "connected"
                  ? "bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 shadow-[0_0_35px_rgba(37,99,235,0.4)] ring-4 ring-blue-500/20"
                  : "bg-gradient-to-tr from-blue-700 via-indigo-800 to-slate-900 shadow-lg ring-2 ring-slate-200"
              }`}>
                {/* Soundwave bars inside Orb */}
                <div className="flex items-center gap-1">
                  <span className={`w-1 rounded-full bg-white transition-all ${isPlayingTTS || isRecording ? "h-6 animate-pulse" : "h-3"}`} style={{ animationDelay: "0ms" }}></span>
                  <span className={`w-1 rounded-full bg-white transition-all ${isPlayingTTS || isRecording ? "h-10 animate-pulse" : "h-5"}`} style={{ animationDelay: "150ms" }}></span>
                  <span className={`w-1 rounded-full bg-white transition-all ${isPlayingTTS || isRecording ? "h-7 animate-pulse" : "h-4"}`} style={{ animationDelay: "300ms" }}></span>
                  <span className={`w-1 rounded-full bg-white transition-all ${isPlayingTTS || isRecording ? "h-9 animate-pulse" : "h-5"}`} style={{ animationDelay: "450ms" }}></span>
                  <span className={`w-1 rounded-full bg-white transition-all ${isPlayingTTS || isRecording ? "h-5 animate-pulse" : "h-3"}`} style={{ animationDelay: "600ms" }}></span>
                </div>
              </div>

            </div>

            {/* Orb Status Text */}
            <div className="mt-5 text-center space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {isPlayingTTS 
                  ? "Speaking via Deepgram Aura..." 
                  : isRecording 
                  ? "Listening to your voice..." 
                  : isAgentThinking 
                  ? "Formulating response..." 
                  : callState === "connected" 
                  ? "Assistant Active" 
                  : "Assistant On Standby"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {callState === "connected" ? "Listening..." : "Ready for incoming callback"}
              </p>
            </div>
          </div>

          {/* Caller Identity Card */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">
                  Caller: {callerName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {callerPhone}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-800">
                {callState === "connected" ? formatTime(callDuration) : "00:00"}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                <Signal className="w-3 h-3 text-emerald-500" />
                Live Call
              </div>
            </div>
          </div>

          {/* Audio & Call Control Actions (Mute, Speaker, End Call) */}
          <div className="flex items-center justify-center gap-6 pt-1">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled={callState !== "connected"}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                isMuted ? "text-amber-600" : "text-slate-600 hover:text-slate-900"
              } disabled:opacity-40`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition ${
                isMuted ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </div>
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setSpeakerEnabled(!speakerEnabled)}
              disabled={callState !== "connected"}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${
                !speakerEnabled ? "text-slate-400" : "text-slate-600 hover:text-slate-900"
              } disabled:opacity-40`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition ${
                speakerEnabled ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                {speakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <span>Speaker</span>
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              disabled={callState !== "connected" && callState !== "calling"}
              className="flex flex-col items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 transition"
            >
              <div className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md shadow-rose-500/25 active:scale-95">
                <PhoneOff className="w-4 h-4" />
              </div>
              <span>End Call</span>
            </button>
          </div>

          {/* Primary Action Button: Simulate Missed Call Callback */}
          <div className="pt-2">
            {callState === "idle" || callState === "ended" ? (
              <button
                onClick={startCall}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
              >
                <PhoneCall className="w-4 h-4" />
                Simulate Missed Call Callback
              </button>
            ) : (
              <button
                onClick={endCall}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all active:scale-98"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </button>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: LIVE TRANSCRIPT (lg:col-span-5)                 */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[580px] h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Live Transcript
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Live
              </span>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript Message Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[380px] sm:max-h-[420px] pr-1">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                  <PhoneCall className="w-6 h-6 text-slate-400" />
                </div>
                <div className="font-bold text-slate-700 text-xs">Waiting for Call Initialization</div>
                <div className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Click <strong>"Simulate Missed Call Callback"</strong> to begin live transcription.
                </div>
              </div>
            ) : (
              transcript.map((item, idx) => {
                const isUser = item.role === "user";

                return (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-2xs ${
                      isUser
                        ? "bg-slate-200 text-slate-700"
                        : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                    }`}>
                      {isUser ? callerInitials : (
                        <div className="flex items-center gap-0.5">
                          <span className="w-0.5 h-2 bg-white rounded-full"></span>
                          <span className="w-0.5 h-3.5 bg-white rounded-full"></span>
                          <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {isUser ? callerName : "Invyra.ai"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.timestamp}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-slate-100/90 text-slate-800"
                          : "bg-blue-50/70 border border-blue-100 text-slate-800"
                      }`}>
                        <p>{item.message}</p>

                        {/* Tool execution badge if present */}
                        {item.tool_call && (
                          <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[10px] text-blue-700 font-mono font-bold">
                            <Wrench className="w-3 h-3 text-blue-600" />
                            Tool: {item.tool_call.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isAgentThinking && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2.5 text-xs text-blue-800 font-medium">
                  Assistant is reasoning & formulating answer...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          {callState === "connected" && (
            <div className="pt-2 pb-1 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto select-none">
              {promptSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => sendMessageToAI(sug.text)}
                  disabled={isAgentThinking || isRecording}
                  className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg whitespace-nowrap transition border border-slate-200"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Live Input Console */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
              
              {/* Mic toggle */}
              <button
                onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
                disabled={callState !== "connected" || isAgentThinking}
                className={`p-2 rounded-xl transition ${
                  isRecording 
                    ? "bg-rose-600 text-white animate-pulse" 
                    : "text-slate-500 hover:text-blue-600 hover:bg-white"
                } disabled:opacity-40`}
                title="Speak into Microphone"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessageToAI(textInput);
                  }
                }}
                disabled={callState !== "connected" || isAgentThinking}
                placeholder={
                  callState === "connected"
                    ? isRecording
                      ? "Recording your voice... click to stop"
                      : "Assistant is listening or type here..."
                    : "Connect call to chat..."
                }
                className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />

              <button
                onClick={() => sendMessageToAI(textInput)}
                disabled={callState !== "connected" || !textInput.trim() || isAgentThinking}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: INFORMATION COLLECTED & NEXT STEPS (lg:col-span-3)*/}
        {/* ========================================================= */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: Information Collected */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                  Information Collected
                </h3>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist Fields matching reference image */}
            <div className="space-y-3">
              
              {/* Patient Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Patient Name</div>
                    <div className="text-xs font-bold text-slate-800">{extractedInfo.patientName || "Eleanor Vance"}</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              </div>

              {/* Phone Number */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <PhoneCall className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Phone Number</div>
                    <div className="text-xs font-mono font-bold text-slate-800">{extractedInfo.phoneNumber || "+1 (555) 438-9201"}</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              </div>

              {/* Patient Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Patient Status</div>
                    <div className="text-xs font-bold text-slate-800">{extractedInfo.patientStatus || "Existing Patient"}</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              </div>

              {/* Appointment Request */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Appointment Request</div>
                    <div className="text-xs font-bold text-slate-800">{extractedInfo.appointmentRequest || "Dermatology Consultation"}</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              </div>

              {/* Preferred Timing */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Preferred Timing</div>
                    <div className="text-xs font-bold text-slate-800">
                      {extractedInfo.preferredTiming || "Next week, Morning"}
                    </div>
                  </div>
                </div>
                {callState === "connected" ? (
                  <span className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                )}
              </div>

              {/* Additional Notes */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">Additional Notes</div>
                    <div className="text-xs text-slate-500 italic">
                      {extractedInfo.additionalNotes || "Not specified yet"}
                    </div>
                  </div>
                </div>
                <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
              </div>

            </div>
          </div>

          {/* Card 2: Next Steps (Autonomous Actions) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Next Steps
            </h4>

            <div className="space-y-2">
              
              {/* Step 1: Check Availability */}
              <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-blue-900 leading-tight">Check Availability</div>
                  <div className="text-[10px] text-blue-700 leading-tight mt-0.5">Search open slots in Google Calendar</div>
                </div>
              </div>

              {/* Step 2: Book Appointment */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-2.5">
                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Book Appointment</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Confirm with caller and create event</div>
                </div>
              </div>

              {/* Step 3: Send Follow-up */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-2.5">
                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Send Follow-up</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">SMS/Email confirmation to patient</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
