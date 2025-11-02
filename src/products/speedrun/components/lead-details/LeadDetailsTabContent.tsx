import React from "react";
import { LeadDetailsTabContentProps } from "./LeadDetailsTypes";
import { LeadDetailsUtilities } from "./LeadDetailsUtilities";

// Import extractor functions
import {
  extractProductionInsights,
  extractProductionCareer,
} from "../../utils/monacoExtractors";

// Import modular tab components
import { OverviewTab } from "../OverviewTab";
import { InsightsTab } from "../InsightsTab";
import { CareerTab } from "../CareerTab";
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
  onSaveNotes,
  saveStatus,
  lastSavedAt,
}: LeadDetailsTabContentProps) {
  // Extract data using Monaco extractors
  const insightsData = extractProductionInsights(person);
  const careerData = extractProductionCareer(person);

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

      case "Intelligence":
        return <InsightsTab person={person} insightsData={insightsData} />;

      case "Career":
        return <CareerTab person={person} careerData={careerData} />;

      case "Notes":
        return (
          <NotesTab
            person={person}
            notes={newNote}
            setNotes={onSetNewNote}
            onSave={onSaveNotes}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        );

      case "Actions":
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Actions
              </h3>
              <div className="bg-[var(--card)] border border-border rounded-lg p-4">
                <p className="text-muted mb-3">
                  Timeline for {person.name} at {typeof person.company === 'object' ? person.company?.name || 'this company' : person.company || 'this company'}...
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-primary rounded-full mt-1 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        Contact Created
                      </div>
                      <div className="text-muted text-sm">
                        Added to speedrun pipeline
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        Next Action
                      </div>
                      <div className="text-muted text-sm">
                        {person.nextAction || 'No action planned'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tab Not Found
            </h3>
            <p className="text-muted">
              The requested tab &quot;{activeTab}&quot; is not available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-background rounded-b-xl border-b border-border shadow-sm pt-0 px-6 pb-12 w-full -mt-2">
      <div className="pt-6">{renderTabContent()}</div>
    </div>
  );
}
