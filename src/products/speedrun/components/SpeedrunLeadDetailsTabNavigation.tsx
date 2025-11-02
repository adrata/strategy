import React from "react";

interface SpeedrunLeadDetailsTabNavigationProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const tabs = [
  "Overview",
  "Intelligence",
  "Career",
  "Notes",
  "Timeline",
];

export function SpeedrunLeadDetailsTabNavigation({
  activeTab,
  onTabClick,
}: SpeedrunLeadDetailsTabNavigationProps) {
  return (
    <div className="flex space-x-8 border-b border-border bg-background px-6 py-0">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabClick(tab)}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === tab
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
