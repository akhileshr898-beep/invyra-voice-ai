"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Simulator } from "@/components/Simulator";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { SettingsView } from "@/components/SettingsView";
import { BusinessProfileModal } from "@/components/BusinessProfileModal";
import { Business, Workflow, ConversationRecord } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"simulator" | "builder" | "dashboard" | "calendar" | "settings">("simulator");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [bizRes, wfRes, convRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/workflows"),
        fetch("/api/conversations"),
      ]);

      const bizData = await bizRes.json();
      const wfData = await wfRes.json();
      const convData = await convRes.json();

      const bizList: Business[] = bizData.businesses || [];
      setBusinesses(bizList);
      if (!selectedBusiness && bizList.length > 0) {
        setSelectedBusiness(bizList[0]);
      }

      setWorkflows(wfData.workflows || []);
      setConversations(convData.records || []);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBusinessCreated = (newBiz: Business) => {
    setBusinesses([newBiz, ...businesses]);
    setSelectedBusiness(newBiz);
    fetchData();
  };

  const handleBusinessDeleted = async (bizId: string) => {
    try {
      const res = await fetch(`/api/businesses?id=${bizId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to remove business.");
        return;
      }

      const remaining = businesses.filter((b) => b.id !== bizId);
      setBusinesses(remaining);
      if (selectedBusiness?.id === bizId && remaining.length > 0) {
        setSelectedBusiness(remaining[0]);
      }
      fetchData();
    } catch (err) {
      console.error("Failed to delete business:", err);
      alert("Error removing business profile.");
    }
  };

  const handleWorkflowSaved = (savedWf: Workflow) => {
    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === savedWf.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = savedWf;
        return copy;
      }
      return [savedWf, ...prev];
    });
  };

  if (loading || !selectedBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-blue-500/30">
          <span className="font-bold text-lg">AI</span>
        </div>
        <h2 className="text-base font-bold text-slate-800">Initializing Invyra Voice AI...</h2>
        <p className="text-xs text-slate-500 mt-1">Loading workflows, businesses, and Google Calendar tools</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={setSelectedBusiness}
        onOpenNewBusinessModal={() => setBusinessModalOpen(true)}
        onDeleteBusiness={handleBusinessDeleted}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "simulator" && (
          <Simulator
            business={selectedBusiness}
            workflows={workflows}
            onConversationFinished={fetchData}
          />
        )}

        {activeTab === "builder" && (
          <WorkflowBuilder
            business={selectedBusiness}
            workflows={workflows}
            onWorkflowSaved={handleWorkflowSaved}
          />
        )}

        {activeTab === "dashboard" && (
          <Dashboard
            business={selectedBusiness}
            conversations={conversations}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "calendar" && <CalendarView />}

        {activeTab === "settings" && (
          <SettingsView
            businesses={businesses}
            onDeleteBusiness={handleBusinessDeleted}
            onOpenNewBusinessModal={() => setBusinessModalOpen(true)}
          />
        )}
      </main>

      {/* Business Profile Creation Modal */}
      <BusinessProfileModal
        isOpen={businessModalOpen}
        onClose={() => setBusinessModalOpen(false)}
        onCreated={handleBusinessCreated}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Invyra Voice AI &bull; Mobile-First Voice Personal Assistant</span>
          <span className="text-[11px] text-slate-400">
            Next.js &bull; Serverless Functions &bull; Deepgram (Nova-2 & Aura) &bull; Gemini Tool Calling &bull; Google Calendar &bull; Supabase
          </span>
        </div>
      </footer>
    </div>
  );
}
