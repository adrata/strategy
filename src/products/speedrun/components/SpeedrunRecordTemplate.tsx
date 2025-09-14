"use client";

/**
 * 🏃‍♂️ SPEEDRUN RECORD TEMPLATE
 * 
 * Dedicated record template specifically for Speedrun prospects with:
 * - Full speedrun-specific functionality
 * - Power dialer integration
 * - Dynamic reports and insights
 * - Monaco enrichment data
 * - Speedrun-optimized UI/UX
 * - Winning score analytics
 */

import React, { useState, useEffect } from "react";
import {
  SpeedrunLeadDetailsProps,
  LeadDetailsState,
  TABS,
} from "./lead-details/LeadDetailsTypes";
import { LeadDetailsReportService } from "./lead-details/LeadDetailsReportService";
import { LeadDetailsUtilities } from "./lead-details/LeadDetailsUtilities";
import { LeadDetailsHeader } from "./lead-details/LeadDetailsHeader";
import { LeadDetailsModalManager } from "./lead-details/LeadDetailsModalManager";
import { LeadDetailsTabContent } from "./lead-details/LeadDetailsTabContent";
import { Note } from "../types/SpeedrunTypes";

// Import Action Platform context
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { CompanyDetailView } from "@/platform/ui/components/CompanyDetailView";
import { InlineEditField } from "@/platform/ui/components/InlineEditField";

