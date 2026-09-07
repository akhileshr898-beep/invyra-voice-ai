"use client";

import React, { useState } from "react";
import { Business } from "@/lib/types";
import { Building2, Save, X } from "lucide-react";

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (biz: Business) => void;
}

export function BusinessProfileModal({
  isOpen,
  onClose,
  onCreated,
}: BusinessProfileModalProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Clinic & Healthcare");
  const [phone, setPhone] = useState("+1 (555) 000-1122");
  const [timezone, setTimezone] = useState("America/New_York");
  const [operatingHours, setOperatingHours] = useState("Mon-Sat 9:00 AM - 6:00 PM");
  const [tone, setTone] = useState("Empathetic, reassuring, and solution-driven");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry,
          phone,
          timezone,
          operating_hours: operatingHours,
          tone,
        }),
      });
      const created = await res.json();
      setLoading(false);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error("Failed to create business:", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create Business Profile</h3>
              <p className="text-xs text-slate-400">Configure business identity for automated callbacks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lotus Dental Care or Bella's Pâtisserie"
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="Clinic & Healthcare" className="bg-slate-900">Clinic & Healthcare</option>
                <option value="Bakery & Cake Shop" className="bg-slate-900">Bakery & Cake Shop</option>
                <option value="Delivery & Logistics" className="bg-slate-900">Delivery & Logistics</option>
                <option value="Real Estate" className="bg-slate-900">Real Estate</option>
                <option value="Home & Repair Service" className="bg-slate-900">Home & Repair Service</option>
                <option value="Custom Business" className="bg-slate-900">Custom Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Business Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Assistant Tone of Voice</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50 border border-indigo-400/30"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Creating..." : "Save Business Profile"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
