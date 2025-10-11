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
import { useOasis } from '@/app/[workspace]/(pipeline)/layout';

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

export function OasisLeftPanel() {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  // Add error boundary for context usage
  let oasisContext;
  try {
    oasisContext = useOasis();
  } catch (error) {
    console.error('Failed to get Oasis context:', error);
    return (
      <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-red-500">Error loading Oasis context</div>
        </div>
      </div>
    );
  }
  
  const { activeSection, setActiveSection, setSelectedChannel } = oasisContext;

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId as any);
    setSelectedChannel(null); // Clear selected channel when switching sections
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500">Loading Oasis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
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

        {/* Communication Activity Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Messages</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.reduce((sum, item) => sum + (item.count || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Channels</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.find(item => item.id === 'channels')?.count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Mentions</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.find(item => item.id === 'mentions')?.count || 0}
              </span>
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

        {/* Channels List - Show when channels section is active */}
        {activeSection === 'channels' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Channels</h3>
            </div>
            <div className="space-y-1">
              {[
                { id: 'general', name: 'general', unread: 3, members: 12 },
                { id: 'design', name: 'design', unread: 0, members: 5 },
                { id: 'dev-team', name: 'dev-team', unread: 7, members: 8 }
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">#{channel.name}</span>
                    {channel.unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        {channel.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {channel.members} members
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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