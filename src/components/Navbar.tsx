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
  X,
  Activity,
  HeartPulse,
  Cake,
  Truck,
  Trash2
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
  onDeleteBusiness?: (id: string) => Promise<void> | void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onOpenNewBusinessModal,
  onDeleteBusiness,
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

  const getIndustryIcon = (industry: string) => {
    const ind = industry.toLowerCase();
    if (ind.includes("clinic") || ind.includes("health")) return HeartPulse;
    if (ind.includes("bakery") || ind.includes("cake")) return Cake;
    if (ind.includes("logistics") || ind.includes("delivery")) return Truck;
    return Building2;
  };

  const IndustryIcon = selectedBusiness ? getIndustryIcon(selectedBusiness.industry) : Building2;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Telephony Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition group-hover:scale-105">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  Invyra<span className="text-blue-600">.ai</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                  <Sparkles className="w-3 h-3 text-blue-500" /> Voice Assistant
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hidden sm:flex font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Deepgram Nova-2 + Aura &bull; Gemini 1.5 &bull; Google Calendar</span>
              </div>
            </div>
          </div>

          {/* Business Profile Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-semibold transition border border-slate-200/80 shadow-xs active:scale-[0.98]"
            >
              <div className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-blue-600">
                <IndustryIcon className="w-3.5 h-3.5" />
              </div>
              <span className="max-w-[130px] sm:max-w-[210px] truncate text-slate-900">
                {selectedBusiness?.name || "Select Business"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Switch Business</span>
                  <span className="text-[10px] font-mono text-slate-400">{businesses.length} active</span>
                </div>
                <div className="max-h-60 overflow-y-auto px-1.5 space-y-1">
                  {businesses.map((biz) => {
                    const Icon = getIndustryIcon(biz.industry);
                    const isSelected = selectedBusiness?.id === biz.id;
                    const canDelete = businesses.length > 1;
                    return (
                      <div
                        key={biz.id}
                        className={`group w-full px-2.5 py-1.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition ${
                          isSelected
                            ? "bg-blue-50/80 text-blue-700"
                            : "text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectBusiness(biz);
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-2.5 truncate flex-1 text-left py-1"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="truncate flex-1">
                            <div className="truncate font-semibold text-slate-900">{biz.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{biz.industry}</div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mr-1" title="Currently Active"></div>
                          )}
                          {onDeleteBusiness && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canDelete) {
                                  alert("Cannot remove the last remaining business profile. At least one profile is required.");
                                  return;
                                }
                                if (confirm(`Are you sure you want to remove "${biz.name}"?\n\nThis will also remove its associated workflows.`)) {
                                  onDeleteBusiness(biz.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition ${
                                canDelete 
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-70 group-hover:opacity-100" 
                                  : "text-slate-300 cursor-not-allowed opacity-30"
                              }`}
                              title={canDelete ? `Remove ${biz.name}` : "At least one business profile is required"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewBusinessModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50/80 transition active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create New Business Profile
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm shadow-black/5 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-md">
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
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1 shadow-2xl animate-in slide-in-from-top-3 duration-200">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
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
