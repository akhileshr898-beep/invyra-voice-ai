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
  const [industry, setIndustry] = useState("Clinic / Healthcare");
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Create Business Profile</h3>
              <p className="text-xs text-slate-500">Configure business identity for automated callbacks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lotus Dental Care or Bella's Pâtisserie"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Clinic & Healthcare">Clinic & Healthcare</option>
                <option value="Bakery & Cake Shop">Bakery & Cake Shop</option>
                <option value="Delivery & Logistics">Delivery & Logistics</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Home & Repair Service">Home & Repair Service</option>
                <option value="Custom Business">Custom Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assistant Tone of Voice</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
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
