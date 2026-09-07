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
  Info
} from "lucide-react";
import { Business, Workflow, TranscriptMessage } from "@/lib/types";

interface SimulatorProps {
  business: Business;
  workflows: Workflow[];
  onConversationFinished?: () => void;
}

export function Simulator({ business, workflows, onConversationFinished }: SimulatorProps) {
  // Active workflow
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

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isAgentThinking, isPlayingTTS]);

  // Call duration counter
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

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Play audio response using Deepgram TTS
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
          setApiNotice("Deepgram Voice: Audio playback ready when DEEPGRAM_API_KEY is supplied. Displaying text reply.");
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

  // Start Call (Simulate incoming missed-call callback)
  const startCall = async () => {
    setCallState("calling");
    setTranscript([]);
    setLatestTools([]);
    setApiNotice(null);

    // Simulate ringtone delay of 1.2s then connect
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

  // End Call
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

  // Microphone Recording: MediaRecorder -> /api/voice/stt (Deepgram Nova-2)
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
      alert("Could not access microphone. Please grant browser microphone permissions, or use text chat below!");
    }
  };

  const stopMicrophoneRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send recorded audio to Deepgram Nova-2 STT
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
          alert("Deepgram did not capture any speech. Please try speaking again or type in the box.");
        }
      }
    } catch (err) {
      console.error("STT Process error:", err);
      setIsProcessingSTT(false);
    }
  };

  // Send text message to Gemini AI conversation turn
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

  // Sample prompt buttons
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

      {/* Top Banner: Workflow Info & Caller Customization */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
              {business.industry}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Workflow: <span className="font-semibold text-slate-800">{activeWorkflow?.name || "Standard Callback"}</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Voice AI Missed-Call Simulator
          </h2>
          <p className="text-xs text-slate-500">
            Microphone audio processed with <strong className="text-slate-700">Deepgram Nova-2 (STT)</strong> &bull; Voice responses via <strong className="text-slate-700">Deepgram Aura (TTS)</strong> &bull; Reasoning via <strong className="text-slate-700">Gemini Tool Calling</strong>
          </p>
        </div>

        {/* Language & Caller Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-800 font-medium cursor-pointer"
            >
              <option value="en">English (US/UK)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="auto">Auto-Detect</option>
            </select>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
              isMuted ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
            title={isMuted ? "Audio Unmute" : "Audio Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {apiNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>System Notice:</strong> {apiNotice}
          </div>
          <button onClick={() => setApiNotice(null)} className="text-amber-600 hover:text-amber-800 font-bold">✕</button>
        </div>
      )}

      {/* Main Call Simulator Console */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Call Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              callState === "connected" ? "bg-emerald-400 animate-ping" : callState === "calling" ? "bg-amber-400 animate-pulse" : "bg-slate-500"
            }`} />
            <div>
              <div className="font-semibold text-sm">
                {callState === "connected" ? `In Call with ${business.name}` : callState === "calling" ? "Connecting Missed-Call Callback..." : "Simulator Inactive"}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Caller: {callerName} ({callerPhone})</span>
                {callState === "connected" && (
                  <span className="text-emerald-400 font-mono font-bold">
                    &bull; {formatTime(callDuration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Call / Hangup Actions */}
          <div>
            {callState === "idle" || callState === "ended" ? (
              <button
                onClick={startCall}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                Simulate Missed Call Callback
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                Hang Up Call
              </button>
            )}
          </div>
        </div>

        {/* Live Visualizer Bar when Connected */}
        {callState === "connected" && (
          <div className="bg-slate-950 px-6 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              {isPlayingTTS ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-6 bg-teal-400 rounded-full animate-wave" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-8 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-5 bg-indigo-400 rounded-full animate-wave" style={{ animationDelay: "300ms" }} />
                  <div className="w-1.5 h-7 bg-purple-400 rounded-full animate-wave" style={{ animationDelay: "450ms" }} />
                  <span className="text-xs text-teal-300 font-medium ml-2">Voice AI Speaking (Deepgram Aura)...</span>
                </div>
              ) : isRecording ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-6 bg-rose-400 rounded-full animate-wave" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-8 bg-amber-400 rounded-full animate-wave" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-5 bg-red-400 rounded-full animate-wave" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-rose-300 font-medium ml-2">Listening to your microphone...</span>
                </div>
              ) : isAgentThinking ? (
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini Reasoning & Executing Tools...</span>
                </div>
              ) : isProcessingSTT ? (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deepgram Nova-2 Transcribing Voice...</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Ready for voice input or text message</span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              Zero Browser Speech APIs &bull; Serverless Native
            </div>
          </div>
        )}

        {/* Conversation Feed */}
        <div className="h-96 sm:h-[420px] overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-slate-700 text-sm">Simulator Ready</h3>
              <p className="text-xs max-w-sm mt-1 text-slate-500">
                Click <strong className="text-slate-800">"Simulate Missed Call Callback"</strong> above to launch the interactive voice agent for {business.name}.
              </p>
            </div>
          ) : (
            transcript.map((item, idx) => {
              const isUser = item.role === "user";
              const isSystem = item.role === "system";

              if (isSystem) {
                return (
                  <div key={idx} className="text-center my-2">
                    <span className="text-[11px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                      {item.message}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                      }`}
                    >
                      <p>{item.message}</p>

                      {/* Attached Tool Call Badge if Present */}
                      {item.tool_call && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl text-slate-700 text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-700 mb-1">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Gemini Executed Tool: {item.tool_call.name}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-600 overflow-x-auto bg-white p-1.5 rounded border border-slate-200">
                            {JSON.stringify(item.tool_call.args)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`text-[10px] text-slate-400 px-1 ${isUser ? "text-right" : "text-left"}`}>
                      {isUser ? callerName : "Invyra Voice AI"} &bull; {item.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking indicator */}
          {isAgentThinking && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span className="text-xs text-slate-500 font-medium ml-1">AI checking calendar & formulating reply...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Executed Tools Drawer */}
        {latestTools.length > 0 && (
          <div className="bg-indigo-50/70 border-t border-indigo-100 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Active Google Calendar & Agent Tool Executions ({latestTools.length})
              </span>
              <button
                onClick={() => setLatestTools([])}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {latestTools.slice(-3).map((tool, idx) => (
                <div key={idx} className="bg-white border border-indigo-200 rounded-lg p-2 text-[11px] min-w-[220px] max-w-[280px] shadow-xs flex-shrink-0">
                  <div className="font-semibold text-indigo-800 truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {tool.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Args: {JSON.stringify(tool.args)}
                  </div>
                  {tool.result && (
                    <div className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                      Result: {tool.result.reason || tool.result.confirmedTime || tool.result.status || "Success"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        {callState === "connected" && (
          <div className="px-5 pt-3 pb-1 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Try Asking:</span>
            {promptSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => sendMessageToAI(sug.text)}
                disabled={isAgentThinking || isRecording}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg whitespace-nowrap transition border border-slate-200 active:scale-95 disabled:opacity-50"
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
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md active:scale-95 ${
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

          {/* Text Input Fallback / Direct Message */}
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
                    : "Type a response or use the microphone..."
                  : "Click 'Simulate Missed Call Callback' to start"
              }
              className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-60"
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
