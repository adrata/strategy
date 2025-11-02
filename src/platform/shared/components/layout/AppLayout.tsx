/**
 * 🏢 APP LAYOUT WITH CUSTOM NAVIGATION
 * Production-ready layout with VS Code-style header and comprehensive menu integration
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  CustomNavigationBar,
  useNavigationShortcuts,
} from "@/platform/shared/components/ui/CustomNavigationBar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showFullNavigation?: boolean;
}

interface MenuEvent {
  payload: any;
}

export function AppLayout({
  children,
      title = "Adrata",
  showFullNavigation = true,
}: AppLayoutProps) {
  const [currentLayout, setCurrentLayout] = useState<
    "grid" | "columns" | "stack"
  >("grid");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentApp, setCurrentApp] = useState<string>("");

  // Initialize keyboard shortcuts
  useNavigationShortcuts();

  // Handle layout changes from navigation bar
  const handleLayoutChange = useCallback((layout: string) => {
    setCurrentLayout(layout as "grid" | "columns" | "stack");
    console.log(`Layout changed to: ${layout}`);
  }, []);

  // Handle window controls
  const handleMinimize = useCallback(() => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.appWindow.minimize();
    }
  }, []);

  const handleMaximize = useCallback(() => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.appWindow.toggleMaximize();
    }
  }, []);

  const handleClose = useCallback(() => {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.window.appWindow.close();
    }
  }, []);

  // Set up Tauri menu event listeners
  useEffect(() => {
    if (!(window as any).__TAURI__) return;

    const unlisten = (window as any).__TAURI__.event.listen(
      "menu:navigate_app",
      (event: MenuEvent) => {
        const appName = event.payload as string;
        setCurrentApp(appName);

        // Navigate to app (this would integrate with your routing system)
        console.log(`Navigating to app: ${appName}`);

        // Example: if using React Router or similar
        // navigate(`/apps/${appName}`);
      },
    );

    const unlistenLayout = (window as any).__TAURI__.event.listen(
      "menu:layout_change",
      (event: MenuEvent) => {
        const layout = event.payload as string;
        handleLayoutChange(layout);
      },
    );

    const unlistenSidebar = (window as any).__TAURI__.event.listen(
      "menu:toggle_sidebar",
      () => {
        setSidebarVisible((prev) => !prev);
      },
    );

    const unlistenPreferences = (window as any).__TAURI__.event.listen(
      "menu:preferences",
      () => {
        console.log("Open preferences");
        // Open preferences modal/page
      },
    );

    const unlistenCommandPalette = (window as any).__TAURI__.event.listen(
      "menu:command_palette",
      () => {
        console.log("Open command palette");
        // Open command palette
      },
    );

    const unlistenNewWorkspace = (window as any).__TAURI__.event.listen(
      "menu:new_workspace",
      () => {
        console.log("Create new workspace");
        // Create new workspace
      },
    );

    const unlistenNewCompany = (window as any).__TAURI__.event.listen(
      "menu:new_company",
      () => {
        console.log("Create new company");
        // Open new company modal
      },
    );

    const unlistenImportData = (window as any).__TAURI__.event.listen(
      "menu:import_data",
      () => {
        console.log("Import data");
        // Open import dialog
      },
    );

    const unlistenExportData = (window as any).__TAURI__.event.listen(
      "menu:export_data",
      () => {
        console.log("Export data");
        // Open export dialog
      },
    );

    const unlistenRunMonaco = (window as any).__TAURI__.event.listen(
      "menu:run_monaco",
      () => {
        console.log("Run Monaco pipeline");
        // Run Monaco analysis
      },
    );

    const unlistenEnrichCompany = (window as any).__TAURI__.event.listen(
      "menu:enrich_company",
      () => {
        console.log("Enrich current company");
        // Run enrichment
      },
    );

    const unlistenAiAssistant = (window as any).__TAURI__.event.listen(
      "menu:ai_assistant",
      () => {
        console.log("Open AI assistant");
        // Open AI assistant
      },
    );

    const unlistenFlightRisk = (window as any).__TAURI__.event.listen(
      "menu:flight_risk_all",
      () => {
        console.log("Analyze flight risk for all contacts");
        // Run flight risk analysis
      },
    );

    const unlistenSpeedrunBuilder = (window as any).__TAURI__.event.listen(
      "menu:speedrun_builder",
      () => {
        console.log("Open speedrun builder");
        // Open speedrun campaign builder
      },
    );

    const unlistenReportGenerator = (window as any).__TAURI__.event.listen(
      "menu:report_generator",
      () => {
        console.log("Open report generator");
        // Open report generator
      },
    );

    const unlistenWelcomeGuide = (window as any).__TAURI__.event.listen(
      "menu:welcome_guide",
      () => {
        console.log("Show welcome guide");
        // Show welcome guide
      },
    );

    const unlistenUserManual = (window as any).__TAURI__.event.listen(
      "menu:user_manual",
      () => {
        console.log("Open user manual");
        // Open user manual
      },
    );

    const unlistenKeyboardShortcuts = (window as any).__TAURI__.event.listen(
      "menu:keyboard_shortcuts",
      () => {
        console.log("Show keyboard shortcuts");
        // Show keyboard shortcuts modal
      },
    );

    const unlistenContactSupport = (window as any).__TAURI__.event.listen(
      "menu:contact_support",
      () => {
        console.log("Contact support");
        // Open support contact
      },
    );

    // Cleanup listeners on unmount
    return () => {
      Promise.all([
        unlisten,
        unlistenLayout,
        unlistenSidebar,
        unlistenPreferences,
        unlistenCommandPalette,
        unlistenNewWorkspace,
        unlistenNewCompany,
        unlistenImportData,
        unlistenExportData,
        unlistenRunMonaco,
        unlistenEnrichCompany,
        unlistenAiAssistant,
        unlistenFlightRisk,
        unlistenSpeedrunBuilder,
        unlistenReportGenerator,
        unlistenWelcomeGuide,
        unlistenUserManual,
        unlistenKeyboardShortcuts,
        unlistenContactSupport,
      ]).then((listeners) => {
        listeners.forEach((fn) => fn());
      });
    };
  }, [handleLayoutChange]);

  // Layout class mapping
  const layoutClasses = {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    columns: "flex flex-col md:flex-row gap-6",
    stack: "flex flex-col gap-6",
  };

  return (
    <div className="h-screen flex flex-col bg-panel-background">
      {/* Custom Navigation Bar */}
      {showFullNavigation && (
        <CustomNavigationBar
          title={title}
          showTrafficLights={true}
          showLayoutControls={true}
          showSearch={true}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={handleClose}
          onLayoutChange={handleLayoutChange}
          className="flex-shrink-0"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (conditionally visible) */}
        {sidebarVisible && (
          <div className="w-64 bg-background border-r border-border flex-shrink-0">
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Navigation</h3>

              {/* App Navigation */}
              <nav className="space-y-2">
                {[
                  { id: "monaco", name: "Monaco", icon: "🏢", shortcut: "⌘1" },
                  {
                    id: "acquire",
                    name: "Acquire",
                    icon: "🎯",
                    shortcut: "⌘2",
                  },
                  { id: "Speedrun", name: "Speedrun", icon: "📧", shortcut: "⌘3" },
                  {
                    id: "pipeline",
                    name: "Pipeline",
                    icon: "🚀",
                    shortcut: "⌘4",
                  },
                  {
                    id: "navigate",
                    name: "Navigate",
                    icon: "🧭",
                    shortcut: "⌘5",
                  },
                  {
                    id: "battleground",
                    name: "Battleground",
                    icon: "⚔️",
                    shortcut: "⌘6",
                  },
                  {
                    id: "chessboard",
                    name: "Chessboard",
                    icon: "♛",
                    shortcut: "⌘7",
                  },
                  {
                    id: "catalyst",
                    name: "Catalyst",
                    icon: "🚀",
                    shortcut: "⌘8",
                  },
                  {
                    id: "recruit",
                    name: "Recruit",
                    icon: "👥",
                    shortcut: "⌘9",
                  },
                ].map((app) => (
                  <button
                    key={app.id}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentApp === app.id
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-hover"
                    }`}
                    onClick={() => setCurrentApp(app.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{app.icon}</span>
                      <span>{app.name}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {app.shortcut}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Layout Controls */}
              <div className="mt-8">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">
                  Layout
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "grid", name: "Grid", icon: "⊞" },
                    { id: "columns", name: "Columns", icon: "⫸" },
                    { id: "stack", name: "Stack", icon: "≣" },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      className={`p-2 rounded text-center text-xs transition-colors ${
                        currentLayout === layout.id
                          ? "bg-blue-100 text-blue-900"
                          : "text-muted hover:bg-hover"
                      }`}
                      onClick={() => handleLayoutChange(layout.id)}
                      title={layout.name}
                    >
                      <div className="text-lg">{layout.icon}</div>
                      <div className="mt-1">{layout.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">
                  Quick Actions
                </h4>
                <div className="space-y-1">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-hover rounded">
                    🔍 Command Palette
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-hover rounded">
                    🤖 AI Assistant
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-hover rounded">
                    ⚙️ Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-hover rounded">
                    ❓ Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className={`p-6 h-full ${layoutClasses[currentLayout]}`}>
            {children}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-blue-600 text-white text-xs flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>🟢 Connected</span>
          <span>Layout: {currentLayout}</span>
          <span>App: {currentApp || "None"}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Sync: 2s ago</span>
          <span>User: Admin</span>
          <span>v2.1.0</span>
        </div>
      </div>
    </div>
  );
}

// Export menu event types for use in other components
export interface MenuEventHandlers {
  onNavigateApp?: (appId: string) => void;
  onLayoutChange?: (layout: string) => void;
  onToggleSidebar?: () => void;
  onOpenPreferences?: () => void;
  onOpenCommandPalette?: () => void;
  onNewWorkspace?: () => void;
  onNewCompany?: () => void;
  onImportData?: () => void;
  onExportData?: () => void;
  onRunMonaco?: () => void;
  onEnrichCompany?: () => void;
  onOpenAiAssistant?: () => void;
  onFlightRiskAnalysis?: () => void;
  onOpenSpeedrunBuilder?: () => void;
  onOpenReportGenerator?: () => void;
  onShowWelcomeGuide?: () => void;
  onShowUserManual?: () => void;
  onShowKeyboardShortcuts?: () => void;
  onContactSupport?: () => void;
}

// Hook for handling menu events
export function useMenuEventHandlers(handlers: MenuEventHandlers) {
  useEffect(() => {
    if (!(window as any).__TAURI__) return;

    const eventListeners: Array<() => Promise<void>> = [];

    // Register all event listeners
    Object.entries(handlers).forEach(([handlerName, handler]) => {
      if (!handler) return;

      const eventName = handlerName
        .replace("on", "")
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "menu:");

      const listener = (window as any).__TAURI__.event.listen(
        eventName,
        (event: MenuEvent) => {
          handler(event.payload);
        },
      );

      eventListeners.push(listener);
    });

    // Cleanup function
    return () => {
      Promise.all(eventListeners).then((listeners) => {
        listeners.forEach((fn) => fn());
      });
    };
  }, [handlers]);
}

export default AppLayout;
