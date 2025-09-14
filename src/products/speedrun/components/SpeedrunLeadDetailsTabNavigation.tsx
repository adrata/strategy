import React from "react";

interface SpeedrunLeadDetailsTabNavigationProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const tabs = [
  "Overview",
  "Insights",
  "Profile",
  "Career",
  "Workspace",
  "History",
  "Notes",
];

export function SpeedrunLeadDetailsTabNavigation({
  activeTab,
  onTabClick,
}: SpeedrunLeadDetailsTabNavigationProps) {
  return (
    <div className="flex space-x-8 border-b border-[var(--border)] bg-[var(--background)] px-6 py-0">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabClick(tab)}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === tab
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
