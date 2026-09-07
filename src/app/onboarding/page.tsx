"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  Sparkles, 
  Volume2, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";

const INDUSTRIES = [
  { id: "Clinic & Healthcare", name: "🏥 Clinic & Healthcare", defaultTone: "Empathetic, reassuring, professional and efficient. Never give medical diagnoses." },
  { id: "Bakery & Cake Shop", name: "🎂 Bakery & Cake Studio", defaultTone: "Warm, cheerful, creative, and enthusiastic." },
  { id: "Delivery & Logistics", name: "🚚 Delivery & Logistics", defaultTone: "Crisp, urgent, precise, and solution-oriented." },
  { id: "Real Estate & Property", name: "🏠 Real Estate & Leasing", defaultTone: "Polite, consultative, and knowledgeable." },
  { id: "Legal & Professional", name: "⚖️ Legal & Financial", defaultTone: "Discreet, articulate, objective, and polite." },
  { id: "Custom / General", name: "💼 General Business", defaultTone: "Helpful, courteous, and professional." },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Identity
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("Clinic & Healthcare");
  const [phone, setPhone] = useState("+1 (555) 000-1234");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("English & Hindi");

  // Step 2: Operations & AI Tone
  const [timezone, setTimezone] = useState("America/New_York");
  const [operatingHours, setOperatingHours] = useState("Mon-Sat: 9:00 AM - 6:00 PM");
  const [tone, setTone] = useState(INDUSTRIES[0].defaultTone);
  const [connectGoogleCalendar, setConnectGoogleCalendar] = useState(true);

  const handleIndustryChange = (newIndustry: string) => {
    setIndustry(newIndustry);
    const matched = INDUSTRIES.find((ind) => ind.id === newIndustry);
    if (matched) {
      setTone(matched.defaultTone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Create the business profile
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim(),
          industry,
          phone: phone.trim(),
          business_address: address.trim(),
          preferred_language: language,
          timezone,
          operating_hours: operatingHours,
          tone,
          google_calendar_connected: connectGoogleCalendar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create business profile.");
      }

      // 2. Automatically provision an initial workflow for this business
      try {
        await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: data.id,
            name: `${businessName} Missed Call & Booking Dispatch`,
            trigger: "missed_call",
            greeting: `Hello! This is ${businessName}'s automated assistant calling you back after missing your call. How may I assist you today?`,
            fields_schema: [
              { key: "caller_name", label: "Full Name", type: "text", required: true, promptQuestion: "May I please have your full name?" },
              { key: "phone_number", label: "Phone Number", type: "text", required: true, promptQuestion: "What is your best contact phone number?" },
              { key: "reason_for_call", label: "Reason for Call", type: "text", required: true, promptQuestion: "Could you briefly tell me the reason for your call?" },
              { key: "preferred_time", label: "Preferred Time / Slot", type: "text", required: false, promptQuestion: "What day or time works best for you?" },
            ],
            urgency_rules: [
              { keyword: "urgent", priority: "high", action_required: "Immediate staff notification" },
              { keyword: "emergency", priority: "critical", action_required: "Instant SMS alert to on-duty manager" },
            ],
          }),
        });
      } catch (wfErr) {
        console.warn("Could not create initial workflow automatically:", wfErr);
      }

      // 3. Redirect to main dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Step {step} of 2 • Business Onboarding</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Set Up Your AI Receptionist
          </h1>
          <p className="text-sm text-slate-400">
            Tell us about your business so your Voice AI assistant can handle caller inquiries seamlessly.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Business Identity */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Care Medical Centre"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Industry / Domain *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => handleIndustryChange(ind.id)}
                      className={`p-3 rounded-xl text-left border transition-all text-xs font-medium flex items-center justify-between ${
                        industry === ind.id
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      <span>{ind.name}</span>
                      {industry === ind.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Inbound Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Preferred Language *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none"
                    >
                      <option value="English & Hindi">English & Hindi (Bilingual)</option>
                      <option value="English">English Only</option>
                      <option value="Hindi">Hindi Only</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Business Location / Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street, Suite 400, New York, NY"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!businessName.trim()}
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                <span>Next: AI Persona & Scheduling</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* STEP 2: Operations, Persona & Calendar */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Operating Hours
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      placeholder="Mon-Sat: 8:30 AM - 7:00 PM"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>AI Voice Assistant Tone & Persona</span>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                </label>
                <textarea
                  rows={3}
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Define how the AI receptionist should speak to callers..."
                  className="w-full p-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">Google Calendar Sync</div>
                    <div className="text-[11px] text-slate-400">Enable automated real-time slot checking & booking</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={connectGoogleCalendar}
                  onChange={(e) => setConnectGoogleCalendar(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Configuring AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Launch Portal</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
