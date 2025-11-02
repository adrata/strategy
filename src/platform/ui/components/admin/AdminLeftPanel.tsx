"use client";

import React from 'react';
import {
  UserPlusIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import type { AdminSection } from '../AdminPanel';

interface AdminLeftPanelProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

interface NavigationItem {
  id: AdminSection;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
}

export const AdminLeftPanel: React.FC<AdminLeftPanelProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'invite-users',
      label: 'Invite Users',
      description: 'Send invitations to new team members',
      icon: UserPlusIcon,
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      description: 'View and manage existing users',
      icon: UsersIcon,
    },
    {
      id: 'manage-workspaces',
      label: 'Manage Workspaces',
      description: 'Create and configure workspaces',
      icon: BuildingOfficeIcon,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Administration
        </h2>
        <p className="text-sm text-muted mt-1">
          Manage your team and workspaces
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full flex items-start p-4 rounded-lg text-left transition-all duration-200
                ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200 text-blue-900'
                    : 'hover:bg-hover text-foreground'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex-shrink-0 mr-3">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-blue-600' : 'text-muted'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-blue-900' : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.badge && (
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${
                          isActive
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    isActive ? 'text-blue-700' : 'text-muted'
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center">
            <ChartBarIcon className="h-4 w-4 text-gray-500 mr-2" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">Quick Stats</p>
              <p className="text-xs text-gray-600">
                View system metrics and usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
