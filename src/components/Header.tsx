"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Menu,
  PlusCircle
} from "lucide-react";
import { Business } from "@/lib/types";

interface HeaderProps {
  businesses: Business[];
  activeBusiness: Business;
  onSelectBusiness: (biz: Business) => void;
  onOpenNewBusinessModal?: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({
  businesses,
  activeBusiness,
  onSelectBusiness,
  onOpenNewBusinessModal,
  userEmail,
  onLogout,
  onToggleMobileMenu,
}: HeaderProps) {
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute initials for avatar (e.g. "Apex Care" -> "AC")
  const initials = activeBusiness.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
      
      {/* Left: Mobile Menu Toggle & Business Selector */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Business Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setShowBizDropdown(!showBizDropdown)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="truncate max-w-[140px] sm:max-w-[220px]">
              {activeBusiness.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
          </button>

          {/* Business Dropdown Menu */}
          {showBizDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Business Profile
              </div>
              <div className="max-h-60 overflow-y-auto">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      onSelectBusiness(biz);
                      setShowBizDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition ${
                      biz.id === activeBusiness.id
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-semibold">{biz.name}</div>
                      <div className="text-[10px] text-slate-400">{biz.industry}</div>
                    </div>
                    {biz.id === activeBusiness.id && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>

              {onOpenNewBusinessModal && (
                <div className="pt-2 mt-1 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      setShowBizDropdown(false);
                      onOpenNewBusinessModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 font-bold rounded-xl transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    + Add New Business Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search calls, patients, or appointments..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right: Notifications, User Profile & Live Clock */}
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px] leading-tight">
                {activeBusiness.name}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                Better Conversations.
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Profile Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800">{activeBusiness.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{userEmail || "owner@business.com"}</div>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>

        {/* Real-time Clock Widget */}
        <div className="hidden xl:flex flex-col items-end px-3.5 py-1 rounded-2xl bg-slate-950 text-white font-mono shadow-xs select-none">
          <span className="text-[9px] text-slate-400 font-sans tracking-wide">
            {currentDate || "Live Telephony"}
          </span>
          <span className="text-xs font-bold text-emerald-400 leading-tight">
            {currentTime || "10:24 AM"}
          </span>
        </div>

      </div>

    </header>
  );
}
