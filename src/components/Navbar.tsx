"use client";

import React, { useState } from "react";
import { 
  PhoneCall, 
  Workflow as WorkflowIcon, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon,
  Building2,
  PlusCircle,
  ChevronDown,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Business } from "@/lib/types";

interface NavItem {
  id: "simulator" | "builder" | "dashboard" | "calendar" | "settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavbarProps {
  activeTab: "simulator" | "builder" | "dashboard" | "calendar" | "settings";
  setActiveTab: (tab: "simulator" | "builder" | "dashboard" | "calendar" | "settings") => void;
  businesses: Business[];
  selectedBusiness: Business | null;
  onSelectBusiness: (business: Business) => void;
  onOpenNewBusinessModal: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onOpenNewBusinessModal,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: "simulator", label: "Voice Simulator", icon: PhoneCall, badge: "Live AI" },
    { id: "builder", label: "Workflow Builder", icon: WorkflowIcon },
    { id: "dashboard", label: "Dashboard & Records", icon: LayoutDashboard },
    { id: "calendar", label: "Google Calendar", icon: CalendarIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Invyra Voice AI
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3" /> Deepgram + Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Missed-Call Voice Personal Assistant
              </p>
            </div>
          </div>

          {/* Business Profile Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium transition border border-slate-200"
            >
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="max-w-[130px] sm:max-w-[200px] truncate">
                {selectedBusiness?.name || "Select Business"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Business Profile
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        onSelectBusiness(biz);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition ${
                        selectedBusiness?.id === biz.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{biz.name}</div>
                        <div className="text-[10px] text-slate-400">{biz.industry}</div>
                      </div>
                      {selectedBusiness?.id === biz.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewBusinessModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create New Business Profile
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
