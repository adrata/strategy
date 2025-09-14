import React from "react";
import {
  Company,
  Partner,
  Person,
  SearchResults,
  PendingAction,
} from "../types";
import { CompanyList } from "./CompanyList";
import { PeopleList } from "./PeopleList";
import { PartnersList } from "./PartnersList";
import { PendingActionBar } from "./PendingActionBar";
import { EmptyState } from "./EmptyState";
import { SearchResultsIndicator } from "./SearchResultsIndicator";
import { NotesSection } from "./NotesSection";

interface MonacoMainContentProps {
  activeSection: string;
  currentSearchResults: SearchResults | null;
  setCurrentSearchResults: (results: SearchResults | null) => void;
  setActivePills: (pills: any[]) => void;
  pendingAction: PendingAction | null;
  executePendingAction: () => void;
  cancelPendingAction: () => void;
  filteredCompanies: Company[];
  filteredPartners: Partner[];
  filteredPeople: Person[];
  highlightedRecords: string[];
  people: Person[];
  searchQuery: string;
  notesContent: string;
  setNotesContent: (content: string) => void;
  onRecordSelect: (record: Company | Partner | Person) => void;
  getStatusColor: (status: string) => string;
  getIcpScoreColor: (score: number) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
}

export const MonacoMainContent: React.FC<MonacoMainContentProps> = ({
  activeSection,
  currentSearchResults,
  setCurrentSearchResults,
  setActivePills,
  pendingAction,
  executePendingAction,
  cancelPendingAction,
  filteredCompanies,
  filteredPartners,
  filteredPeople,
  highlightedRecords,
  people,
  searchQuery,
  notesContent,
  setNotesContent,
  onRecordSelect,
  getStatusColor,
  getIcpScoreColor,
  getRankNumber,
  getRankingDescription,
  getInitials,
}) => {
  const handleClearSearch = () => {
    setCurrentSearchResults(null);
    setActivePills([]);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "companies":
        return (
          <CompanyList
            companies={filteredCompanies}
            highlightedRecords={highlightedRecords}
            people={people}
            onCompanyClick={(company, decisionMaker) => {
              if (decisionMaker) {
                onRecordSelect(decisionMaker);
              } else {
                onRecordSelect(company);
              }
            }}
            getStatusColor={getStatusColor}
            getIcpScoreColor={getIcpScoreColor}
            getRankNumber={getRankNumber}
            getRankingDescription={getRankingDescription}
          />
        );
      case "partners":
        return (
          <PartnersList
            partners={filteredPartners}
            onPartnerClick={onRecordSelect}
            getStatusColor={getStatusColor}
            getRankNumber={getRankNumber}
            getRankingDescription={getRankingDescription}
          />
        );
      case "people":
        return (
          <PeopleList
            people={filteredPeople}
            highlightedRecords={highlightedRecords}
            onPersonClick={onRecordSelect}
            getStatusColor={getStatusColor}
            getRankNumber={getRankNumber}
            getRankingDescription={getRankingDescription}
            getInitials={getInitials}
          />
        );
      case "notes":
        return (
          <NotesSection
            notesContent={notesContent}
            setNotesContent={setNotesContent}
          />
        );
      default:
        return null;
    }
  };

  const renderEmptyState = () => {
    if (activeSection === "notes") return null;

    const isEmpty =
      (activeSection === "companies" && filteredCompanies['length'] === 0) ||
      (activeSection === "partners" && filteredPartners['length'] === 0) ||
      (activeSection === "people" && filteredPeople['length'] === 0);

    if (!isEmpty) return null;

    return (
      <EmptyState
        section={activeSection}
        hasSearchResults={!!currentSearchResults}
        hasSearchQuery={!!searchQuery}
        onClearSearch={handleClearSearch}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {activeSection === "notes"
              ? "Notes"
              : `Find ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}`}
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {activeSection === "companies" &&
              "Discover and research target companies"}
            {activeSection === "partners" && "Explore your partner ecosystem"}
            {activeSection === "people" && "Connect with key decision makers"}
          </p>
          <SearchResultsIndicator
            currentSearchResults={currentSearchResults}
            onClearSearch={handleClearSearch}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 invisible-scrollbar">
        {/* Action Confirmation Bar */}
        {pendingAction && (
          <PendingActionBar
            pendingAction={pendingAction}
            onExecute={executePendingAction}
            onCancel={cancelPendingAction}
          />
        )}

        {/* Section Content */}
        {renderSectionContent()}

        {/* Empty State */}
        {renderEmptyState()}
      </div>
    </div>
  );
};
