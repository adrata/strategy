import React from "react";
import { LeadDetailsTabContentProps } from "./LeadDetailsTypes";
import { LeadDetailsUtilities } from "./LeadDetailsUtilities";

// Import extractor functions
import {
  extractProductionProfile,
  extractProductionInsights,
  extractProductionCareer,
  extractProductionWorkspace,
  extractProductionHistory,
} from "../../utils/monacoExtractors";

// Import modular tab components
import { OverviewTab } from "../OverviewTab";
import { ProfileTab } from "../ProfileTab";
import { InsightsTab } from "../InsightsTab";
import { CareerTab } from "../CareerTab";
import { WorkspaceTab } from "../WorkspaceTab";
import { HistoryTab } from "../HistoryTab";
import { NotesTab } from "../NotesTab";

export function LeadDetailsTabContent({
  person,
  activeTab,
  dynamicReports,
  isLoadingReports,
  notes,
  newNote,
  onReportClick,
  onCompanyDetailClick,
  onSetNewNote,
  onAddNote,
  formatTimestamp,
  onInlineFieldSave,
}: LeadDetailsTabContentProps) {
  // Extract data using Monaco extractors
  const profileData = extractProductionProfile(person);
  const insightsData = extractProductionInsights(person);
  const careerData = extractProductionCareer(person);
  const workspaceData = extractProductionWorkspace(person);
  const historyData = extractProductionHistory(person);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <OverviewTab
            person={person}
            dynamicReports={dynamicReports}
            isLoadingReports={isLoadingReports}
            onReportClick={onReportClick}
            onCompanyDetailClick={onCompanyDetailClick}
            onInlineFieldSave={onInlineFieldSave}
          />
        );

      case "Profile":
        return <ProfileTab person={person} profileData={profileData} />;

      case "Insights":
        return <InsightsTab person={person} insightsData={insightsData} />;

      case "Buyer Group":
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Buyer Group Analysis
              </h3>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-[var(--muted)] mb-3">
                  Analyzing buyer group composition for {person.company || 'this company'}...
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-[var(--foreground)] mb-2">Key Stakeholders</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-[var(--background)] rounded border">
                        <span className="text-sm">{person.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {person.title || 'Contact'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--foreground)] mb-2">Decision Influence</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Economic Buyer</span>
                        <span className="text-green-600">●</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Technical Decision</span>
                        <span className="text-yellow-600">●</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>User Champion</span>
                        <span className="text-blue-600">●</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Career":
        return <CareerTab person={person} careerData={careerData} />;

      case "Workspace":
        return <WorkspaceTab person={person} workspaceData={workspaceData} />;

      case "History":
        return <HistoryTab person={person} historyData={historyData} />;

      case "Notes":
        return (
          <NotesTab
            person={person}
            notes={notes}
            newNote={newNote}
            setNewNote={onSetNewNote}
            addNote={onAddNote}
            formatTimestamp={formatTimestamp}
          />
        );

      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tab Not Found
            </h3>
            <p className="text-gray-500">
              The requested tab &quot;{activeTab}&quot; is not available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-[var(--background)] rounded-b-xl border-b border-[var(--border)] shadow-sm pt-0 px-6 pb-12 w-full -mt-2">
      <div className="pt-6">{renderTabContent()}</div>
    </div>
  );
}
