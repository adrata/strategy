"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdminLeftPanel } from './admin/AdminLeftPanel';
import { AdminInviteUsers } from './admin/AdminInviteUsers';
import { AdminManageUsers } from './admin/AdminManageUsers';
import { AdminManageWorkspaces } from './admin/AdminManageWorkspaces';
import { RightPanel } from './chat/RightPanel';

export interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminSection = 'invite-users' | 'manage-users' | 'manage-workspaces';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('invite-users');
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const renderMiddlePanel = () => {
    switch (activeSection) {
      case 'invite-users':
        return <AdminInviteUsers />;
      case 'manage-users':
        return <AdminManageUsers />;
      case 'manage-workspaces':
        return <AdminManageWorkspaces />;
      default:
        return <AdminInviteUsers />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <div
        className={`
          w-full h-full bg-background flex flex-col
          transform transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
        role="dialog"
        aria-labelledby="admin-panel-title"
        aria-describedby="admin-panel-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background">
          <div>
            <h1
              id="admin-panel-title"
              className="text-2xl font-bold text-foreground"
            >
              Admin Panel
            </h1>
            <p
              id="admin-panel-description"
              className="text-sm text-muted mt-1"
            >
              Manage users, workspaces, and invitations
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
            title="Close Admin Panel"
            aria-label="Close Admin Panel"
          >
            <XMarkIcon className="h-6 w-6 text-muted" />
          </button>
        </div>

        {/* Main Content - 3 Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Navigation */}
          <div className="w-64 bg-background border-r border-border flex-shrink-0">
            <AdminLeftPanel
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* Middle Panel - Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="h-full">
              {renderMiddlePanel()}
            </div>
          </div>

          {/* Right Panel - AI Assistant & Context */}
          <div className="w-96 bg-background border-l border-border flex-shrink-0">
            <div className="h-full">
              <RightPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
