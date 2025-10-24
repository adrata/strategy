"use client";

/**
 * Stacks Left Panel Component
 * 
 * Left navigation panel for Stacks section with Jira-like navigation.
 * Follows 2025 best practices with proper accessibility and performance.
 */

import React from 'react';
import { 
  QueueListIcon, 
  ClipboardDocumentListIcon, 
  CubeIcon, 
  DocumentTextIcon, 
  BugAntIcon,
  BookOpenIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface StacksLeftPanelProps {
  activeSubSection: string;
  onSubSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'stacks',
    label: 'Stacks',
    icon: QueueListIcon,
    description: 'Project overview and management'
  },
  // {
  //   id: 'chronicle',
  //   label: 'Chronicle',
  //   icon: BookOpenIcon,
  //   description: 'Business intelligence reports'
  // },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: ClipboardDocumentListIcon,
    description: 'Task prioritization and planning'
  },
  {
    id: 'epics',
    label: 'Epics',
    icon: CubeIcon,
    description: 'Large feature groupings'
  },
  {
    id: 'stories',
    label: 'Stories',
    icon: DocumentTextIcon,
    description: 'User stories and requirements'
  },
  {
    id: 'bugs',
    label: 'Bugs',
    icon: BugAntIcon,
    description: 'Issue tracking and resolution'
  },
  {
    id: 'futures',
    label: 'Futures',
    icon: LightBulbIcon,
    description: 'Future ideas and concepts'
  },
  // {
  //   id: 'metrics',
  //   label: 'Metrics',
  //   icon: ChartBarIcon,
  //   description: 'Product & engineering KPIs'
  // }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
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
              <p className="text-xs text-[var(--muted)]">Project Management</p>
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

      {/* Scrollable Middle Section - Navigation */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <nav className="space-y-1" role="navigation" aria-label="Stacks navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSubSectionChange(item.id)}
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
        </nav>
      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">U</span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">User</div>
            <div className="text-xs text-[var(--muted)]">Workspace</div>
          </div>
        </button>
      </div>
    </div>
  );
}


