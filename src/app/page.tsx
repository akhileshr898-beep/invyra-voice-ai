"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { CallLifecycleStepper } from "@/components/CallLifecycleStepper";
import { Simulator } from "@/components/Simulator";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { SettingsView } from "@/components/SettingsView";
import { BusinessProfileModal } from "@/components/BusinessProfileModal";
import { Business, Workflow, ConversationRecord } from "@/lib/types";
import { PhoneCall, Users, Heart, Sparkles, Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"simulator" | "dashboard" | "workflows" | "calendar" | "settings">("simulator");
  const [simulatorStep, setSimulatorStep] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; owner_name: string } | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        router.push("/onboarding");
        return;
      }

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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["simulator", "dashboard", "workflows", "calendar", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
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
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-blue-500/30">
          <span className="font-bold text-lg">AI</span>
        </div>
        <h2 className="text-base font-bold text-slate-200">Verifying Session & Loading Invyra Voice AI...</h2>
        <p className="text-xs text-slate-400 mt-1">Loading tenant-isolated workflows, scheduling tools and voice models</p>
      </div>
    );
  }

  const activeWorkflow = workflows.find((w) => w.business_id === selectedBusiness.id) || workflows[0];

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-900 flex overflow-x-hidden">
      
      {/* Left Sidebar Navigation (Matching Reference Design) */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        activeBusiness={selectedBusiness}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar (Matching Reference Design) */}
        <Header
          businesses={businesses}
          activeBusiness={selectedBusiness}
          onSelectBusiness={handleSelectBusiness}
          onOpenNewBusinessModal={() => setBusinessModalOpen(true)}
          userEmail={currentUser?.email}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          
          {/* Subheader: Real-Time Call Progress Stepper */}
          {activeTab === "simulator" && (
            <CallLifecycleStepper
              currentStep={simulatorStep}
              activeWorkflow={activeWorkflow}
            />
          )}

          {/* Active View */}
          {activeTab === "simulator" && (
            <Simulator
              business={selectedBusiness}
              workflows={workflows}
              onStepChange={(step) => setSimulatorStep(step)}
              onConversationFinished={() => fetchBusinessData(selectedBusiness.id)}
            />
          )}

          {activeTab === "workflows" && (
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
              selectedBusiness={selectedBusiness}
              currentUser={currentUser}
              onBusinessUpdated={(updated) => {
                setSelectedBusiness(updated);
                setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
              }}
              onDeleteBusiness={handleBusinessDeleted}
              onOpenNewBusinessModal={() => setBusinessModalOpen(true)}
              onSignOut={handleLogout}
            />
          )}

        </main>

        {/* Bottom Trust Banner (Matching Reference Design Footer) */}
        <footer className="bg-white border-t border-slate-200/90 py-3.5 px-6 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            
            {/* Left: Purpose Statement */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  Voice AI for a More Responsive Practice
                </div>
                <div className="text-[11px] text-slate-400">
                  Capture every opportunity. Deliver exceptional care.
                </div>
              </div>
            </div>

            {/* Center: Metric Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <PhoneCall className="w-3 h-3 text-emerald-500" />
                <span>Fewer Missed Calls</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <Users className="w-3 h-3 text-blue-500" />
                <span>More Appointments</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                <Heart className="w-3 h-3 text-indigo-500" />
                <span>Happier Patients</span>
              </div>
            </div>

            {/* Right: Invyra.ai Signature */}
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <div className="flex items-center gap-0.5">
                  <span className="w-0.5 h-2 bg-white rounded-full"></span>
                  <span className="w-0.5 h-3.5 bg-white rounded-full"></span>
                  <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
                </div>
              </div>
              <span className="font-extrabold">Invyra<span className="text-blue-600">.ai</span></span>
              <span className="text-slate-400 font-normal text-[11px]">&bull; Voice AI Assistant</span>
            </div>

          </div>
        </footer>

      </div>

      {/* Business Profile Creation Modal */}
      <BusinessProfileModal
        isOpen={businessModalOpen}
        onClose={() => setBusinessModalOpen(false)}
        onCreated={handleBusinessCreated}
      />

    </div>
  );
}
