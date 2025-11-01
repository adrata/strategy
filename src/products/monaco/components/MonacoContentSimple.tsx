"use client";

import * as React from "react";
import { 
  FunnelIcon,
  Bars3Icon,
  Squares2X2Icon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  StarIcon,
  XMarkIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import Link from "next/link";
import { useMonacoData } from "@/products/monaco/hooks/useMonacoData";
import { useSpeedrunDataContext } from "@/platform/services/speedrun-data-context";
import { demoScenarioService } from "@/platform/services/DemoScenarioService";
import { useMonaco } from "@/products/monaco/context/MonacoContext";
import { ICPList, AllSection, MonacoRecord } from "../types";
import { PersonDetailView } from "./PersonDetailView";
import { correctPeopleNamesFromEmails } from "@/platform/utils/nameCorrection";
import { OutcomeTrackingPopup, OutcomeData } from "../../speedrun/components/OutcomeTrackingPopup";
import { useSpeedrunMetrics } from "@/platform/hooks/useSpeedrunMetrics";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";

interface MonacoContentProps {
  activeSection: string;
  icpLists: ICPList[];
  allSections: AllSection[];
  completedLists: string[];
  isTransferring: boolean;
  selectedRecord: MonacoRecord | null;
  setSelectedRecord: (record: MonacoRecord | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onTransferAll: (targetList: string) => void;
  searchCompanies?: (query: string) => void;
  onRtpAosModeChange?: (enabled: boolean) => void;
  onSpeedrunModeToggle?: () => void;
  nikePrioritized?: boolean;
}

// Monaco Header Component
function MonacoHeader({ 
  activeSection, 
  searchQuery, 
  setSearchQuery, 
  onSpeedrunModeToggle 
}: {
  activeSection: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSpeedrunModeToggle?: () => void;
}) {
  return (
    <div className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Monaco Intelligence
            </h1>
            <p className="text-[var(--muted)] text-sm">
              Strategic account research and buyer group intelligence
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search companies, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {onSpeedrunModeToggle && (
              <button
                onClick={onSpeedrunModeToggle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to Speedrun
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Monaco Section Tabs Component
function MonacoSectionTabs({ 
  allSections, 
  activeSection, 
  onSectionChange 
}: {
  allSections: AllSection[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <div className="flex-shrink-0 bg-[var(--panel-background)] border-b border-[var(--border)]">
      <div className="px-6">
        <div className="flex space-x-8">
          {(allSections || []).map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]'
              }`}
            >
              {section.name}
              {section['count'] && (
                <span className="ml-2 bg-[var(--hover)] text-[var(--foreground)] py-0.5 px-2.5 rounded-full text-xs">
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Monaco Content Grid Component
function MonacoContentGrid({ 
  icpLists, 
  completedLists, 
  isTransferring, 
  onTransferAll 
}: {
  icpLists: ICPList[];
  completedLists: string[];
  isTransferring: boolean;
  onTransferAll: (targetList: string) => void;
}) {
  if ((icpLists?.length || 0) === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No Data Available
          </h3>
          <p className="text-[var(--muted)]">
            Load some demo data to see Monaco in action.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(icpLists || []).map((list) => (
          <div
            key={list.id}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {list.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">{list.name}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {list.records?.length || 0} records
                  </p>
                </div>
              </div>
              
              {completedLists.includes(list.id) && (
                <StarIcon className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm text-[var(--muted)]">
                Progress: {Math.round(((list.records?.length || 0) / 100) * 100)}%
              </div>
              <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(((list.records?.length || 0) / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={() => onTransferAll(list.id)}
              disabled={isTransferring}
              className="w-full px-4 py-2 bg-[var(--foreground)] text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isTransferring ? 'Processing...' : 'View Details'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Monaco Content Component (Modularized)
export function MonacoContentSimple({
  activeSection,
  icpLists,
  allSections,
  completedLists,
  isTransferring,
  selectedRecord,
  setSelectedRecord,
  searchQuery,
  setSearchQuery,
  onTransferAll,
  searchCompanies,
  onRtpAosModeChange,
  onSpeedrunModeToggle,
  nikePrioritized = false,
}: MonacoContentProps) {
  
  const speedrunMetrics = useSpeedrunMetrics();
  const router = useRouter();
  const { navigateToMonaco } = useWorkspaceNavigation();
  const { currentDemoScenario } = useMonaco();
  
  // Handle section changes
  const handleSectionChange = React.useCallback((section: string) => {
    // Use workspace-aware navigation
    navigateToMonaco(section);
  }, [navigateToMonaco]);

  // Show person detail view if record is selected
  if (selectedRecord) {
    return (
      <PersonDetailView
        person={selectedRecord}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--panel-background)]">
      <MonacoHeader
        activeSection={activeSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSpeedrunModeToggle={onSpeedrunModeToggle}
      />
      
      <MonacoSectionTabs
        allSections={allSections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      <MonacoContentGrid
        icpLists={icpLists}
        completedLists={completedLists}
        isTransferring={isTransferring}
        onTransferAll={onTransferAll}
      />
    </div>
  );
}