export function SpeedrunRecordTemplate({
  person,
  personIndex,
  totalPersons,
  allPeople,
  onBack,
  onNavigatePrevious,
  onNavigateNext,
  onSnooze,
  onRemove,
  onComplete,
}: SpeedrunLeadDetailsProps) {
  // Get Action Platform context for company navigation
  const { ui } = useAcquisitionOS();
  const { user } = useUnifiedAuth();
  
  // Get user context for API calls
  const userId = user?.id || '';
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || '';

  // Local state
  const [state, setState] = useState<LeadDetailsState>({
    activeTab: "Overview",
    activeReport: null,
    showSnoozeModal: false,
    showRemoveModal: false,
    showCompanyDetail: false,
    showMoreActions: false,
    showSnoozeRemoveModal: false,
    powerDialerVisible: false,
    isCalling: false,
    isListening: false,
    dynamicReports: [],
    isLoadingReports: false,
    notes: [],
    newNote: "",
    showAutoDialerPopup: false,
    showPowerDialer: false,
    currentDialerContacts: [],
  });

  // Generate reports based on person's role
  useEffect(() => {
    const role =
      person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role ||
      person.relationship ||
      "Stakeholder";
    console.log("🔍 [SPEEDRUN] Generating reports for role:", role);
    const reports = LeadDetailsReportService.getFallbackReports(role);
    setState((prev) => ({ ...prev, dynamicReports: reports }));
  }, [person]);

  // Track tab state changes
  useEffect(() => {
    console.log(
      "🔍 [SPEEDRUN] activeTab changed to:",
      state.activeTab,
      "for person:",
      person.name,
    );
  }, [state.activeTab, person.name]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const cleanup = LeadDetailsUtilities.setupKeyboardShortcuts(
      onComplete,
      () => setState((prev) => ({ ...prev, showAutoDialerPopup: true })),
      person.id,
    );
    return cleanup;
  }, [person.id, onComplete]);

  // Handle pulse functionality
  const handlePulse = () => {
    setState((prev) => ({ ...prev, isListening: !prev.isListening }));
    console.log("🎵 [SPEEDRUN] Pulse button clicked for:", person.name);
  };

  // Handle report clicks
  const handleReportClick = (reportUrl: string) => {
    console.log("📊 [SPEEDRUN] Opening Report:", reportUrl);
    setState((prev) => ({ ...prev, activeReport: reportUrl }));
  };

  const handleReportBack = () => {
    setState((prev) => ({ ...prev, activeReport: null }));
  };

  // Handle company detail view
  const handleCompanyDetailClick = () => {
    console.log(
      "🏢 [SPEEDRUN] Navigating to company detail for:",
      person.company,
    );
    ui.handleCompanyClick(person.company);
    setState((prev) => ({ ...prev, showCompanyDetail: false }));
    onBack();
  };

  // Handle inline field updates for speedrun
  const handleSpeedrunInlineFieldSave = async (field: string, value: string, recordId: string, recordType: string) => {
    try {
      console.log(`🔄 [SPEEDRUN] Inline updating ${field} for person:`, recordId, 'to:', value);
      
      // TODO: Implement actual speedrun inline update API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the person object locally (this would normally come from state management)
      (person as any)[field] = value;
      
      console.log(`✅ [SPEEDRUN] Inline saved ${field} for speedrun person:`, recordId);
      
    } catch (error) {
      console.error(`❌ [SPEEDRUN] Error inline saving ${field}:`, error);
      throw error;
    }
  };

  // Handle tab changes
  const handleTabClick = (tab: string) => {
    console.log(`🔄 [SPEEDRUN] Switching to tab: ${tab} for person: ${person.name}`);
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  // Add note function
  const addNote = () => {
    if (!state.newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: state.newNote.trim(),
      timestamp: new Date().toISOString(),
      author: "You",
    };

    setState((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
      newNote: "",
    }));
  };

  // Dialer functions
  const callableContacts = LeadDetailsUtilities.getCallableContacts(allPeople);

  const handleStartAutoDialer = () => {
    setState((prev) => ({ ...prev, showAutoDialerPopup: false }));
    const powerDialerContacts = callableContacts.map((p) =>
      LeadDetailsUtilities.transformPersonToContact(p),
    );
    setState((prev) => ({
      ...prev,
      currentDialerContacts: powerDialerContacts,
      showPowerDialer: true,
    }));
  };

  const handleDialSingle = (selectedPerson: any) => {
    setState((prev) => ({ ...prev, showAutoDialerPopup: false }));
    const singleContact = [
      LeadDetailsUtilities.transformPersonToContact(selectedPerson),
    ];
    setState((prev) => ({
      ...prev,
      currentDialerContacts: singleContact,
      showPowerDialer: true,
    }));
  };

  const handleCallComplete = (
    contactId: number,
    callNotes: string,
    outcome: string,
  ) => {
    console.log(
      `📞 [SPEEDRUN] Call completed for contact ${contactId}: ${outcome}`,
      callNotes,
    );
    onComplete(contactId);
  };

  const handleDialerClose = () => {
    setState((prev) => ({ ...prev, showPowerDialer: false }));
  };

  // Utility functions
  const canNavigatePrevious = () =>
    LeadDetailsUtilities.canNavigatePrevious(personIndex);
  const canNavigateNext = () =>
    LeadDetailsUtilities.canNavigateNext(personIndex, totalPersons);

  // Show company detail view if requested
  if (state.showCompanyDetail) {
    return <CompanyDetailView companyName={person.company} onBack={onBack} />;
  }

  // Render report if active
  if (state.activeReport) {
    return LeadDetailsReportService.renderReport({
      activeReport: state.activeReport,
      person,
      onReportBack: handleReportBack,
    });
  }

  return (
    <div className="h-full flex flex-col" style={{ height: "100vh" }}>
      <div
        className="flex-1 overflow-y-auto invisible-scrollbar p-4"
        style={{
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="w-full px-0">
          {/* Header with speedrun-specific controls */}
          <LeadDetailsHeader
            person={person}
            personIndex={personIndex}
            totalPersons={totalPersons}
            isListening={state.isListening}
            showMoreActions={state.showMoreActions}
            onBack={onBack}
            onNavigatePrevious={onNavigatePrevious}
            onNavigateNext={onNavigateNext}
            onComplete={onComplete}
            onDial={() =>
              setState((prev) => ({ ...prev, showAutoDialerPopup: true }))
            }
            onMoreActions={(show) =>
              setState((prev) => ({ ...prev, showMoreActions: show }))
            }
            onSnooze={() =>
              setState((prev) => ({ ...prev, showSnoozeRemoveModal: true }))
            }
            onRemove={onRemove}
            canNavigatePrevious={canNavigatePrevious}
            canNavigateNext={canNavigateNext}
          />

          {/* Speedrun-specific tabs */}
          <div
            className="flex gap-2 mb-0 pb-2 border-b border-[var(--border)]"
            style={{
              borderColor: "var(--border)",
              marginTop: "-18px",
              borderBottomWidth: "1px",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-5 py-2 text-base font-semibold rounded-t-lg transition-colors focus:outline-none
                  ${
                    state['activeTab'] === tab
                      ? "bg-[var(--background)] border-x border-t border-[var(--border)] text-[var(--foreground)] z-10"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
                  }
                `}
                style={{
                  borderBottom: state['activeTab'] === tab ? "none" : "none",
                  borderColor:
                    state['activeTab'] === tab ? "var(--border)" : "transparent",
                  marginBottom: state['activeTab'] === tab ? "-1px" : "0",
                  position: "relative",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTabClick(tab);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Speedrun-specific tab content with enrichment data and inline editing */}
          <LeadDetailsTabContent
            person={person}
            activeTab={state.activeTab}
            dynamicReports={state.dynamicReports}
            isLoadingReports={state.isLoadingReports}
            notes={state.notes}
            newNote={state.newNote}
            onReportClick={handleReportClick}
            onCompanyDetailClick={handleCompanyDetailClick}
            onSetNewNote={(note) =>
              setState((prev) => ({ ...prev, newNote: note }))
            }
            onAddNote={addNote}
            formatTimestamp={LeadDetailsUtilities.formatTimestamp}
            onInlineFieldSave={handleSpeedrunInlineFieldSave}
          />
        </div>
      </div>

      {/* Speedrun-specific modals with dialer integration */}
      <LeadDetailsModalManager
        person={person}
        allPeople={allPeople}
        showSnoozeRemoveModal={state.showSnoozeRemoveModal}
        showAutoDialerPopup={state.showAutoDialerPopup}
        showPowerDialer={state.showPowerDialer}
        currentDialerContacts={state.currentDialerContacts}
        userId={userId}
        workspaceId={workspaceId}
        onSnoozeRemoveModalClose={() =>
          setState((prev) => ({ ...prev, showSnoozeRemoveModal: false }))
        }
        onAutoDialerClose={() =>
          setState((prev) => ({ ...prev, showAutoDialerPopup: false }))
        }
        onPowerDialerClose={handleDialerClose}
        onSnooze={onSnooze}
        onRemove={onRemove}
        onComplete={onComplete}
        onStartAutoDialer={handleStartAutoDialer}
        onDialSingle={handleDialSingle}
        onCallComplete={handleCallComplete}
      />
    </div>
  );
}
