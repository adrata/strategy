"use client";

import React from "react";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { ACQUISITION_OS_APPS, SECTION_TITLES } from "@/platform/config";
// import { ModularSpeedrunContainer } from "../speedrun/ModularSpeedrunContainer";
import { MonacoLeftPanel } from "@/products/monaco/components/MonacoLeftPanel";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { SpeedrunProvider } from "@/products/speedrun/context/SpeedrunProvider";
import { SpeedrunLeftPanel } from "@/platform/ui/panels/speedrun-left-panel";
import { LeftPanel } from "@/products/pipeline/components/LeftPanel";
import { flushSync } from "react-dom";

export function AcquisitionOSLeftPanel() {
  const {
    ui: {
      activeSubApp,
      activeSection,
      setActiveSection,
      setExpandedSection,
      selectedRecord,
      detailViewType,
      setSelectedRecord,
      setDetailViewType,
      setSearchQuery,
      setSelectedStageFilter,
      setSelectedForecastFilter,
      setSortBy,
    },
    data: { acquireData },
  } = useAcquisitionOS();

  // Debug logging to see what activeSubApp we're getting
  console.log("🔥 AcquisitionOSLeftPanel: activeSubApp =", activeSubApp);
  console.log("🔥 AcquisitionOSLeftPanel: activeSection =", activeSection);

  // Local state for tab management
  const [activeTab, setActiveTab] = React.useState<"BUILD" | "CLOSE">("BUILD");

  // Memory state for last active section in each tab
  const [lastActiveInBuild, setLastActiveInBuild] = React.useState("leads");
  const [lastActiveInClose, setLastActiveInClose] =
    React.useState("opportunities");

  // Get current app
  const currentSubApp =
    ACQUISITION_OS_APPS.find((app: any) => app['id'] === activeSubApp) ||
    ACQUISITION_OS_APPS[0]!;

  // Special case for Monaco app - Monaco handles its own left panel now
  if (activeSubApp === "monaco") {
    console.log("🔥 AcquisitionOSLeftPanel: Rendering Monaco left panel");
    return (
      <MonacoProvider>
        <MonacoLeftPanel />
      </MonacoProvider>
    );
  }

  // Special case for Speedrun app - Speedrun uses its own left panel
  // Note: SpeedrunProvider is provided at app level, no need to wrap again
  if (activeSubApp === "Speedrun") {
    console.log("🔥 AcquisitionOSLeftPanel: Rendering Speedrun left panel");
    return <SpeedrunLeftPanel />;
  }

  // Special case for Pipeline app - Pipeline uses its own left panel
  if (activeSubApp === "pipeline") {
    console.log("🔥 AcquisitionOSLeftPanel: Rendering Pipeline left panel");
    return (
      <LeftPanel 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isSpeedrunVisible={true}
        isOpportunitiesVisible={true}
      />
    );
  }

  console.log("🔥 AcquisitionOSLeftPanel: Rendering default AOS left panel for activeSubApp =", activeSubApp);

  // Import deduplication function
  const deduplicateLeads = (leads: any[]): any[] => {
    const seen = new Set<string>();
    const uniqueLeads: any[] = [];

    leads.forEach((lead: any) => {
      const key = `${lead.email || ''}-${lead.company || ''}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLeads.push(lead);
      }
    });

    return uniqueLeads;
  };

  // Helper functions for real stats based on actual data
  const getRealStatsForSection = (subAppId: string, section: string) => {
    if (subAppId === "pipeline") {
      // Handle special dynamically generated sections that don't exist in acquireData
      if (section === "people") {
        // Generate people stats from leads data
        const leads = acquireData.leads || [];
        const people = leads.filter((lead: any) => lead.name); // All leads with names are people
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentPeople = people.filter((person: any) => {
          const lastActionDate = new Date(
            person.lastActionDate || person.createdAt || "2024-01-01",
          );
          return lastActionDate >= oneWeekAgo;
        }).length;

        const change =
          people.length > 0
            ? Math.floor((recentPeople / people.length) * 100)
            : 0;

        return { all: people.length, week: recentPeople, change, completed: 0 };
      }

      if (section === "companies") {
        // Generate companies stats from leads data by grouping by company
        const leads = acquireData.leads || [];
        const companies = new Set();
        leads.forEach((lead: any) => {
          if (lead.company) {
            companies.add(lead.company);
          }
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Count companies with recent activity
        const companiesWithRecentActivity = new Set();
        leads.forEach((lead: any) => {
          if (lead.company) {
            const lastActionDate = new Date(
              lead.lastActionDate || lead.createdAt || "2024-01-01",
            );
            if (lastActionDate >= oneWeekAgo) {
              companiesWithRecentActivity.add(lead.company);
            }
          }
        });

        const allCompanies = companies.size;
        const recentCompanies = companiesWithRecentActivity.size;
        const change =
          allCompanies > 0
            ? Math.floor((recentCompanies / allCompanies) * 100)
            : 0;

        return {
          all: allCompanies,
          week: recentCompanies,
          change,
          completed: 0,
        };
      }

      // Handle standard sections that exist in acquireData
      let sectionData = acquireData[section as keyof typeof acquireData];

      if (!sectionData || !Array.isArray(sectionData) || sectionData['length'] === 0) {
        return { all: 0, week: 0, change: 0, completed: 0 };
      }

      // IMPORTANT: Deduplicate leads to match middle panel count
      if (section === "leads") {
        sectionData = deduplicateLeads(sectionData);
      }

      // For leads, exclude completed ones from "all" count
      let activeItems = sectionData;
      let completedCount = 0;

      if (section === "leads") {
        // Filter out completed leads (would need completion tracking from context)
        // For now, using a simple heuristic based on status
        completedCount = sectionData.filter(
          (item: any) => item['status'] === "Converted" || item['status'] === "Won",
        ).length;

        activeItems = sectionData.filter(
          (item: any) => item.status !== "Converted" && item.status !== "Won",
        );
      }

      const all = activeItems.length;

      // Calculate "this week" stats based on recent activity
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let week = 0;
      if (section === "leads") {
        // Count leads created this week
        week = activeItems.filter((item: any) => {
          const createdDate = new Date(
            item.createdAt || item.lastActionDate || "2024-01-01",
          );
          return createdDate >= oneWeekAgo;
        }).length;
      } else if (section === "opportunities") {
        // Count opportunities with recent activity
        week = activeItems.filter((item: any) => {
          const lastActionDate = new Date(item.lastActionDate || "2024-01-01");
          return lastActionDate >= oneWeekAgo;
        }).length;
      } else if (section === "buyerGroups") {
        // Count buyer group members with recent activity
        week = activeItems.filter((item: any) => {
          const lastActionDate = new Date(item.lastActionDate || "2024-01-01");
          return lastActionDate >= oneWeekAgo;
        }).length;
      } else if (section === "champions" || section === "decisionMakers") {
        // Count champions/decision makers with recent activity
        week = activeItems.filter((item: any) => {
          const lastActionDate = new Date(
            item.lastActionDate || item.createdAt || "2024-01-01",
          );
          return lastActionDate >= oneWeekAgo;
        }).length;
      } else if (section === "people" || section === "companies") {
        // Count contacts/accounts with recent activity
        week = activeItems.filter((item: any) => {
          const lastActionDate = new Date(
            item.lastActionDate || item.createdAt || "2024-01-01",
          );
          return lastActionDate >= oneWeekAgo;
        }).length;
      } else {
        // Default calculation for other sections
        week = Math.floor(all * 0.3); // Estimate 30% recent activity
      }

      // Calculate percentage change (simplified)
      const change = all > 0 ? Math.floor((week / all) * 100) : 0;

      return { all, week, change, completed: completedCount };
    }

    // Fallback stats for other apps
    const statsMap: Record<
      string,
      Record<
        string,
        { all: number; week: number; change: number; completed?: number }
      >
    > = {
      cal: {
        today: { all: 3, week: 3, change: +50 },
        week: { all: 12, week: 7, change: +25 },
        month: { all: 45, week: 12, change: +15 },
        meetings: { all: 28, week: 8, change: +20 },
        availability: { all: 168, week: 48, change: +10 },
      },
      expand: {
        accounts: { all: 45, week: 8, change: +3 },
        opportunities: { all: 12, week: 3, change: +2 },
        contacts: { all: 67, week: 12, change: +5 },
        campaigns: { all: 8, week: 2, change: +1 },
        revenue: { all: 850000, week: 125000, change: +15 },
      },
      "Speedrun": {
        daily40: { all: 40, week: 12, change: +8 },
        weekly200: { all: 200, week: 45, change: +15 },
        drafts: { all: 8, week: 3, change: +2 },
        scheduled: { all: 15, week: 6, change: +10 },
        templates: { all: 28, week: 4, change: +2 },
      },
      monaco: {
        companies: { all: 1247, week: 89, change: +12 },
        people: { all: 3421, week: 156, change: +18 },
        sequences: { all: 23, week: 4, change: +2 },
        analytics: { all: 145, week: 23, change: +7 },
      },
      paper: {
        notes: { all: 127, week: 18, change: +4 },
        folders: { all: 12, week: 2, change: +1 },
        shared: { all: 34, week: 6, change: +2 },
      },
      win: {
        today: { all: 3, week: 3, change: +50 },
        "this-week": { all: 8, week: 8, change: +25 },
        "this-month": { all: 23, week: 8, change: +15 },
        "this-quarter": { all: 67, week: 23, change: +20 },
        "all-time": { all: 285, week: 23, change: +5 },
      },
      actions: {
        tasks: { all: 89, week: 15, change: +3 },
        workflows: { all: 23, week: 4, change: +1 },
        automations: { all: 12, week: 2, change: 0 },
      },
    };

    return (
      statsMap[subAppId]?.[section] || {
        all: 0,
        week: 0,
        change: 0,
        completed: 0,
      }
    );
  };

  const safeNumber = (value: number): number => {
    return isNaN(value) ? 0 : Math.round(value);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${safeNumber(change)}%`;
  };

  const getSectionTitle = (sectionId: string) => {
    return SECTION_TITLES[sectionId] || sectionId;
  };

  // Handle section click - simplified without conflicting tab sync
  const handleSectionClick = (section: string) => {
    console.log("🔄 Section click:", section, "Current tab:", activeTab);

    // Use flushSync to ensure state clearing happens immediately
    flushSync(() => {
      setSelectedRecord(null);
      setDetailViewType(null);
    });

    // Update tab memory based on current tab
    if (activeTab === "BUILD") {
      setLastActiveInBuild(section);
    } else if (activeTab === "CLOSE") {
      setLastActiveInClose(section);
    }

    // Set the new section
    setActiveSection(section);
    setExpandedSection(null);

    // Reset filters when switching sections
    setSearchQuery("");
    setSelectedStageFilter("All Stages");
    setSelectedForecastFilter("All Opportunities");
    setSortBy("Elite Focus");

    // Update URL for pipeline sections - use standalone structure 
    if (activeSubApp === "pipeline") {
      window.history.replaceState(
        { ...window.history.state, shallow: true },
        '',
        `/${section}`
      );
    }

    console.log("✅ Section updated to:", section, "Tab:", activeTab);
  };

  // Handle tab switching with memory
  const handleTabSwitch = (tab: "BUILD" | "CLOSE") => {
    setActiveTab(tab);

    // Switch to the last active section in that tab
    const targetSection =
      tab === "BUILD" ? lastActiveInBuild : lastActiveInClose;
    handleSectionClick(targetSection);
  };

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col pt-0 pr-2 pb-6 pl-2 overflow-y-auto invisible-scrollbar">
      <div className="flex-1 flex flex-col">
        <div className="mx-2 mt-4 mb-2">
          <h3 className="text-xl font-bold mb-0.5 mt-[2px]">
            {currentSubApp.name}
          </h3>
          <p
            className={`${currentSubApp['id'] === "monaco" ? "text-base" : "text-sm"} text-[var(--muted,#888)] mt-0 mb-1`}
          >
            {currentSubApp.description}
          </p>
        </div>

        {/* Show sections for other sub-apps if they have sections */}
        {currentSubApp.sections.length > 0 && (
          <>
            {/* Special handling for Monaco app */}
            {currentSubApp['id'] === "monaco" ? (
              null // Monaco has its own left panel in MonacoStandaloneContent
            ) : (
              /* Default sections layout for other apps */
              <>
                {/* Hide SECTIONS heading for Cal app */}
                {currentSubApp.id !== "cal" && (
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2 pl-2 tracking-widest mt-2">
                    Sections
                  </h3>
                )}
                {currentSubApp.sections.map((section) => {
                  const stats = getRealStatsForSection(
                    currentSubApp.id,
                    section,
                  );
                  return (
                    <div
                      key={section}
                      className={`pl-3 pr-4 py-2 rounded-lg cursor-pointer font-medium text-base transition-colors mb-0.5 ${
                        activeSection === section
                          ? "bg-[var(--hover-bg)] text-[var(--foreground)]"
                          : "text-[var(--muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
                      }`}
                      onClick={() => handleSectionClick(section)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="capitalize">
                          {getSectionTitle(section)}
                        </span>
                      </div>
                      {/* Hide stats for Pipeline app */}
                      {currentSubApp.id !== "pipeline" && (
                        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--muted)]">
                          <span>
                            All: <span className="text-[var(--foreground)] font-semibold">{stats.all}</span>
                          </span>
                          <span>
                            This Week: <span className="text-[var(--foreground)] font-semibold">{stats.week}</span>
                            <span className="ml-2 font-semibold text-gray-400">{formatChange(stats.change)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Legacy alias for backwards compatibility
export const ActionPlatformLeftPanel = AcquisitionOSLeftPanel;
