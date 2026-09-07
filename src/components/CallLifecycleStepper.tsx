"use client";

import React from "react";
import { Check, GitBranch } from "lucide-react";
import { Workflow } from "@/lib/types";

interface CallLifecycleStepperProps {
  currentStep?: 1 | 2 | 3 | 4 | 5;
  activeWorkflow?: Workflow;
}

export function CallLifecycleStepper({
  currentStep = 3,
  activeWorkflow,
}: CallLifecycleStepperProps) {
  const steps = [
    {
      step: 1,
      title: "Missed Call",
      subtitle: "Call detected",
    },
    {
      step: 2,
      title: "Understand Intent",
      subtitle: "AI analyzing request",
    },
    {
      step: 3,
      title: "Collect Details",
      subtitle: "Capturing information",
    },
    {
      step: 4,
      title: "Calendar Action",
      subtitle: "Check availability",
    },
    {
      step: 5,
      title: "Follow-up",
      subtitle: "Send confirmation",
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      
      {/* 5-Step Pipeline Strip */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 lg:pb-0 flex-1">
        {steps.map((s, idx) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-2.5 min-w-fit">
                {/* Step Circle Indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>

                {/* Step Labels */}
                <div>
                  <div className={`text-xs font-bold leading-tight ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-500"
                  }`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {s.subtitle}
                  </div>
                </div>
              </div>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div className={`hidden sm:block w-8 sm:w-12 h-0.5 rounded-full ${
                  s.step < currentStep ? "bg-emerald-500" : "bg-slate-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Workflow Badge on Right */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-800 text-xs font-medium flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
          <GitBranch className="w-3 h-3" />
        </div>
        <div className="leading-tight">
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">
            Active Workflow:
          </span>
          <span className="font-bold text-slate-800 truncate max-w-[240px] block">
            {activeWorkflow?.name || "Clinic Missed Call - Appointment Booking & Rescheduling"}
          </span>
        </div>
      </div>

    </div>
  );
}
