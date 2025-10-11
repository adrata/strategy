"use client";

/**
 * Oasis Right Panel Component
 * 
 * Right sidebar for Oasis with channel info, members, and AI assistance.
 * Clean, modern design that complements the communication interface.
 */

import React, { useState } from 'react';
import { 
  UsersIcon, 
  InformationCircleIcon,
  Cog6ToothIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface OasisRightPanelProps {
  selectedChannel: any;
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  role: 'admin' | 'member';
  lastSeen?: string;
}

interface AIAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

// Mock data
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'SC',
    status: 'online',
    role: 'admin',
    lastSeen: 'Active now'
  },
  {
    id: '2',
    name: 'Mike Johnson',
    avatar: 'MJ',
    status: 'away',
    role: 'member',
    lastSeen: '2 hours ago'
  },
  {
    id: '3',
    name: 'Alex Rodriguez',
    avatar: 'AR',
    status: 'online',
    role: 'member',
    lastSeen: 'Active now'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: 'EW',
    status: 'offline',
    role: 'member',
    lastSeen: 'Yesterday'
  },
  {
    id: '5',
    name: 'David Kim',
    avatar: 'DK',
    status: 'online',
    role: 'member',
    lastSeen: 'Active now'
  }
];

const aiActions: AIAction[] = [
  {
    id: 'summarize',
    title: 'Summarize Channel',
    description: 'Get a summary of recent conversations',
    icon: DocumentTextIcon,
    action: () => console.log('Summarize channel')
  },
  {
    id: 'suggest',
    title: 'Suggest Topics',
    description: 'AI-powered conversation starters',
    icon: LightBulbIcon,
    action: () => console.log('Suggest topics')
  },
  {
    id: 'schedule',
    title: 'Schedule Meeting',
    description: 'Find best time for team meeting',
    icon: CalendarIcon,
    action: () => console.log('Schedule meeting')
  }
];

export function OasisRightPanel({ selectedChannel, onClose }: OasisRightPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'info' | 'ai'>('members');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-full h-full bg-[var(--background)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {selectedChannel ? `#${selectedChannel.name}` : 'Oasis'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted)] hover:text-[var(--muted)] hover:bg-[var(--hover)] rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[var(--hover)] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <InformationCircleIcon className="w-4 h-4" />
            Info
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            AI
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'members' && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                {mockMembers.length} Members
              </h3>
            </div>
            
            <div className="space-y-3">
              {mockMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--panel-background)] transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{member.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)] truncate">{member.name}</span>
                      {member.role === 'admin' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <span>{getStatusText(member.status)}</span>
                      <span>•</span>
                      <span>{member.lastSeen}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-4">
            <div className="space-y-6">
              {/* Channel Info */}
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Channel Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Purpose</label>
                    <p className="text-sm text-gray-700 mt-1">
                      General team communication and project updates
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Created</label>
                    <p className="text-sm text-gray-700 mt-1">January 15, 2024</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Topic</label>
                    <p className="text-sm text-gray-700 mt-1">
                      🚀 Building the future of team collaboration
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="text-sm text-[var(--muted)]">
                    <span className="font-medium">Sarah Chen</span> joined the channel
                    <span className="text-[var(--muted)] ml-2">2 hours ago</span>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <span className="font-medium">Mike Johnson</span> updated the channel topic
                    <span className="text-[var(--muted)] ml-2">1 day ago</span>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <span className="font-medium">Alex Rodriguez</span> shared a file
                    <span className="text-[var(--muted)] ml-2">2 days ago</span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <button className="w-full flex items-center gap-3 p-3 text-left text-gray-700 hover:bg-[var(--panel-background)] rounded-lg transition-colors">
                  <Cog6ToothIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="font-medium">Channel Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-[var(--foreground)]">AI Assistant</h3>
              </div>
              <p className="text-sm text-[var(--muted)]">
                Get help with your team communication
              </p>
            </div>

            <div className="space-y-3">
              {aiActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-[var(--panel-background)] rounded-lg transition-colors border border-[var(--border)]"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--foreground)] text-sm">{action.title}</div>
                      <div className="text-xs text-[var(--muted)] mt-1">{action.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 p-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-background)] rounded transition-colors">
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send AI Message
                </button>
                <button className="w-full flex items-center gap-2 p-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-background)] rounded transition-colors">
                  <DocumentTextIcon className="w-4 h-4" />
                  Generate Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
