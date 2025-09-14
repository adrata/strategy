"use client";

import React, { useState, ReactNode } from "react";
import {
  ChartBarIcon,
  CogIcon,
  DocumentChartBarIcon,
  EyeIcon,
  RocketLaunchIcon,
  SparklesIcon,
  TableCellsIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

// UNIVERSAL THIN LEFT PANEL APPS - Standardized across all standalone apps
export const UNIVERSAL_APP_STRUCTURE = {
  // CORE VIEWS
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    icon: ChartBarIcon,
    description: "Overview and key metrics",
    color: "#3B82F6",
    priority: 1,
  },
  actions: {
    id: "actions",
    name: "Actions",
    icon: RocketLaunchIcon,
    description: "Primary tasks and workflows",
    color: "#10B981",
    priority: 2,
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    icon: DocumentChartBarIcon,
    description: "Insights and analysis",
    color: "#8B5CF6",
    priority: 3,
  },

  // DATA & INTELLIGENCE
  data: {
    id: "data",
    name: "Data",
    icon: TableCellsIcon,
    description: "Raw data and records",
    color: "#6B7280",
    priority: 4,
  },
  intelligence: {
    id: "intelligence",
    name: "Intelligence",
    icon: EyeIcon,
    description: "AI-powered insights",
    color: "#F59E0B",
    priority: 5,
  },
  automations: {
    id: "automations",
    name: "Automations",
    icon: BoltIcon,
    description: "Automated workflows",
    color: "#EF4444",
    priority: 6,
  },

  // CONFIGURATION
  settings: {
    id: "settings",
    name: "Settings",
    icon: CogIcon,
    description: "Configuration and preferences",
    color: "#64748B",
    priority: 7,
  },
} as const;

// APP-SPECIFIC CUSTOMIZATIONS
export const APP_CUSTOMIZATIONS = {
  news: {
    actions: { name: "Create", description: "Write and publish articles" },
    intelligence: {
      name: "Trends",
      description: "Industry insights and trends",
    },
    data: { name: "Articles", description: "All news content" },
  },
  social: {
    actions: { name: "Post", description: "Create and share content" },
    intelligence: {
      name: "Engagement",
      description: "Social engagement insights",
    },
    data: { name: "Feed", description: "Social media content" },
  },
  Speedrun: {
    actions: { name: "Compose", description: "Create new messages" },
    intelligence: {
      name: "Performance",
      description: "Message performance insights",
    },
    data: { name: "Messages", description: "Message history and templates" },
  },
  monaco: {
    actions: { name: "Research", description: "Company and contact research" },
    intelligence: {
      name: "Insights",
      description: "Buyer intelligence and signals",
    },
    data: { name: "Companies", description: "Company and contact database" },
  },
} as const;

interface StandaloneAppProps {
  appName: string;
  appIcon: React.ComponentType<any>;
  accentColor: string;
  children: ReactNode;

  // Main Actions (First Screen)
  mainActions: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
    primary?: boolean;
  }>;

  // Thin Left Panel Content
  leftPanelContent: Record<string, ReactNode>;

  // AI Chat Integration
  aiChatEnabled?: boolean;
  onAiChat?: (message: string) => void;

  // User Profile
  user?: {
    name: string;
    initial: string;
  };

  // Current State
  activeLeftApp?: string;
  onLeftAppChange?: (appId: string) => void;
  showMainActions?: boolean;
  onShowMainActions?: (show: boolean) => void;
}

