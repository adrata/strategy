import React, { useState, useEffect } from "react";
import { Person } from "../../types";
import { PersonDetailOverview } from "./PersonDetailOverview";
import { PersonDetailIntelligence } from "./PersonDetailIntelligence";
import { PersonDetailReports } from "./PersonDetailReports";
import { PersonDetailNotes } from "./PersonDetailNotes";
import { PersonDetailHistory } from "./PersonDetailHistory";

interface PersonDetailTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  person: Person;
  getStatusColor: (status: string) => string;
  onCompanyClick?: (companyName: string) => void;
}

const tabs = ["Overview", "Intelligence", "Reports", "Notes", "History"];

export function PersonDetailTabs({
  activeTab,
  setActiveTab,
  person,
  getStatusColor,
  onCompanyClick,
}: PersonDetailTabsProps) {
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <PersonDetailOverview 
            person={person} 
            getStatusColor={getStatusColor}
            onCompanyClick={onCompanyClick}
          />
        );
      case "Intelligence":
        return <PersonDetailIntelligence person={person} />;
      case "Reports":
        return <PersonDetailReports person={person} />;
      case "Notes":
        return <PersonDetailNotes person={person} />;
      case "History":
        return <PersonDetailHistory person={person} />;
      default:
        return (
          <PersonDetailOverview 
            person={person} 
            getStatusColor={getStatusColor}
            onCompanyClick={onCompanyClick}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div
        className="flex gap-2 mb-0 pb-2 border-b border-border px-6"
        style={{
          borderColor: "var(--border)",
          marginTop: "0px",
          borderBottomWidth: "1px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-5 py-2 text-base font-semibold rounded-t-lg transition-colors focus:outline-none
              ${
                activeTab === tab
                  ? "bg-background border-x border-t border-border text-foreground z-10"
                  : "text-muted dark:text-muted hover:text-blue-600 dark:hover:text-blue-400 border border-transparent"
              }
            `}
            style={{
              borderBottom: activeTab === tab ? "none" : "none",
              borderColor:
                activeTab === tab ? "var(--border)" : "transparent",
              marginBottom: activeTab === tab ? "-1px" : "0",
              position: "relative",
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-background rounded-b-xl border-b border-border shadow-sm px-6 pb-6 overflow-auto">
        <div className="pt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}


