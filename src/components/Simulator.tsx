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
  ShieldAlert,
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
          setApiNotice("Deepgram Voice: Running in simulation mode until DEEPGRAM_API_KEY is supplied. Displaying text reply.");
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
          alert("Deepgram did not capture any speech. Please try speaking again or use text input.");
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

      {/* Top Banner with Human Design Touches */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xs">
              {business.industry}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Active Workflow: <strong className="text-slate-800">{activeWorkflow?.name || "Standard Callback"}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Autonomous Voice Callback Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Experience the automated missed-call callback as a customer. Speech processed via <strong className="text-slate-700">Deepgram Nova-2 (STT)</strong>, reasoned with <strong className="text-slate-700">Gemini 1.5 Tool Calling</strong>, and spoken via <strong className="text-slate-700">Deepgram Aura (TTS)</strong>.
          </p>
        </div>

        {/* Language Selector Pill */}
        <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-center">
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-800 font-semibold cursor-pointer"
            >
              <option value="en">🇺🇸 English</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="auto">✨ Auto-Detect</option>
            </select>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1 transition ${
              isMuted ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
            title={isMuted ? "Audio Unmute" : "Audio Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {apiNotice && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold">Operational Note:</strong> {apiNotice}
          </div>
          <button onClick={() => setApiNotice(null)} className="text-amber-600 hover:text-amber-900 font-bold px-1">✕</button>
        </div>
      )}

      {/* Main Smartphone Telephony Console */}
      <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-2xl overflow-hidden ring-1 ring-black/5">
        
        {/* Smartphone Hardware Style Top Status Bar */}
        <div className="bg-slate-950 px-6 py-2.5 flex items-center justify-between text-slate-400 text-[11px] font-mono select-none">
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-sans font-semibold text-slate-300">Invyra Telecom</span>
            <span>&bull;</span>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-sans font-bold">5G Ultra</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-sans font-semibold text-slate-200">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Call Management Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              callState === "connected"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20 ring-4 ring-emerald-500/20"
                : callState === "calling"
                ? "bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/20 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}>
              {callState === "connected" ? <PhoneCall className="w-5 h-5 animate-pulse" /> : <PhoneForwarded className="w-5 h-5" />}
            </div>

            <div>
              <div className="font-bold text-base flex items-center gap-2">
                <span>{callState === "connected" ? business.name : callState === "calling" ? "Outbound Callback Connecting..." : "Assistant On Standby"}</span>
                {callState === "connected" && (
                  <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    {formatTime(callDuration)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                <span>Caller: {callerName}</span>
                <span>&bull;</span>
                <span className="font-mono text-slate-300">{callerPhone}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div>
            {callState === "idle" || callState === "ended" ? (
              <button
                onClick={startCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                Simulate Missed Call Callback
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-rose-600/30 transition-all active:scale-95"
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
                  <div className="w-1.5 h-8 bg-blue-400 rounded-full wave-bar-2" />
                  <div className="w-1.5 h-5 bg-indigo-400 rounded-full wave-bar-3" />
                  <div className="w-1.5 h-7 bg-purple-400 rounded-full wave-bar-2" />
                  <div className="w-1.5 h-4 bg-teal-300 rounded-full wave-bar-1" />
                  <span className="text-xs text-teal-300 font-semibold ml-2 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    Deepgram Aura Speaking...
                  </span>
                </div>
              ) : isRecording ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-6 bg-rose-400 rounded-full wave-bar-1" />
                  <div className="w-1.5 h-8 bg-amber-400 rounded-full wave-bar-2" />
                  <div className="w-1.5 h-5 bg-red-400 rounded-full wave-bar-3" />
                  <span className="text-xs text-rose-300 font-semibold ml-2 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    Listening to your microphone...
                  </span>
                </div>
              ) : isAgentThinking ? (
                <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
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

            <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Serverless Audio Stream
            </div>
          </div>
        )}

        {/* Conversation Dialog Feed */}
        <div className="h-96 sm:h-[430px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/70 to-slate-100/40">
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3.5 shadow-sm">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Voice Assistant Ready</h3>
              <p className="text-xs max-w-sm mt-1.5 text-slate-500 leading-relaxed">
                Click <strong className="text-slate-800">"Simulate Missed Call Callback"</strong> above to begin your interactive conversation for {business.name}.
              </p>
            </div>
          ) : (
            transcript.map((item, idx) => {
              const isUser = item.role === "user";
              const isSystem = item.role === "system";

              if (isSystem) {
                return (
                  <div key={idx} className="text-center my-2">
                    <span className="text-[11px] bg-slate-200/90 text-slate-700 font-semibold px-3 py-1 rounded-full shadow-2xs">
                      {item.message}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                    <div
                      className={`p-4 rounded-3xl text-xs sm:text-sm shadow-xs leading-relaxed transition-all ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-xs font-medium"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-slate-100"
                      }`}
                    >
                      <p>{item.message}</p>

                      {/* Attached Tool Execution Inspector Card */}
                      {item.tool_call && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/90 p-3 rounded-2xl text-slate-700 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Executed Tool: {item.tool_call.name}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/80 overflow-x-auto">
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
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isAgentThinking && (
            <div className="flex gap-3 items-start animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2.5">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span className="text-xs text-slate-600 font-semibold ml-1">Checking calendar & formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Active Tool Executions Drawer */}
        {latestTools.length > 0 && (
          <div className="bg-indigo-50/80 border-t border-indigo-100 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Live Tool Executions ({latestTools.length})
              </span>
              <button
                onClick={() => setLatestTools([])}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {latestTools.slice(-3).map((tool, idx) => (
                <div key={idx} className="bg-white border border-indigo-200/90 rounded-xl p-2.5 text-[11px] min-w-[240px] max-w-[300px] shadow-xs flex-shrink-0">
                  <div className="font-bold text-indigo-800 truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {tool.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-1">
                    {JSON.stringify(tool.args)}
                  </div>
                  {tool.result && (
                    <div className="text-[10px] text-emerald-700 font-semibold truncate mt-1">
                      Result: {tool.result.reason || tool.result.confirmedTime || tool.result.status || "Success"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips Styled Like Modern Mobile OS */}
        {callState === "connected" && (
          <div className="px-5 pt-3 pb-1 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Quick Reply:</span>
            {promptSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => sendMessageToAI(sug.text)}
                disabled={isAgentThinking || isRecording}
                className="text-[11px] font-semibold px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl whitespace-nowrap transition border border-slate-200/80 active:scale-95 disabled:opacity-50"
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Console */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          
          {/* Deepgram Voice Recording Mic Button */}
          <button
            onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
            disabled={callState !== "connected" || isAgentThinking || isProcessingSTT}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md active:scale-95 flex-shrink-0 ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse shadow-rose-500/30"
                : callState === "connected"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            title={isRecording ? "Stop Recording Voice" : "Speak into Microphone (Deepgram Nova-2)"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Fallback */}
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
              className="flex-1 px-4 py-3 bg-slate-100/90 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={callState !== "connected" || !textInput.trim() || isAgentThinking}
              className="w-12 h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl flex items-center justify-center transition shadow-sm active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
