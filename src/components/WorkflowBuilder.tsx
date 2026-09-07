"use client";

import React, { useState, useEffect } from "react";
import { 
  Workflow, 
  WorkflowField, 
  WorkflowCondition, 
  Business 
} from "@/lib/types";
import { 
  Workflow as WorkflowIcon, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  GitBranch, 
  Sparkles, 
  ChevronRight, 
  Settings2, 
  Calendar, 
  MessageSquare,
  Volume2,
  CheckCircle2,
  Sliders,
  Layers
} from "lucide-react";

interface WorkflowBuilderProps {
  business: Business;
  workflows: Workflow[];
  onWorkflowSaved: (saved: Workflow) => void;
}

export function WorkflowBuilder({
  business,
  workflows,
  onWorkflowSaved,
}: WorkflowBuilderProps) {
  const businessWorkflows = workflows.filter((w) => w.business_id === business.id);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    businessWorkflows[0]?.id || ""
  );

  // Workflow Form State
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<"missed_call" | "manual_simulation">("missed_call");
  const [greeting, setGreeting] = useState("");
  const [fields, setFields] = useState<WorkflowField[]>([]);
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [actionAfterCollection, setActionAfterCollection] = useState<Workflow["action_after_collection"]>("create_calendar_event");
  const [closingMessage, setClosingMessage] = useState("");
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const wf = workflows.find((w) => w.id === selectedWorkflowId) || businessWorkflows[0];
    if (wf) {
      setSelectedWorkflowId(wf.id);
      setName(wf.name);
      setTrigger(wf.trigger);
      setGreeting(wf.greeting);
      setFields(wf.fields_schema || []);
      setConditions(wf.conditional_rules || []);
      setActionAfterCollection(wf.action_after_collection);
      setClosingMessage(wf.closing_message);
      setIsActive(wf.is_active);
    } else {
      resetBlankWorkflow();
    }
  }, [selectedWorkflowId, business.id]);

  const resetBlankWorkflow = () => {
    setName(`New ${business.industry} Workflow`);
    setTrigger("missed_call");
    setGreeting(`Hello! Thank you for contacting ${business.name}. We missed your call! How can I help you today?`);
    setFields([
      {
        key: "caller_name",
        label: "Customer / Patient Name",
        type: "text",
        required: true,
        promptQuestion: "May I please have your full name?",
      },
      {
        key: "phone_number",
        label: "Contact Phone",
        type: "text",
        required: true,
        promptQuestion: "What is the best phone number to reach you?",
      },
      {
        key: "request_date",
        label: "Preferred Date",
        type: "date",
        required: true,
        promptQuestion: "For what date would you like to schedule this?",
      }
    ]);
    setConditions([
      {
        field: "request_date",
        operator: "less_than_or_equal_hours",
        value: "24",
        resultUrgency: "urgent",
        resultNote: "Requested within 24 hours -> Prioritize immediate follow-up",
      }
    ]);
    setActionAfterCollection(
      business.industry.toLowerCase().includes("clinic") ? "create_calendar_event" : "create_order_enquiry"
    );
    setClosingMessage(`Thank you! All your information has been noted and our team at ${business.name} will handle this promptly.`);
    setIsActive(true);
    setSelectedWorkflowId("new");
  };

  const addField = () => {
    const newField: WorkflowField = {
      key: `field_${Date.now().toString().slice(-4)}`,
      label: "New Question / Field",
      type: "text",
      required: false,
      promptQuestion: "Could you please provide this information?",
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<WorkflowField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const addCondition = () => {
    const newCond: WorkflowCondition = {
      field: fields[0]?.key || "request_date",
      operator: "contains",
      value: "urgent",
      resultUrgency: "urgent",
      resultNote: "Mark request as urgent priority",
    };
    setConditions([...conditions, newCond]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please provide a workflow name.");
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    const payload = {
      id: selectedWorkflowId === "new" ? undefined : selectedWorkflowId,
      business_id: business.id,
      name,
      trigger,
      greeting,
      fields_schema: fields,
      conditional_rules: conditions,
      action_after_collection: actionAfterCollection,
      closing_message: closingMessage,
      is_active: isActive,
    };

    try {
      const method = selectedWorkflowId === "new" ? "POST" : "PUT";
      const res = await fetch("/api/workflows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const saved = await res.json();
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onWorkflowSaved(saved);
      if (selectedWorkflowId === "new") {
        setSelectedWorkflowId(saved.id);
      }
    } catch (err) {
      console.error("Failed to save workflow:", err);
      setIsSaving(false);
      alert("Error saving workflow. Please try again.");
    }
  };

  const steps = [
    { num: 1, label: "Identity & Trigger", desc: "Name & trigger" },
    { num: 2, label: "Greeting & Persona", desc: "Spoken greeting" },
    { num: 3, label: "Data Fields", desc: `${fields.length} questions` },
    { num: 4, label: "Urgency Rules", desc: `${conditions.length} condition rules` },
    { num: 5, label: "Action & Closing", desc: "Calendar sync" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header & Workflow Switcher */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/80 bg-slate-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-indigo-400" />
              Visual Workflow Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Profile: <strong className="text-slate-200">{business.name}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            Configure Voice Assistant Workflow
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Design your automated telephone conversation flow, schema collection, conditional urgency rules, and calendar integrations.
          </p>
        </div>

        {/* Action Buttons & Selectors */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            {businessWorkflows.map((wf) => (
              <option key={wf.id} value={wf.id} className="bg-slate-900 text-white">
                {wf.name}
              </option>
            ))}
            <option value="new" className="bg-slate-900 text-cyan-300">+ Create New Workflow</option>
          </select>

          <button
            onClick={resetBlankWorkflow}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-2xl border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 transition active:scale-95 shadow-md"
            title="Start New Workflow"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Modern Visual Stepper */}
      <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800/80 shadow-md flex items-center justify-between gap-2 overflow-x-auto">
        {steps.map((s) => {
          const isCurrent = activeStep === s.num;
          const isCompleted = activeStep > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`flex-1 min-w-[150px] py-3 px-3.5 rounded-2xl text-left transition-all relative ${
                isCurrent
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.35)] border border-indigo-400/30"
                  : isCompleted
                  ? "bg-slate-900/60 hover:bg-slate-900 text-slate-300 border border-slate-800"
                  : "bg-transparent text-slate-500 hover:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? "bg-white text-blue-600" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </span>
                <span className={`text-xs font-bold ${isCurrent ? "text-white" : "text-slate-300"}`}>
                  {s.label}
                </span>
              </div>
              <div className={`text-[10px] ml-7 truncate ${isCurrent ? "text-blue-100" : "text-slate-500"}`}>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Step Content Container */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: IDENTITY & TRIGGER */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Step 1: Workflow Identity & Trigger</h3>
              <p className="text-xs text-slate-400 mt-1">
                Name your workflow and verify the automated missed-call event trigger.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clinic Appointment Booking & Follow-up"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm font-semibold text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Trigger Event
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-cyan-500/40 bg-slate-950/90 rounded-2xl p-5 flex items-start gap-3.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                      <WorkflowIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Missed Call (Automated Outbound Callback)</div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Triggered automatically when a customer call is missed. Voice AI initiates call within 15 seconds.
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-slate-950/40 rounded-2xl p-5 flex items-start gap-3.5 opacity-60">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-300">Manual / Web Simulator Trigger</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Testable anytime by clicking "Simulate Missed Call Callback" in the Voice Simulator tab.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-xs sm:text-sm font-bold text-slate-300 cursor-pointer">
                  Activate this workflow for missed-call callbacks immediately
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: GREETING & PERSONA */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Step 2: Opening Greeting & Spoken Persona</h3>
              <p className="text-xs text-slate-400 mt-1">
                The opening sentence spoken by Deepgram Aura TTS as soon as the customer answers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Opening Greeting (Spoken by AI)</span>
                  <span className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> Deepgram Aura Voice
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hello! This is Invyra Medical Care calling you back after missing your call..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed font-medium text-white placeholder-slate-600"
                />
              </div>

              <div className="bg-gradient-to-r from-indigo-950/60 to-cyan-950/40 p-5 rounded-3xl border border-indigo-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <strong className="font-bold text-white">Bilingual English & Hindi Adaptation</strong>
                  <p>
                    Gemini AI automatically detects the caller's spoken language. If they greet in Hindi (e.g., <em>"नमस्ते, डॉक्टर से मिलना है"</em>), the assistant adapts naturally into Hindi without losing any appointment booking context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DATA FIELDS TO COLLECT */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Step 3: Questions & Data Fields to Collect</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specify what parameters Gemini must gather and validate from the caller.
                </p>
              </div>
              <button
                onClick={addField}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 border border-indigo-400/30"
              >
                <Plus className="w-4 h-4" />
                Add Question Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-900 text-cyan-300 rounded-lg border border-slate-800">
                      Question Field #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeField(idx)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Internal Key
                      </label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(idx, { key: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(idx, { type: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="text">Text (Name, Note)</option>
                        <option value="date">Date (Appointment / Delivery)</option>
                        <option value="time">Time Slot</option>
                        <option value="number">Number / Quantity</option>
                        <option value="select">Selection / Dropdown</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      AI Spoken Prompt Question
                    </label>
                    <input
                      type="text"
                      value={field.promptQuestion}
                      onChange={(e) => updateField(idx, { promptQuestion: e.target.value })}
                      placeholder="e.g. Which doctor or specialty are you looking for?"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700"
                    />
                    <label htmlFor={`req-${idx}`} className="text-xs font-semibold text-slate-300 cursor-pointer">
                      Required Field (Assistant will politely follow up until caller provides this)
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: CONDITIONAL LOGIC & URGENCY */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Step 4: Conditional Urgency Logic</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Define business rules that flag incoming calls as Urgent or High Priority.
                </p>
              </div>
              <button
                onClick={addCondition}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/25 transition active:scale-95 border border-purple-400/30"
              >
                <Plus className="w-4 h-4" />
                Add Condition Rule
              </button>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200 leading-relaxed font-medium">
              <strong className="text-white">Example Urgency Condition:</strong> If cake required date is within 24 hours &rarr; mark order as <strong className="text-rose-400">Urgent Priority</strong>. If patient mentions "acute chest pain" &rarr; mark as <strong className="text-rose-400">Urgent Triage</strong>.
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      Condition Rule #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeCondition(idx)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        If Field
                      </label>
                      <select
                        value={cond.field}
                        onChange={(e) => updateCondition(idx, { field: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                      >
                        {fields.map((f) => (
                          <option key={f.key} value={f.key} className="bg-slate-900 text-white">
                            {f.label} ({f.key})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Operator
                      </label>
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, { operator: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="less_than_or_equal_hours">&le; Hours (e.g. &le; 24h)</option>
                        <option value="contains">Contains Keyword</option>
                        <option value="equals">Equals Exactly</option>
                        <option value="greater_than">&gt; Greater Than</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => updateCondition(idx, { value: e.target.value })}
                        placeholder="24 or chest pain"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Priority Level
                      </label>
                      <select
                        value={cond.resultUrgency}
                        onChange={(e) => updateCondition(idx, { resultUrgency: e.target.value as any })}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Action Note / Operational Prompt
                    </label>
                    <input
                      type="text"
                      value={cond.resultNote || ""}
                      onChange={(e) => updateCondition(idx, { resultNote: e.target.value })}
                      placeholder="e.g. Rush kitchen notice required or emergency clinic triage alert"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: ACTION & CLOSING */}
        {activeStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Step 5: Post-Collection Action & Closing</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select what happens once all fields are collected, and configure the goodbye message.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Action After Collection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <label className={`border rounded-3xl p-5 flex items-start gap-3.5 cursor-pointer transition ${
                    actionAfterCollection === "create_calendar_event" 
                      ? "border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30" 
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}>
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionAfterCollection === "create_calendar_event"}
                      onChange={() => setActionAfterCollection("create_calendar_event")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Google Calendar Sync
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Check availability, book event, or reschedule appointment on Google Calendar via Gemini tool calling.
                      </div>
                    </div>
                  </label>

                  <label className={`border rounded-3xl p-5 flex items-start gap-3.5 cursor-pointer transition ${
                    actionAfterCollection === "create_order_enquiry" 
                      ? "border-indigo-500/60 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30" 
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}>
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionAfterCollection === "create_order_enquiry"}
                      onChange={() => setActionAfterCollection("create_order_enquiry")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        Create Order / Service Enquiry
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Generate structured order summary, apply conditional urgency rules, and log to dashboard.
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Spoken Closing Message
                </label>
                <textarea
                  rows={3}
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  placeholder="Thank you! Your appointment request has been scheduled on our calendar..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed font-medium text-white placeholder-slate-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation & Save Button */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((activeStep - 1) as any)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition"
              >
                Previous Step
              </button>
            )}
            {activeStep < 5 && (
              <button
                onClick={() => setActiveStep((activeStep + 1) as any)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center gap-1 shadow-md shadow-blue-500/20"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Workflow Saved Successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition active:scale-95 disabled:opacity-50 border border-emerald-400/30"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Workflow Configuration"}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
