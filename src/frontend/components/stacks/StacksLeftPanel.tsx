"use client";

/**
 * Stacks Left Panel Component
 * 
 * Left navigation panel for Stacks section with simple Sell/Build sections.
 * Follows 2025 best practices with proper accessibility and performance.
 */

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  QueueListIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { useProfilePanel } from '@/platform/ui/components/ProfilePanelContext';

interface StacksLeftPanelProps {
  activeSubSection: string;
  onSubSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'sell' | 'build';
}

const navigationItems: NavigationItem[] = [
  // Sell section
  {
    id: 'stacks',
    label: 'Pipeline',
    icon: QueueListIcon,
    description: 'Visual task management',
    category: 'sell'
  },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: ClipboardDocumentListIcon,
    description: 'Task prioritization and planning',
    category: 'sell'
  },
  {
    id: 'deep-backlog',
    label: 'Deep Backlog',
    icon: ArchiveBoxIcon,
    description: 'Long-term ideas and feedback capture',
    category: 'sell'
  },
  // Build section
  {
    id: 'stacks-build',
    label: 'Pipeline',
    icon: QueueListIcon,
    description: 'Visual task management',
    category: 'build'
  },
  {
    id: 'backlog-build',
    label: 'Backlog',
    icon: ClipboardDocumentListIcon,
    description: 'Task prioritization and planning',
    category: 'build'
  },
  {
    id: 'deep-backlog-build',
    label: 'Deep Backlog',
    icon: ArchiveBoxIcon,
    description: 'Long-term ideas and feedback capture',
    category: 'build'
  }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser } = useUnifiedAuth();
  const { isProfilePanelVisible, setIsProfilePanelVisible } = useProfilePanel();


  // Get current workspace from pathname
  const workspaceSlug = pathname.split('/')[1];

  const handleNavigation = (section: string) => {
    onSubSectionChange(section);
    
    // Determine category based on section
    let category = 'sell'; // default
    if (section.includes('-build')) {
      category = 'build';
      section = section.replace('-build', ''); // remove -build suffix
    }
    
    // Map section to URL path (category first, then section)
    let urlPath = section;
    if (section === 'stacks') {
      urlPath = 'pipeline';
    }
    
    router.push(`/${workspaceSlug}/stacks/${category}/${urlPath}`);
  };

  const handleProfileClick = () => {
    setIsProfilePanelVisible(!isProfilePanelVisible);
  };

  // Group items by category
  const sellItems = navigationItems.filter(item => item.category === 'sell');
  const buildItems = navigationItems.filter(item => item.category === 'build');

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">S</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Stacks</h2>
              <p className="text-xs text-[var(--muted)]">Project Acceleration</p>
            </div>
          </div>
        </div>

        {/* Project Management Dashboard */}
        <div className="mx-2 mb-4 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Total Items</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.length * 12}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Active</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.length * 8}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Completed</span>
              <span className="text-xs font-semibold text-black">
                {navigationItems.length * 4}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Navigation with vertical line */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <nav className="space-y-1" role="navigation" aria-label="Stacks navigation">
          {/* Sell Section */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-[var(--muted)] px-3 py-1">
              Sell
            </div>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]"></div>
              <div className="ml-4 space-y-1">
                {sellItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[var(--hover)] text-[var(--foreground)]'
                          : 'hover:bg-[var(--panel-background)] text-gray-700'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      aria-describedby={`${item.id}-description`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Build Section */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-[var(--muted)] px-3 py-1">
              Build
            </div>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]"></div>
              <div className="ml-4 space-y-1">
                {buildItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[var(--hover)] text-[var(--foreground)]'
                          : 'hover:bg-[var(--panel-background)] text-gray-700'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      aria-describedby={`${item.id}-description`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {authUser?.name || 'User'}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Workspace
                  </div>
          </div>
        </button>
      </div>
    </div>
  );
}