export function StandaloneAppFramework({
  appName,
  appIcon: AppIcon,
  accentColor,
  children,
  mainActions,
  leftPanelContent,
  aiChatEnabled = true,
  onAiChat,
  user,
  activeLeftApp = "dashboard",
  onLeftAppChange,
  showMainActions = true,
  onShowMainActions,
}: StandaloneAppProps) {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Get customizations for this app
  const customizations =
    APP_CUSTOMIZATIONS[
      appName.toLowerCase() as keyof typeof APP_CUSTOMIZATIONS
    ] || {};

  // Build left panel apps with customizations
  const leftPanelApps = Object.values(UNIVERSAL_APP_STRUCTURE)
    .map((app) => {
      const appCustomization =
        customizations[app.id as keyof typeof customizations];
      return {
        ...app,
        ...(appCustomization && typeof appCustomization === "object"
          ? appCustomization
          : {}),
      };
    })
    .sort((a, b) => a.priority - b.priority);

  const handleAiChatSubmit = () => {
    if (aiChatMessage.trim() && onAiChat) {
      onAiChat(aiChatMessage);
      setAiChatMessage("");
    }
  };

  const currentLeftApp =
    leftPanelApps.find((app) => app['id'] === activeLeftApp) ||
    leftPanelApps[0] ||
    UNIVERSAL_APP_STRUCTURE.dashboard;

  return (
    <div className="h-screen bg-[var(--background)] flex">
      {/* THIN LEFT PANEL */}
      <div className="w-16 bg-[var(--background)] border-r border-[var(--border)] flex flex-col items-center py-4">
        {/* App Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-6 cursor-pointer transition-all hover:scale-110"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          onClick={() => onShowMainActions?.(true)}
        >
          <AppIcon className="w-6 h-6" />
        </div>

        {/* Left Panel Apps */}
        <div className="flex flex-col gap-2 flex-1">
          {leftPanelApps.map((app) => {
            const Icon = app.icon;
            const isActive = activeLeftApp === app.id;

            return (
              <button
                key={app.id}
                onClick={() => {
                  onLeftAppChange?.(app.id);
                  onShowMainActions?.(false);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative ${
                  isActive
                    ? "text-white shadow-lg transform scale-110"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                }`}
                style={isActive ? { backgroundColor: accentColor } : {}}
                title={app.name}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <div className="absolute left-16 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  <div className="font-medium text-[var(--foreground)]">
                    {app.name}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {app.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Chat Toggle */}
        {aiChatEnabled && (
          <button
            onClick={() => setIsAiChatOpen(!isAiChatOpen)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              isAiChatOpen
                ? "bg-blue-500 text-white"
                : "text-[var(--muted)] hover:text-blue-500 hover:bg-blue-500/10"
            }`}
            title="AI Assistant"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>
        )}

        {/* User Profile */}
        {user && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm mt-4">
            {user.initial}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex">
        {/* MAIN ACTIONS OR LEFT PANEL CONTENT */}
        <div className="flex-1">
          {showMainActions ? (
            // MAIN ACTIONS SCREEN
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-[var(--border)]">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    <AppIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                      {appName}
                    </h1>
                    <p className="text-[var(--muted)]">
                      What would you like to do?
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search or describe what you want to do..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Main Actions Grid */}
              <div className="flex-1 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                  {mainActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className={`p-6 rounded-2xl border transition-all duration-200 text-left group hover:scale-105 hover:shadow-lg ${
                          action.primary
                            ? "border-transparent shadow-lg"
                            : "border-[var(--border)] hover:border-[var(--foreground)]/20"
                        }`}
                        style={
                          action.primary
                            ? {
                                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                                borderColor: `${accentColor}40`,
                              }
                            : {}
                        }
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              action.primary ? "text-white" : ""
                            }`}
                            style={
                              action.primary
                                ? { backgroundColor: accentColor }
                                : {
                                    backgroundColor: `${accentColor}20`,
                                    color: accentColor,
                                  }
                            }
                          >
                            <ActionIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-semibold mb-2 ${
                                action.primary
                                  ? "text-[var(--foreground)]"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {action.name}
                            </h3>
                            <p className="text-[var(--muted)] text-sm leading-relaxed">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Access to Left Panel Apps */}
                <div className="mt-12">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Quick Access
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {leftPanelApps.map((app) => {
                      const Icon = app.icon;
                      return (
                        <button
                          key={app.id}
                          onClick={() => {
                            onLeftAppChange?.(app.id);
                            onShowMainActions?.(false);
                          }}
                          className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--foreground)]/20 transition-all text-center group hover:scale-105"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                            style={{
                              backgroundColor: `${app.color}20`,
                              color: app.color,
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="font-medium text-[var(--foreground)] text-sm">
                            {app.name}
                          </div>
                          <div className="text-xs text-[var(--muted)] mt-1">
                            {app.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // LEFT PANEL CONTENT
            <div className="h-full flex flex-col">
              {/* Left Panel Header */}
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => onShowMainActions?.(true)}
                    className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <AppIcon className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {currentLeftApp.name}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {currentLeftApp.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Left Panel Content */}
              <div className="flex-1 overflow-hidden">
                {leftPanelContent[activeLeftApp] || (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{
                          backgroundColor: `${currentLeftApp.color}20`,
                          color: currentLeftApp.color,
                        }}
                      >
                        <currentLeftApp.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                        {currentLeftApp.name} Coming Soon
                      </h3>
                      <p className="text-[var(--muted)]">
                        {currentLeftApp.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CHILDREN CONTENT (for custom layouts) */}
        {!showMainActions && children}

        {/* AI CHAT PANEL */}
        {aiChatEnabled && isAiChatOpen && (
          <div className="w-80 bg-[var(--background)] border-l border-[var(--border)] flex flex-col">
            {/* AI Chat Header */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Ask me anything about {appName}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center text-[var(--muted)] text-sm">
                👋 Hi! I&apos;m your {appName} AI assistant. How can I help you
                today?
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={aiChatMessage}
                  onChange={(e) => setAiChatMessage(e.target.value)}
                  onKeyPress={(e) => e['key'] === "Enter" && handleAiChatSubmit()}
                  className="flex-1 px-3 py-2 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleAiChatSubmit}
                  disabled={!aiChatMessage.trim()}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// UTILITY FUNCTIONS FOR APPS

export function useStandaloneApp(appName: string) {
  const [activeLeftApp, setActiveLeftApp] = useState("dashboard");
  const [showMainActions, setShowMainActions] = useState(true);

  const navigateToApp = (appId: string) => {
    setActiveLeftApp(appId);
    setShowMainActions(false);
  };

  const showActions = () => {
    setShowMainActions(true);
  };

  return {
    activeLeftApp,
    showMainActions,
    navigateToApp,
    showActions,
    setActiveLeftApp,
    setShowMainActions,
  };
}
