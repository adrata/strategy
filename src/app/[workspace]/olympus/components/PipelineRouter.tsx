"use client";

import React, { useState } from 'react';
import { FindCompanyPipeline } from './pipelines/FindCompanyPipeline';
import { FindBuyerGroupPipeline } from './pipelines/FindBuyerGroupPipeline';
import { FindPersonPipeline } from './pipelines/FindPersonPipeline';
import { FindRolePipeline } from './pipelines/FindRolePipeline';
import { EnlightenBuyerGroupPipeline } from './pipelines/EnlightenBuyerGroupPipeline';
import { EnrichBuyerGroupPipeline } from './pipelines/EnrichBuyerGroupPipeline';
import { UpdateBuyerGroupPipeline } from './pipelines/UpdateBuyerGroupPipeline';
import { EntityActions } from './EntityActions';

interface PipelineRouterProps {
  activeSection: string;
}

export const PipelineRouter: React.FC<PipelineRouterProps> = ({ activeSection }) => {
  const [activeAction, setActiveAction] = useState<string>('');
  
  // Add a simple fallback to ensure something always renders
  if (!activeSection) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No Active Section
          </h2>
          <p className="text-[var(--muted)]">
            activeSection is: {activeSection}
          </p>
        </div>
      </div>
    );
  }

  // Check URL for action parameter
  React.useEffect(() => {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    // URL structure: /{workspace}/olympus/{section}/{action-section}
    // So we need to check the last part for action
    const actionSection = pathParts[pathParts.length - 1];
    
    // Parse action from action-section format (e.g., "find-buyer-group" -> "find")
    const action = actionSection?.split('-')[0];
    
    // Only set action if it's a valid action (find, enrich, update, enlighten, monitor)
    const validActions = ['find', 'enrich', 'update', 'enlighten', 'monitor'];
    if (action && validActions.includes(action) && action !== activeSection) {
      setActiveAction(action);
    } else if (!validActions.includes(action)) {
      // If no valid action, reset to show action cards
      setActiveAction('');
    }
  }, [activeSection]);

  const handleActionSelect = (action: string) => {
    setActiveAction(action);
    // Update URL to include the action with workspace - use descriptive URLs
    const workspaceId = window.location.pathname.split('/')[1]; // Extract workspace from current URL
    const actionUrl = `${action}-${activeSection}`;
    const newUrl = `/${workspaceId}/olympus/${activeSection}/${actionUrl}`;
    window.history.pushState({}, '', newUrl);
  };

  // If no action is selected, show the action cards
  if (!activeAction) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Main Header */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')} Intelligence
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Choose an action to get started with your {activeSection.replace('-', ' ')} intelligence
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--muted)] mb-1">Available Actions</div>
              <div className="text-lg font-semibold text-[var(--foreground)]">5</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
          <EntityActions
            entityType={activeSection as 'buyer-group' | 'company' | 'person' | 'role'}
            onActionSelect={handleActionSelect}
            activeAction={activeAction}
          />
        </div>
      </div>
    );
  }

  // Show the specific pipeline based on entity type and action
  const getPipelineComponent = () => {
    if (activeAction === 'find') {
      switch (activeSection) {
        case 'company':
          return <FindCompanyPipeline />;
        case 'buyer-group':
          return <FindBuyerGroupPipeline />;
        case 'person':
          return <FindPersonPipeline />;
        case 'role':
          return <FindRolePipeline />;
        default:
          return null;
      }
    }
    
    // Handle buyer-group specific actions
    if (activeSection === 'buyer-group') {
      if (activeAction === 'enlighten') {
        return <EnlightenBuyerGroupPipeline />;
      }
      if (activeAction === 'enrich') {
        return <EnrichBuyerGroupPipeline />;
      }
      if (activeAction === 'update') {
        return <UpdateBuyerGroupPipeline />;
      }
    }
    
    // For monitor actions and other entity types, we'll show placeholder components for now
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Breadcrumb Navigation */}
        <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-[var(--border)]">
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-[var(--foreground)]">Olympus</span>
            <span className="text-[var(--foreground)]">/</span>
            <span className="text-[var(--foreground)]">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}</span>
            <span className="text-[var(--foreground)]">/</span>
            <span className="text-[var(--foreground)] font-medium">
              {activeAction.charAt(0).toUpperCase() + activeAction.slice(1)}
            </span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-white border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {activeAction === 'enrich' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ) : activeAction === 'update' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : activeAction === 'enlighten' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ) : activeAction === 'monitor' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              {activeAction.charAt(0).toUpperCase() + activeAction.slice(1)} {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
            </h2>
            <p className="text-[var(--foreground)] mb-6">
              This feature is coming soon! We're working on bringing you powerful {activeAction} capabilities for {activeSection.replace('-', ' ')} intelligence.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveAction('');
                  const workspaceId = window.location.pathname.split('/')[1]; // Extract workspace from current URL
                  const newUrl = `/${workspaceId}/olympus/${activeSection}`;
                  window.history.pushState({}, '', newUrl);
                }}
                className="flex items-center gap-2 text-sm text-[var(--foreground)] hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')} Actions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const component = getPipelineComponent();
  
  // Fallback to ensure something always renders
  if (!component) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Loading {activeSection}...
          </h2>
          <p className="text-[var(--muted)]">
            Please wait while we load the {activeSection} interface.
          </p>
        </div>
      </div>
    );
  }
  
  return component;
};
