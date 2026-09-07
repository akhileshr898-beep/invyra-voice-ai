"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Mic, 
  GitBranch, 
  Calendar, 
  Stethoscope, 
  Settings, 
  Sparkles,
  X
} from "lucide-react";
import { Business } from "@/lib/types";

interface SidebarProps {
  currentTab: "simulator" | "dashboard" | "workflows" | "calendar" | "settings";
  onSelectTab: (tab: "simulator" | "dashboard" | "workflows" | "calendar" | "settings") => void;
  activeBusiness: Business;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  activeBusiness,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard & Records",
      icon: LayoutDashboard,
    },
    {
      id: "simulator" as const,
      label: "Voice Simulator",
      icon: Mic,
    },
    {
      id: "workflows" as const,
      label: "Workflow Builder",
      icon: GitBranch,
    },
    {
      id: "calendar" as const,
      label: "Google Calendar",
      icon: Calendar,
    },
    {
      id: "settings" as const,
      label: activeBusiness.industry.includes("Clinic") ? "Clinic & Healthcare" : activeBusiness.industry,
      icon: Stethoscope,
      onClick: () => onSelectTab("settings"),
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d] text-slate-200 flex flex-col justify-between border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Soundwave Icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">
                  Invyra<span className="text-blue-400">.ai</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                  Voice AI Personal Assistant
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item, idx) => {
              const isActive = currentTab === item.id && idx !== 4;
              const Icon = item.icon;

              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      onSelectTab(item.id);
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Promo Card */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-inner">
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Always On</span>
          </div>
          <h4 className="text-xs font-extrabold text-white leading-snug">
            Turn Missed Calls into Booked Appointments
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Always Growing Your Practice with Autonomous Voice Triage.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Invyra.ai</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              99.9% Live
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
