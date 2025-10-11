"use client";

/**
 * Oasis Left Panel Component
 * 
 * Left navigation panel for Oasis communication hub.
 * Standardized design matching Speedrun style.
 */

import React from 'react';
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";

interface OasisLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  description: string;
  count?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'channels',
    label: 'Channels',
    description: 'Team communication channels',
    count: 3
  },
  {
    id: 'direct-messages',
    label: 'Direct Messages',
    description: 'Private conversations',
    count: 5
  },
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'Messages mentioning you',
    count: 2
  },
  {
    id: 'starred',
    label: 'Starred',
    description: 'Important messages',
    count: 8
  },
  {
    id: 'archived',
    label: 'Archived',
    description: 'Old conversations',
    count: 12
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Communication preferences'
  }
];

export function OasisLeftPanel({ activeSection, onSectionChange }: OasisLeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">Loading Oasis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">O</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Oasis</h2>
              <p className="text-xs text-[var(--muted)]">Communication Hub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Navigation */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.count && (
                    <span className="text-sm text-[var(--muted)]">
                      {item.count}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {item.description}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-gray-400">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}