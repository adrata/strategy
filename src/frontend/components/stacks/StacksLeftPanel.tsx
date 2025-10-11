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
  BugAntIcon 
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
  }
];

export function StacksLeftPanel({ activeSubSection, onSubSectionChange }: StacksLeftPanelProps) {
  return (
    <div className="h-full w-64 bg-[var(--background)] border-r border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Project Management
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Jira-like task tracking
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2" role="navigation" aria-label="Stacks navigation">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSubSectionChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' 
                      : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-describedby={`${item.id}-description`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.label}
                    </div>
                    <div 
                      id={`${item.id}-description`}
                      className={`text-xs truncate ${
                        isActive ? 'text-[var(--primary-foreground)]/80' : 'text-[var(--muted)]'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--muted)] text-center">
          Similar to Jira workflow
        </div>
      </div>
    </div>
  );
}


