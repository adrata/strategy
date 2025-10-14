"use client";

import React, { useState, useEffect } from "react";
import { SpeedrunPerson, ValueIdea, Note } from "../types/SpeedrunTypes";
import { LeadDetailsReportService } from "./lead-details/LeadDetailsReportService";
import { LeadDetailsUtilities } from "./lead-details/LeadDetailsUtilities";
import { LeadDetailsHeader } from "./lead-details/LeadDetailsHeader";
import { LeadDetailsModalManager } from "./lead-details/LeadDetailsModalManager";
import { LeadDetailsTabContent } from "./lead-details/LeadDetailsTabContent";
import { UpdatePersonPopup } from "./UpdatePersonPopup";
import { TABS } from "./lead-details/LeadDetailsTypes";

// Import Action Platform context
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useUnifiedAuth } from "@/platform/auth";
import { CompanyDetailView } from "@/platform/ui/components/CompanyDetailView";

interface SpeedrunLeadDetailsProps {
  person: SpeedrunPerson;
  personIndex: number;
  totalPersons: number;
  allPeople: SpeedrunPerson[];
  onBack: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onSnooze: (personId: number) => void;
  onRemove: (personId: number) => void;
  onComplete: (personId: number) => void;
}

interface LeadDetailsState {
  activeTab: string;
  activeReport: string | null;
  showSnoozeModal: boolean;
  showRemoveModal: boolean;
  showCompanyDetail: boolean;
  showMoreActions: boolean;
  showSnoozeRemoveModal: boolean;
  powerDialerVisible: boolean;
  isCalling: boolean;
  isListening: boolean;
  dynamicReports: ValueIdea[];
  isLoadingReports: boolean;
  notes: Note[];
  newNote: string;
  showAutoDialerPopup: boolean;
  showPowerDialer: boolean;
  showUpdatePopup: boolean;
  currentDialerContacts: any[];
}

export function SpeedrunLeadDetails({
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
    showUpdatePopup: false,
    currentDialerContacts: [],
  });

  // Generate reports based on person's role
  useEffect(() => {
    const role =
      person.customFields?.monacoEnrichment?.buyerGroupAnalysis?.role ||
      person.relationship ||
      "Stakeholder";
    console.log("🔍 Generating reports for role:", role);
    const reports = LeadDetailsReportService.getFallbackReports(role);
    setState((prev) => ({ ...prev, dynamicReports: reports }));
  }, [person]);

  // Track tab state changes
  useEffect(() => {
    console.log(
      "🔍 [TAB STATE] activeTab changed to:",
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
    console.log("🎵 Pulse button clicked for:", person.name);
  };

  // Handle update functionality
  const handleUpdate = () => {
    setState((prev) => ({ ...prev, showUpdatePopup: true }));
    console.log("📝 Update button clicked for:", person.name);
  };

  // Handle person update save
  const handlePersonUpdate = async (updatedData: Partial<SpeedrunPerson>) => {
    try {
      console.log("💾 Saving updated person data:", updatedData);
      
      // Make API call to update person
      const response = await fetch(`/api/v1/people/${person.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update person');
      }

      const result = await response.json();
      console.log("✅ Successfully updated person:", result.data);
      
      // Show success message
      setSuccessMessage("Contact updated successfully!");
      
      // Close popup
      setState((prev) => ({ ...prev, showUpdatePopup: false }));
      
      // TODO: Trigger record refresh to show updated data
      // This would typically involve calling a refresh function passed as a prop
      
    } catch (error) {
      console.error("❌ Error updating person:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update contact");
    }
  };

  // Handle report clicks
  const handleReportClick = (reportUrl: string) => {
    console.log("📊 Opening Report:", reportUrl);
    setState((prev) => ({ ...prev, activeReport: reportUrl }));
  };

  const handleReportBack = () => {
    setState((prev) => ({ ...prev, activeReport: null }));
  };

  // Handle company detail view
  const handleCompanyDetailClick = () => {
    console.log(
      "🏢 [MARK_I] Navigating to company detail for:",
      person.company,
    );
    ui.handleCompanyClick(person.company);
    setState((prev) => ({ ...prev, showCompanyDetail: false }));
    onBack();
  };

  // Handle tab changes
  const handleTabClick = (tab: string) => {
    console.log(`🔄 Switching to tab: ${tab} for person: ${person.name}`);
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
      `📞 Call completed for contact ${contactId}: ${outcome}`,
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
    return <CompanyDetailView companyName={typeof person.company === 'object' ? person.company?.name : person.company} onBack={onBack} />;
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
    <div className="h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto invisible-scrollbar p-4"
        style={{
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingTop: "2rem", // Add extra top padding to shift content down
        }}
      >
        <div className="w-full px-0">
          {/* Header with back button and title */}
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
            onUpdate={handleUpdate}
            onSnooze={() =>
              setState((prev) => ({ ...prev, showSnoozeRemoveModal: true }))
            }
            onRemove={onRemove}
            canNavigatePrevious={canNavigatePrevious}
            canNavigateNext={canNavigateNext}
          />

          {/* Tabs */}
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

          {/* Tab Content */}
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
          />
        </div>
      </div>

      {/* Modals */}
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

      {/* Update Person Popup */}
      <UpdatePersonPopup
        isOpen={state.showUpdatePopup}
        onClose={() => setState((prev) => ({ ...prev, showUpdatePopup: false }))}
        person={person}
        onSave={handlePersonUpdate}
      />
    </div>
  );
}
