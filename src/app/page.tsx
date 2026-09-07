"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Simulator } from "@/components/Simulator";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { SettingsView } from "@/components/SettingsView";
import { BusinessProfileModal } from "@/components/BusinessProfileModal";
import { Business, Workflow, ConversationRecord } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"simulator" | "builder" | "dashboard" | "calendar" | "settings">("simulator");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; owner_name: string } | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tenant-scoped workflows and conversations for a specific business
  const fetchBusinessData = useCallback(async (businessId: string) => {
    try {
      const [wfRes, convRes] = await Promise.all([
        fetch(`/api/workflows?businessId=${businessId}`),
        fetch(`/api/conversations?businessId=${businessId}`),
      ]);

      const wfData = await wfRes.json();
      const convData = await convRes.json();

      setWorkflows(wfData.workflows || []);
      setConversations(convData.records || []);
    } catch (err) {
      console.error("Failed to load business workflows/conversations:", err);
    }
  }, []);

  // Check authentication & load user businesses
  const loadUserAndBusinesses = useCallback(async (preferredBusinessId?: string) => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meData = await meRes.json();
      if (!meData.authenticated || !meData.user) {
        router.push("/login");
        return;
      }

      setCurrentUser(meData.user);

      const bizList: Business[] = meData.businesses || [];
      setBusinesses(bizList);

      if (bizList.length === 0) {
        // No businesses registered under this account yet
        router.push("/onboarding");
        return;
      }

      // Select preferred or first business
      const activeBiz = preferredBusinessId 
        ? bizList.find((b) => b.id === preferredBusinessId) || bizList[0]
        : (selectedBusiness ? bizList.find((b) => b.id === selectedBusiness.id) || bizList[0] : meData.current_business || bizList[0]);

      setSelectedBusiness(activeBiz);
      if (activeBiz) {
        await fetchBusinessData(activeBiz.id);
      }
    } catch (err) {
      console.error("Failed to load user and business state:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router, selectedBusiness, fetchBusinessData]);

  useEffect(() => {
    loadUserAndBusinesses();
  }, [loadUserAndBusinesses]);

  const handleSelectBusiness = (biz: Business) => {
    setSelectedBusiness(biz);
    fetchBusinessData(biz.id);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handleBusinessCreated = (newBiz: Business) => {
    setBusinesses((prev) => [newBiz, ...prev]);
    setSelectedBusiness(newBiz);
    fetchBusinessData(newBiz.id);
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
        fetchBusinessData(remaining[0].id);
      }
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-indigo-500/30">
          <span className="font-bold text-lg">AI</span>
        </div>
        <h2 className="text-base font-bold text-slate-200">Verifying Session & Loading Invyra Voice AI...</h2>
        <p className="text-xs text-slate-500 mt-1">Loading tenant-isolated workflows, scheduling tools and voice models</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={handleSelectBusiness}
        onOpenNewBusinessModal={() => setBusinessModalOpen(true)}
        onDeleteBusiness={handleBusinessDeleted}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "simulator" && (
          <Simulator
            business={selectedBusiness}
            workflows={workflows}
            onConversationFinished={() => fetchBusinessData(selectedBusiness.id)}
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
            onRefresh={() => fetchBusinessData(selectedBusiness.id)}
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
      <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-xl py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-300">Invyra Voice AI &bull; Autonomous Enterprise Voice Receptionist</span>
          <span className="text-[11px] text-slate-500">
            Next.js &bull; Serverless Functions &bull; Deepgram (Nova-2 & Aura) &bull; Gemini 1.5 Tool Calling &bull; Google Calendar &bull; Multi-Tenant Isolation
          </span>
        </div>
      </footer>
    </div>
  );
}
