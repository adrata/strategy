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
import { useUnifiedAuth } from "@/platform/auth";
import { CompanyDetailView } from "@/platform/ui/components/CompanyDetailView";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";
import { AddCompanyModal } from "@/platform/ui/components/AddCompanyModal";

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

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Company modal state
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

  // Show success message with auto-hide
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null); // Clear any error messages
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Show error message with auto-hide
  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null); // Clear any success messages
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

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
      
      // Prepare update data
      const updateData: any = {
        [field]: field === 'globalRank' ? parseInt(value) : value,
        updatedAt: new Date().toISOString()
      };
      
      // Make API call to update person
      const response = await fetch(`/api/v1/people/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${field}`);
      }

      const result = await response.json();
      console.log(`✅ [SPEEDRUN] Successfully updated ${field} for person:`, recordId, result.data);
      
      // If this is a rank update, trigger re-ranking
      if (field === 'globalRank') {
        console.log(`🔄 [SPEEDRUN] Triggering re-ranking after manual rank update`);
        try {
          const rerankResponse = await fetch('/api/v1/speedrun/re-rank', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              manualRankUpdate: {
                personId: recordId,
                newRank: parseInt(value)
              }
            }),
          });
          
          if (rerankResponse.ok) {
            console.log(`✅ [SPEEDRUN] Re-ranking completed successfully`);
            showSuccessMessage(`✅ Rank updated to ${value} and other prospects re-ranked automatically!`);
          } else {
            console.warn(`⚠️ [SPEEDRUN] Re-ranking failed, but rank update succeeded`);
            showSuccessMessage(`✅ Rank updated to ${value}!`);
          }
        } catch (rerankError) {
          console.warn(`⚠️ [SPEEDRUN] Re-ranking failed:`, rerankError);
          showSuccessMessage(`✅ Rank updated to ${value}!`);
        }
      } else {
        // Show success message for other field updates
        const fieldName = field === 'name' ? 'Name' : 
                         field === 'email' ? 'Email' : 
                         field === 'phone' ? 'Phone' : 
                         field === 'vertical' ? 'Vertical' : field;
        showSuccessMessage(`✅ ${fieldName} updated successfully!`);
      }
      
      // Update the person object locally to reflect changes immediately
      (person as any)[field] = field === 'globalRank' ? parseInt(value) : value;
      
      console.log(`✅ [SPEEDRUN] Inline saved ${field} for speedrun person:`, recordId);
      
    } catch (error) {
      console.error(`❌ [SPEEDRUN] Error inline saving ${field}:`, error);
      const errorMsg = error instanceof Error ? error.message : `Failed to update ${field}`;
      showErrorMessage(`❌ ${errorMsg}`);
      throw error;
    }
  };

  // Handle company added and associate with speedrun person
  const handleCompanyAdded = async (newCompany: any) => {
    console.log('🏢 [SPEEDRUN] Company added, associating with person:', newCompany);
    setIsAddCompanyModalOpen(false);
    
    try {
      const updateData = {
        companyId: newCompany.id,
        company: newCompany.name
      };
      
      const response = await fetch(`/api/v1/people/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) throw new Error('Failed to associate company');
      
      // Update the person object locally to reflect changes immediately
      (person as any).companyId = newCompany.id;
      (person as any).company = newCompany.name;
      
      showSuccessMessage('✅ Company added and associated successfully!');
    } catch (error) {
      console.error('❌ [SPEEDRUN] Error associating company:', error);
      showErrorMessage('❌ Failed to associate company');
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-4 mt-2">
          <div className="flex items-center">
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4 mt-2">
          <div className="flex items-center">
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}
      
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
            onAddCompany={() => setIsAddCompanyModalOpen(true)}
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

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onCompanyAdded={handleCompanyAdded}
        section="speedrun"
      />
    </div>
  );
}
