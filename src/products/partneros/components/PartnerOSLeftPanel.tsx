"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { usePipeline } from "@/products/pipeline/context/PipelineContext";
import { useProfilePopup } from "@/platform/ui/components/ProfilePopupContext";
import { useProfilePanel } from "@/platform/ui/components/ProfilePanelContext";
import { useFastCounts } from "@/platform/hooks/useFastCounts";
import { useFastSectionData } from "@/platform/hooks/useFastSectionData";
import { getFilteredSectionsForWorkspace } from "@/platform/utils/section-filter";
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from "@heroicons/react/24/outline";

interface PartnerOSLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function PartnerOSSections({ 
  activeSection, 
  handleSectionClick,
  fastCounts,
  fastCountsLoading,
  isMoreExpanded,
  setIsMoreExpanded
}: { 
  activeSection: string;
  handleSectionClick: (section: string) => void;
  fastCounts?: any;
  fastCountsLoading?: boolean;
  isMoreExpanded: boolean;
  setIsMoreExpanded: (expanded: boolean) => void;
}) {
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === workspaceId);
  const workspaceSlug = activeWorkspace?.slug || activeWorkspace?.name || 'default';
  
  const allowedSections = getFilteredSectionsForWorkspace({
    workspaceSlug,
    appId: 'partneros'
  });

  // 🔄 SYNC: Check if the active section's data is loading (matches middle panel timing)
  // This ensures left panel shows skeleton loaders when middle panel shows skeletons
  const activeSectionData = useFastSectionData(activeSection, 30);
  const activeSectionLoading = activeSectionData?.loading || false;
  
  // Show loading if: fastCounts is loading OR active section is loading
  // This syncs the left panel loading state with the middle panel's skeleton timing
  const loading = fastCountsLoading || activeSectionLoading || false;
  
  // Use fastCounts or fallback to acquisitionData counts
  const productionCounts = fastCounts && Object.keys(fastCounts).length > 0 ? fastCounts : 
    (acquisitionData?.acquireData?.counts || {});

  const sections = [
    {
      id: "speedrun",
      name: "Speedrun",
      description: "Drive partnerships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.speedrun || 0,
      visible: allowedSections.includes('speedrun')
    },
    {
      id: "leads",
      name: "Leads",
      description: "Cold relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.leads || 0,
      visible: allowedSections.includes('leads')
    },
    {
      id: "prospects",
      name: "Prospects",
      description: "Warm relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : (productionCounts.prospects || 0),
      visible: allowedSections.includes('prospects')
    },
    {
      id: "opportunities",
      name: "Opportunities",
      description: "Partner opportunities",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.opportunities || 0,
      visible: allowedSections.includes('opportunities')
    },
    {
      id: "partners",
      name: "Partners",
      description: "Strategic Alliances",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.partners || 0,
      visible: allowedSections.includes('partners')
    },
    {
      id: "companies",
      name: "Companies",
      description: "Business entities",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.companies || 0,
      visible: allowedSections.includes('companies')
    },
    {
      id: "people",
      name: "People",
      description: "Individual entities",
      count: loading ? (
        <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
      ) : productionCounts.people || 0,
      visible: allowedSections.includes('people')
    },
  ];

  const visibleSections = sections.filter(section => section.visible);
  
  // Split sections: first 7 visible, rest in "More"
  const mainSections = visibleSections.slice(0, 7);
  const moreSections = visibleSections.slice(7);
  
  return (
    <div className="flex-1 space-y-1">
      {mainSections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section.id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-hover text-foreground'
                  : 'hover:bg-panel-background text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{section.name}</span>
            <span className="text-sm text-muted">
              {typeof section['count'] === 'number' ? section.count.toLocaleString() : 
               typeof section['count'] === 'string' && !isNaN(Number(section.count)) ? Number(section.count).toLocaleString() : 
               section.count}
            </span>
          </div>
          <div className="text-xs text-muted mt-1">
            {section.description}
          </div>
        </button>
      ))}
      
      {moreSections.length > 0 && (
        <>
          <button
            onClick={() => setIsMoreExpanded(!isMoreExpanded)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-panel-background text-foreground`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">More</span>
              {isMoreExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </div>
            <div className="text-xs text-muted mt-1">
              Additional sections
            </div>
          </button>
          
          {isMoreExpanded && moreSections.map((section) => (
            <button
              key={section.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSectionClick(section.id);
              }}
              className={`w-full text-left px-3 py-2 pl-8 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-hover text-foreground'
                      : 'hover:bg-panel-background text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{section.name}</span>
                <span className="text-sm text-muted">
                  {typeof section['count'] === 'number' ? section.count.toLocaleString() : 
                   typeof section['count'] === 'string' && !isNaN(Number(section.count)) ? Number(section.count).toLocaleString() : 
                   section.count}
                </span>
              </div>
              <div className="text-xs text-muted mt-1">
                {section.description}
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

export function PartnerOSLeftPanel({
  activeSection,
  onSectionChange,
}: PartnerOSLeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const { counts: fastCounts, loading: fastCountsLoading } = useFastCounts();
  const {
    user,
    workspace
  } = usePipeline();
  
  const {
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor
  } = useProfilePopup();

  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();

  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  const handleSectionClick = (section: string) => {
    console.log('🔄 PartnerOS section clicked:', section);
    onSectionChange(section);
  };

  const handleProfileClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      event.preventDefault();
      event.stopPropagation();
      
      // Check if this is Dan or Ross user - allow ProfilePanel access on Adrata workspace
      const isDan = authUser?.email?.toLowerCase() === 'dan@adrata.com' ||
                   authUser?.id === '01K1VBYZMWTCT09FWEKBDMCXZM';
      const isRoss = authUser?.email?.toLowerCase() === 'ross@adrata.com';
      
      const isAdrataWorkspace = workspace?.name?.toLowerCase() === 'adrata';
      
      if ((isDan || isRoss) && isAdrataWorkspace) {
        const newState = !isProfilePanelVisible;
        setIsProfilePanelVisible(newState);
        return;
      }
      
      // Default to ProfileBox popup
      if (isProfileOpen) {
        setIsProfileOpen(false);
      } else {
        setProfileAnchor(event.currentTarget);
        setIsProfileOpen(true);
      }
    } catch (error) {
      console.error('❌ Error handling profile click:', error);
    }
  };

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === workspaceId);
  const workspaceName = activeWorkspace?.name || "";

  return (
    <div className="w-full h-full bg-background text-foreground border-r border-border flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-hover border border-border overflow-hidden">
              <span className="text-lg font-bold text-foreground">
                {workspaceName === "Adrata" ? "A" : workspaceName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) || 'PO'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h3 className="text-lg font-bold leading-tight" style={{ margin: 0, padding: 0 }}>
                  PartnerOS
                </h3>
              </div>
              <div className="text-xs text-muted font-medium" style={{ marginTop: '-1px' }}>
                Partner Relationships
              </div>
            </div>
          </div>
        </div>

        {/* Executive Performance Dashboard - Matching RevenueOS */}
        <div className="mx-2 mb-4 p-3 bg-hover rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Partners</span>
              <span className="text-xs font-semibold text-foreground">
                {fastCountsLoading ? (
                  <div className="w-8 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (fastCounts?.partners || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Opportunities</span>
              <span className="text-xs font-semibold text-foreground">
                {fastCountsLoading ? (
                  <div className="w-8 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (fastCounts?.opportunities || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted">Active</span>
              <span className="text-xs font-semibold text-foreground">
                {fastCountsLoading ? (
                  <div className="w-6 h-3 bg-loading-bg rounded animate-pulse"></div>
                ) : (() => {
                  const partners = fastCounts?.partners || 0;
                  const opportunities = fastCounts?.opportunities || 0;
                  return (partners + opportunities).toLocaleString();
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - PartnerOS Sections */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <PartnerOSSections
          activeSection={activeSection}
          handleSectionClick={handleSectionClick}
          fastCounts={fastCounts}
          fastCountsLoading={fastCountsLoading}
          isMoreExpanded={isMoreExpanded}
          setIsMoreExpanded={setIsMoreExpanded}
        />
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-hover border border-border rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
              {user?.initial || (authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">
              {user?.firstName && user?.lastName && user.firstName.trim() && user.lastName.trim()
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName && user.firstName.trim()
                ? user.firstName
                : user?.name ? (user.name.charAt(0).toUpperCase() + user.name.slice(1)) : authUser?.name || 'User'}
            </div>
            <div className="text-xs text-muted">
              {(workspace?.name || activeWorkspace?.name || 'Adrata').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

