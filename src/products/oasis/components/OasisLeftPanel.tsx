"use client";

/**
 * Oasis Left Panel Component
 * 
 * Left navigation panel for Oasis communication hub.
 * Clean, modern design inspired by Stacks but focused on communication.
 */

import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  UsersIcon, 
  HashtagIcon, 
  BellIcon,
  StarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface OasisLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'channels',
    label: 'Channels',
    icon: HashtagIcon,
    description: 'Team communication channels',
    badge: 3
  },
  {
    id: 'direct-messages',
    label: 'Direct Messages',
    icon: ChatBubbleLeftRightIcon,
    description: 'Private conversations',
    badge: 5
  },
  {
    id: 'mentions',
    label: 'Mentions',
    icon: BellIcon,
    description: 'Messages mentioning you',
    badge: 2
  },
  {
    id: 'starred',
    label: 'Starred',
    icon: StarIcon,
    description: 'Important messages',
    badge: 8
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: ArchiveBoxIcon,
    description: 'Old conversations',
    badge: 12
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    description: 'Communication preferences'
  }
];

export function OasisLeftPanel({ activeSection, onSectionChange }: OasisLeftPanelProps) {
  return (
    <div className="w-[14.085rem] min-w-[14.085rem] max-w-[14.085rem] h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Oasis</h2>
            <p className="text-xs text-gray-500">Communication Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.description}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </div>
                {item.badge && (
                  <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">John Doe</div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
        </div>
      </div>
    </div>
  );
}