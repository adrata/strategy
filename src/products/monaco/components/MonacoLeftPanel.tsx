"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useMonacoData } from "@/products/monaco/hooks/useMonacoData";
import { useMonaco } from "@/products/monaco/context/MonacoContext";
import { useFastCounts } from "@/platform/hooks/useFastCounts";

interface MonacoLeftPanelProps {
  activeSection: string;
  handleSectionClick: (section: string) => void;
  getRealStatsForSection: (subAppId: string, section: string) => any;
  currentSubApp: any;
}

function MonacoSections({ 
  activeSection, 
  handleSectionClick, 
  getRealStatsForSection, 
  currentSubApp 
}: Omit<MonacoLeftPanelProps, 'getSectionTitle'>) {
  // Get real counts from the API instead of hardcoded values
  const { counts: fastCounts, loading: fastCountsLoading } = useFastCounts();
  
  // Core sections matching standalone Monaco (no RTP) - using real data
  const allSections = [
    { id: "companies", name: "Companies", description: "Find buyer groups", count: fastCounts?.companies || 0 },
    { id: "people", name: "People", description: "Know everyone", count: fastCounts?.people || 0 },
    { id: "sellers", name: "Sellers", description: "Organize momentum", count: fastCounts?.sellers || 0 },
  ];

  return (
    <div className="flex-1 space-y-1">
      {allSections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            activeSection === section.id
              ? 'bg-[var(--hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--panel-background)] text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{section.name}</span>
                            <span className="text-sm text-[var(--muted)]">{section.count.toLocaleString()}</span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {section.description}
          </div>
        </button>
      ))}
    </div>
  );
}

export function MonacoLeftPanel() {
  const router = useRouter();
  const {
    ui: { activeSection, setActiveSection },
  } = useAcquisitionOS();

  // Get Monaco data for stats
  const { companies, people } = useMonacoData();
  
  // Get Monaco context for dynamic branding
  const { currentDemoScenario } = useMonaco();
  
  // Dynamic app name and description based on demo scenario
  const getAppName = () => {
    if (currentDemoScenario === 'snyk') {
      return 'Snyk';
    }
    return 'Monaco';
  };
  
  const getAppDescription = () => {
    if (currentDemoScenario === 'snyk') {
      return 'Buyer group intelligence';
    }
    return 'Find your success';
  };



  // Monaco-specific stats calculation
  const getRealStatsForSection = (subAppId: string, section: string) => {
    const statsMap: Record<string, { all: number; week: number; change: number }> = {
      sellers: { all: 39, week: 2, change: +8 },
      companies: { all: 590, week: 89, change: +12 },
      people: { all: 2847, week: 228, change: +18 },
    };

    return (
      statsMap[section] || {
        all: 0,
        week: 0,
        change: 0,
      }
    );
  };



  // Handle section click for Monaco - navigate to AOS routes
  const handleSectionClick = (section: string) => {
    console.log("🎯 Monaco section click:", section);
    
    // Update active section in AOS context
    setActiveSection(section);
    
    // Navigate to the correct AOS route for the section
    const routeMap: Record<string, string> = {
      companies: "/aos/monaco/companies",
      people: "/aos/monaco/people", 
      sellers: "/aos/monaco/sellers"
    };
    
    const targetRoute = routeMap[section];
    if (targetRoute) {
      router.push(targetRoute);
      console.log("✅ Navigating to AOS route:", targetRoute);
    } else {
      console.warn("⚠️ Unknown section:", section);
    }
  };

  // Dynamic currentSubApp for Monaco
  const currentSubApp = {
    id: "monaco",
    name: getAppName(),
    description: getAppDescription()
  };

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col pt-0 pr-2 pb-6 pl-2 overflow-y-auto invisible-scrollbar">
      <div className="flex-1 flex flex-col">
        <div className="mx-2 mt-4 mb-2">
          <h3 className="text-xl font-bold mb-0.5 mt-[2px]">
            {currentSubApp.name}
          </h3>
          <p className="text-base text-[var(--muted,#888)] mt-0 mb-1">
            {currentSubApp.description}
          </p>
        </div>

        {/* Executive Performance Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Total Prospects</span>
              <span className="text-sm font-semibold text-black">3,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Target Accounts</span>
              <span className="text-sm font-semibold text-black">{(590).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Decision Makers</span>
              <span className="text-sm font-semibold text-black">1,847</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Pipeline Growth</span>
              <span className="text-sm font-semibold text-black">+12%</span>
            </div>
          </div>
        </div>

        {/* Monaco Sections */}
        <MonacoSections 
          activeSection={activeSection}
          handleSectionClick={handleSectionClick}
          getRealStatsForSection={getRealStatsForSection}
          currentSubApp={currentSubApp}
        />
      </div>
    </div>
  );
}
