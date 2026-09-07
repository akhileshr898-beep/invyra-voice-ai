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
  MessageSquare
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
  // Current business workflows
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

  // Load selected workflow into form
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
    { num: 1, label: "Identity & Trigger" },
    { num: 2, label: "Greeting & Persona" },
    { num: 3, label: "Data Fields to Collect" },
    { num: 4, label: "Urgency Rules" },
    { num: 5, label: "Action & Closing" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header & Workflow Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Custom Workflow Builder
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Business: <strong className="text-slate-800">{business.name}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Configure Voice Assistant Workflow
          </h2>
          <p className="text-xs text-slate-500">
            Define triggers, questions, conditional urgency logic, and Google Calendar actions.
          </p>
        </div>

        {/* Action Buttons & Selectors */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {businessWorkflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
            <option value="new">+ Create New Workflow</option>
          </select>

          <button
            onClick={resetBlankWorkflow}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1"
            title="Start New Workflow"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
        {steps.map((s) => {
          const isCurrent = activeStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num as any)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isCurrent ? "bg-white text-blue-600" : "bg-slate-200 text-slate-700"
              }`}>
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Step Content Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: IDENTITY & TRIGGER */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 1: Workflow Identity & Trigger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Name your workflow and verify the automated missed-call event trigger.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clinic Appointment Booking & Follow-up"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trigger Event
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border-2 border-blue-600 bg-blue-50/40 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <WorkflowIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Missed Call (Automated Callback)</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Triggered when an incoming customer call is not answered within 15 seconds.
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 flex items-start gap-3 opacity-80">
                    <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Manual / Simulator Trigger</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Testable anytime via the Voice Simulator tab.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-800 cursor-pointer">
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
              <h3 className="text-lg font-bold text-slate-900">Step 2: Opening Greeting & Personality</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The opening sentence spoken by Deepgram Aura TTS as soon as the callback connects.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Opening Greeting (Spoken by AI)
                </label>
                <textarea
                  rows={3}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hello! This is Invyra Medical Care calling you back after missing your call..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tip: Keep it courteous and prompt the caller for their intent (e.g. appointment booking, cake order, status update).
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Bilingual Handling (English & Hindi)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The Voice AI assistant automatically detects whether the caller speaks in English or Hindi (or Hinglish), seamlessly adapting its tone and greeting in real-time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DATA FIELDS TO COLLECT */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Questions & Data Fields to Collect</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify what parameters Gemini must gather and validate from the caller.
                </p>
              </div>
              <button
                onClick={addField}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                      Field #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeField(idx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Internal Key
                      </label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(idx, { key: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(idx, { type: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
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
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      AI Spoken Prompt Question
                    </label>
                    <input
                      type="text"
                      value={field.promptQuestion}
                      onChange={(e) => updateField(idx, { promptQuestion: e.target.value })}
                      placeholder="e.g. Which doctor or specialty are you looking for?"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <label htmlFor={`req-${idx}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                      Required Field (Assistant will not conclude until this is provided)
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
                <h3 className="text-lg font-bold text-slate-900">Step 4: Simple Conditional Logic & Urgency</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define business rules that flag incoming calls as Urgent or High Priority.
                </p>
              </div>
              <button
                onClick={addCondition}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition Rule
              </button>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
              <strong>Example Condition:</strong> If cake required date is within 24 hours &rarr; mark order as <strong>Urgent</strong>. Otherwise &rarr; mark as Normal.
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" />
                      Condition #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeCondition(idx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        If Field
                      </label>
                      <select
                        value={cond.field}
                        onChange={(e) => updateCondition(idx, { field: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {fields.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label} ({f.key})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Operator
                      </label>
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, { operator: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="less_than_or_equal_hours">&le; Hours (e.g. &le; 24h)</option>
                        <option value="contains">Contains Keyword</option>
                        <option value="equals">Equals Exactly</option>
                        <option value="greater_than">&gt; Greater Than</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => updateCondition(idx, { value: e.target.value })}
                        placeholder="24 or chest pain"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Set Priority Urgency
                      </label>
                      <select
                        value={cond.resultUrgency}
                        onChange={(e) => updateCondition(idx, { resultUrgency: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Action Note / Operational Prompt
                    </label>
                    <input
                      type="text"
                      value={cond.resultNote || ""}
                      onChange={(e) => updateCondition(idx, { resultNote: e.target.value })}
                      placeholder="e.g. Rush kitchen notice required or medical triage alert"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
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
              <h3 className="text-lg font-bold text-slate-900">Step 5: Post-Collection Action & Closing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select what happens once all fields are collected, and configure the goodbye message.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Action After Collection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <label className={`border-2 rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition ${
                    actionAfterCollection === "create_calendar_event" ? "border-blue-600 bg-blue-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionAfterCollection === "create_calendar_event"}
                      onChange={() => setActionAfterCollection("create_calendar_event")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Google Calendar Sync
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Check availability, book event, or reschedule appointment on Google Calendar via Gemini tool calling.
                      </div>
                    </div>
                  </label>

                  <label className={`border-2 rounded-2xl p-4 flex items-start gap-3 cursor-pointer transition ${
                    actionAfterCollection === "create_order_enquiry" ? "border-blue-600 bg-blue-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="radio"
                      name="actionType"
                      checked={actionAfterCollection === "create_order_enquiry"}
                      onChange={() => setActionAfterCollection("create_order_enquiry")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        Create Order / Service Enquiry
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Generate structured order summary, apply conditional urgency rules, and log to dashboard.
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Spoken Closing Message
                </label>
                <textarea
                  rows={3}
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  placeholder="Thank you! Your appointment request has been scheduled on our calendar..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation & Save Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((activeStep - 1) as any)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
              >
                Previous Step
              </button>
            )}
            {activeStep < 5 && (
              <button
                onClick={() => setActiveStep((activeStep + 1) as any)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs sm:text-sm transition flex items-center gap-1"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Workflow Saved Successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
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
