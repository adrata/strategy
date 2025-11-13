import { useState, useEffect, useCallback } from "react";
import { ACTION_PLATFORM_APPS } from "@/platform/config";
import type { Workspace } from "@/platform/auth";

interface UseUIReturn {
  // App & Section State
  activeSubApp: string;
  activeSection: string;
  expandedSection: string | null;

  // Panel Visibility
  isLeftPanelVisible: boolean;
  isRightPanelVisible: boolean;
  isSectionChanging: boolean;

  // Modal State
  isThemeModalOpen: boolean;
  isProfileOpen: boolean;
  profileAnchor: HTMLElement | null;
  isProfilePanelVisible: boolean;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;

  // Filter & Search State
  searchQuery: string;
  selectedStageFilter: string;
  selectedForecastFilter: string;
  sortBy: string;

  // Workspace Management
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;

  // Record Management
  selectedRecord: any;
  detailViewType:
    | "lead"
    | "prospect"
    | "opportunity"
    | "account"
    | "contact"
    | "report"
    | "company"
    | null;
  editingRecord: any;

  // Company Navigation
  selectedCompany: string | null;
  navigationHistory: Array<{
    type: "app" | "record" | "company";
    app?: string;
    section?: string;
    recordId?: string;
    recordType?: string;
    companyName?: string;
  }>;

  // Actions
  setActiveSubApp: (app: string) => void;
  setActiveSection: (section: string) => void;
  setExpandedSection: (section: string | null) => void;
  setIsLeftPanelVisible: (visible: boolean) => void;
  setIsRightPanelVisible: (visible: boolean) => void;
  setIsThemeModalOpen: (open: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
  setProfileAnchor: (anchor: HTMLElement | null) => void;
  setIsProfilePanelVisible: (visible: boolean) => void;
  setIsAddModalOpen: (open: boolean) => void;
  setIsEditModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedStageFilter: (filter: string) => void;
  setSelectedForecastFilter: (filter: string) => void;
  setSortBy: (sort: string) => void;
  setSelectedRecord: (record: any) => void;
  setDetailViewType: (
    type:
      | "lead"
      | "prospect"
      | "opportunity"
      | "account"
      | "contact"
      | "report"
      | "company"
      | null,
  ) => void;
  setEditingRecord: (record: any) => void;
  setSelectedCompany: (company: string | null) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;

  // Utility Functions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  handleRecordClick: (record: any, recordType?: string) => void;
  handleCompanyClick: (companyName: string) => void;
  handleBackNavigation: () => void;
}

/**
 * UI HOOK
 * Manages all UI state for the platform
 * - App & section navigation
 * - Panel visibility
 * - Modal state
 * - Filters & search
 * - Record selection
 */
export function useUI(): UseUIReturn {
  // Check if we're on client side
  const isClient = typeof window !== "undefined";

  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`[UI HOOK] ${phase}:`, details);
  };

  // App & Section State
  const [activeSubApp, setActiveSubApp] = useState("Speedrun");
  const [activeSection, setActiveSection] = useState("speedrun");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // PERFORMANCE: Track section changes for immediate UI feedback
  const [isSectionChanging, setIsSectionChanging] = useState(false);
  
  // PERFORMANCE: Optimized setActiveSection with immediate feedback
  const setActiveSectionOptimized = useCallback((section: string) => {
    console.log(`[UI HOOK] Immediate section change: ${activeSection} -> ${section}`);
    
    // Set immediate visual feedback
    setIsSectionChanging(true);
    
    // Update section immediately
    setActiveSection(section);
    
    // Clear loading state after a short delay to allow UI to update
    setTimeout(() => {
      setIsSectionChanging(false);
    }, 100);
  }, [activeSection]);

  // Panel Visibility - Configure based on route type
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(() => {
    // Check if we're on Pipeline initially
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/aos/pipeline')) {
        return false; // Hide left panel for embedded Pipeline clean UI
      } else if (currentPath.includes('/dashboard') || currentPath.includes('/leads') || currentPath.includes('/opportunities') || currentPath.includes('/companies') || currentPath.includes('/people') || currentPath.includes('/partners') || currentPath.includes('/prospects') || currentPath.includes('/sellers') || currentPath.includes('/clients') || currentPath.includes('/metrics') || currentPath.includes('/chronicle') || currentPath.includes('/speedrun') || currentPath.includes('/stacks')) {
        return true; // Show left panel for standalone Pipeline navigation and Stacks
      }
    }
    return true; // Show for all other apps
  });
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(() => {
    // Keep right panel open for all apps including Pipeline for AI assistance
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/aos/pipeline')) {
        return true; // Keep right panel open for Pipeline AI assistance
      }
    }
    return true; // Show for all other apps
  });

  // Modal State
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isProfilePanelVisible, setIsProfilePanelVisible] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState("All Stages");
  const [selectedForecastFilter, setSelectedForecastFilter] =
    useState("All Opportunities");
  const [sortBy, setSortBy] = useState("Elite Focus");

  // Workspace Management
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null,
  );

  // Record Management
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailViewType, setDetailViewType] = useState<
    "lead" | "opportunity" | "account" | "contact" | "report" | "company" | null
  >(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Company Navigation
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<
    Array<{
      type: "app" | "record" | "company";
      app?: string;
      section?: string;
      recordId?: string;
      recordType?: string;
      companyName?: string;
    }>
  >([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    debug("LOADING_UI_STATE", { isClient });

    try {
      // Determine app from URL first - this takes precedence
      let appFromUrl = null;
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.includes('/aos/monaco')) {
          appFromUrl = 'monaco';
        } else if (path.includes('/aos/speedrun')) {
          appFromUrl = 'Speedrun';
        } else if (path.includes('/aos/pipeline')) {
          appFromUrl = 'pipeline';
        } else if (path.includes('/dashboard') || path.includes('/leads') || path.includes('/opportunities') || path.includes('/companies') || path.includes('/people') || path.includes('/partners') || path.includes('/prospects') || path.includes('/sellers') || path.includes('/clients') || path.includes('/metrics') || path.includes('/chronicle') || path.includes('/speedrun')) {
          // Standalone pipeline routes - use a different app name to distinguish from embedded
          appFromUrl = 'standalone-pipeline';
        } else if (path.includes('/aos/')) {
          // Extract app name from URL path like /aos/appname
          const match = path.match(/\/aos\/([^\/]+)/);
          if (match && match[1]) {
            appFromUrl = match[1];
          }
        }
      }

      const savedApp = localStorage.getItem("aos-active-sub-app");
      const savedSection = localStorage.getItem(
        "aos-active-section",
      );

      // Clean up old Monaco ICP sections from localStorage
      const monacoSection = localStorage.getItem("aos-monaco-active-section");
      const invalidMonacoSections = ["icp1", "icp2", "icp3", "icp4", "partners"];
      
      if (monacoSection && invalidMonacoSections.includes(monacoSection)) {
        console.log("Cleaning up old Monaco section:", monacoSection);
        localStorage.setItem("aos-monaco-active-section", "companies");
        // If this is the current section, override it
        if (savedSection && invalidMonacoSections.includes(savedSection)) {
          localStorage.setItem("aos-active-section", "companies");
        }
      }

      // Use URL app if available, otherwise fall back to localStorage
      const effectiveApp = appFromUrl || savedApp;
      if (effectiveApp) {
        setActiveSubApp(effectiveApp);
        debug("RESTORED_ACTIVE_APP", { appFromUrl, savedApp, effectiveApp });
      }

      if (savedSection) {
        // Ensure Monaco always uses valid sections
        if ((appFromUrl === "monaco" || savedApp === "monaco") && invalidMonacoSections.includes(savedSection)) {
          setActiveSection("companies");
          debug("FIXED_INVALID_MONACO_SECTION", { from: savedSection, to: "companies" });
        } else {
          setActiveSection(savedSection);
          debug("RESTORED_ACTIVE_SECTION", { savedSection });
        }
      }
    } catch (error) {
      debug("ERROR_LOADING_UI_STATE", { error });
    }
  }, [isClient]);

  // Set initial panel visibility based on restored app - runs after localStorage restoration
  useEffect(() => {
    if (!isClient) return;

    // Skip this effect for standalone pipeline routes and stacks - let URL-based logic handle it
    if (isClient && (window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/leads') || window.location.pathname.includes('/opportunities') || window.location.pathname.includes('/companies') || window.location.pathname.includes('/people') || window.location.pathname.includes('/partners') || window.location.pathname.includes('/prospects') || window.location.pathname.includes('/sellers') || window.location.pathname.includes('/clients') || window.location.pathname.includes('/metrics') || window.location.pathname.includes('/chronicle') || window.location.pathname.includes('/speedrun') || window.location.pathname.includes('/stacks'))) {
      debug("SKIPPING_INITIAL_PANEL_SETUP_FOR_STANDALONE_PIPELINE_OR_STACKS", { 
        activeSubApp, 
        activeSection,
        pathname: window.location.pathname
      });
      return;
    }

    debug("SETTING_INITIAL_PANEL_VISIBILITY", { activeSubApp, activeSection });

    // Configure Pipeline panels: 
    // - Speedrun routes: always show left panel (both /aos/speedrun and /speedrun)
    // - Embedded pipeline (/aos/pipeline): hide left panel for clean UI
    // - Standalone pipeline routes: show left panel for navigation
    // ALWAYS check URL path first, not activeSubApp
    if (isClient) {
      // Speedrun routes should always show the left panel
      if (window.location.pathname.includes('/speedrun')) {
        debug("ENSURING_SPEEDRUN_PANELS_BY_URL", {});
        setIsLeftPanelVisible(true);
        setIsRightPanelVisible(true);
      }
      // Other embedded pipeline routes - hide left panel for clean UI
      else if (window.location.pathname.includes('/aos/dashboard') || window.location.pathname.includes('/aos/leads') || window.location.pathname.includes('/aos/opportunities') || window.location.pathname.includes('/aos/companies') || window.location.pathname.includes('/aos/people') || window.location.pathname.includes('/aos/partners') || window.location.pathname.includes('/aos/prospects') || window.location.pathname.includes('/aos/sellers') || window.location.pathname.includes('/aos/clients') || window.location.pathname.includes('/aos/metrics') || window.location.pathname.includes('/aos/chronicle')) {
        debug("CONFIGURING_EMBEDDED_PIPELINE_PANELS_BY_URL", {});
        setIsLeftPanelVisible(false);
        setIsRightPanelVisible(true);
      }
    }
    // Fallback: Only use activeSubApp if URL doesn't match pipeline patterns
    else if (activeSubApp === "standalone-pipeline") {
      debug("CONFIGURING_STANDALONE_PIPELINE_PANELS_ON_INIT", {});
      setIsLeftPanelVisible(true);
      setIsRightPanelVisible(true);
    }
    // Ensure other AOS sections show panels
    else if (activeSubApp === "aos" && activeSection !== "pipeline") {
      debug("ENSURING_NON_PIPELINE_AOS_PANELS_ON_INIT", { activeSection });
      setIsLeftPanelVisible(true);
      setIsRightPanelVisible(true);
    }
    // Ensure Monaco shows right panel for AI assistance
    else if (activeSubApp === "monaco") {
      debug("ENSURING_MONACO_RIGHT_PANEL_ON_INIT", {});
      setIsRightPanelVisible(true);
    }
    // Ensure Speedrun shows both panels
    else if (activeSubApp === "Speedrun") {
      debug("ENSURING_SPEEDRUN_PANELS_ON_INIT", {});
      setIsLeftPanelVisible(true);
      setIsRightPanelVisible(true);
    }
  }, [activeSubApp, activeSection, isClient]);

  // Persist state changes to localStorage - DEFERRED for performance
  useEffect(() => {
    if (!isClient) return;

    // Defer localStorage operations to avoid blocking UI updates
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("aos-active-sub-app", activeSubApp);
        localStorage.setItem(
          `aos-${activeSubApp}-active-section`,
          activeSection,
        );
        localStorage.setItem("aos-active-section", activeSection);

        debug("PERSISTED_UI_STATE", { activeSubApp, activeSection });
      } catch (error) {
        debug("ERROR_PERSISTING_UI_STATE", { error });
      }
    }, 0); // Defer to next tick

    return () => clearTimeout(timeoutId);
  }, [activeSubApp, activeSection, isClient]);

  // Helper to get default section for an app
  const getDefaultSectionForApp = useCallback(
    (appId: string) => {
      if (!isClient) return "daily40";

      const getStoredSection = (key: string, fallback: string) => {
        try {
          return localStorage.getItem(key) || fallback;
        } catch {
          return fallback;
        }
      };

      switch (appId) {
        case "cal":
          return getStoredSection(
            "aos-cal-active-section",
            "today",
          );
        case "acquire":
          return getStoredSection(
            "aos-acquire-active-section",
            "leads",
          );
        case "expand":
          return getStoredSection(
            "aos-expand-active-section",
            "accounts",
          );
        case "Speedrun":
          return getStoredSection(
            "aos-speedrun-active-section",
            "daily40",
          );
        case "monaco":
          return getStoredSection(
            "aos-monaco-active-section",
            "companies",
          );
        case "pipeline":
          return getStoredSection(
            "aos-pipeline-active-section",
            "opportunities",
          );
        case "notes":
          return getStoredSection(
            "aos-notes-active-section",
            "personal",
          );
        default:
          return getStoredSection("aos-active-section", "daily40");
      }
    },
    [isClient],
  );

  // Set correct default section when switching apps - DEFERRED for performance
  useEffect(() => {
    // Defer validation to avoid blocking immediate UI updates
    const timeoutId = setTimeout(() => {
      const currentApp = ACTION_PLATFORM_APPS.find(
        (app) => app['id'] === activeSubApp,
      );
      if (currentApp && currentApp.sections.length > 0) {
        const isValidSection = currentApp.sections.includes(activeSection);

        debug("APP_SWITCH_VALIDATION", {
          activeSubApp,
          currentApp: currentApp.name,
          availableSections: currentApp.sections,
          currentSection: activeSection,
          isValidSection,
        });

        if (!isValidSection) {
          const defaultSection = getDefaultSectionForApp(activeSubApp);
          debug("FIXING_INVALID_SECTION", {
            from: activeSection,
            to: defaultSection,
            app: activeSubApp,
          });
          setActiveSection(defaultSection);
        } else if (activeSubApp === "pipeline" && activeSection === "daily40") {
          // Special case: If pipeline app is active but section is still the default "daily40", 
          // set it to the proper pipeline default
          const pipelineDefault = getDefaultSectionForApp("pipeline");
          debug("SETTING_PIPELINE_DEFAULT", {
            from: activeSection,
            to: pipelineDefault,
          });
          setActiveSection(pipelineDefault);
        }
      }
    }, 0); // Defer to next tick

    return () => clearTimeout(timeoutId);
  }, [activeSubApp, activeSection, getDefaultSectionForApp]);

  // Ensure Speedrun always shows both panels like original Speedrun
  useEffect(() => {
    if (activeSubApp === "Speedrun") {
      debug("ENSURING_SPEEDRUN_PANELS_VISIBLE", {
        leftPanelVisible: isLeftPanelVisible,
        rightPanelVisible: isRightPanelVisible,
      });
      
      if (!isLeftPanelVisible) {
        setIsLeftPanelVisible(true);
        debug("FORCE_ENABLED_LEFT_PANEL_FOR_SPEEDRUN", {});
      }
      
      if (!isRightPanelVisible) {
        setIsRightPanelVisible(true);
        debug("FORCE_ENABLED_RIGHT_PANEL_FOR_SPEEDRUN", {});
      }
    }

    // Ensure Monaco shows right panel for AI assistance
    if (activeSubApp === "monaco") {
      debug("ENSURING_MONACO_RIGHT_PANEL_VISIBLE", {
        leftPanelVisible: isLeftPanelVisible,
        rightPanelVisible: isRightPanelVisible,
      });
      
      if (!isRightPanelVisible) {
        setIsRightPanelVisible(true);
        debug("FORCE_ENABLED_RIGHT_PANEL_FOR_MONACO", {});
      }
    }

    // Ensure Pipeline panels are configured correctly:
    // - Embedded pipeline (/aos/pipeline): hide left panel for clean UI
    // - Standalone pipeline routes: show left panel for navigation
    if (isClient && (window.location.pathname.includes('/aos/dashboard') || window.location.pathname.includes('/aos/leads') || window.location.pathname.includes('/aos/opportunities') || window.location.pathname.includes('/aos/companies') || window.location.pathname.includes('/aos/people') || window.location.pathname.includes('/aos/partners') || window.location.pathname.includes('/aos/prospects') || window.location.pathname.includes('/aos/sellers') || window.location.pathname.includes('/aos/clients') || window.location.pathname.includes('/aos/metrics') || window.location.pathname.includes('/aos/chronicle') || window.location.pathname.includes('/aos/speedrun'))) {
      debug("ENSURING_EMBEDDED_PIPELINE_PANELS_CONFIGURED", {
        leftPanelVisible: isLeftPanelVisible,
        rightPanelVisible: isRightPanelVisible,
        activeSubApp,
        activeSection,
        currentPath: isClient ? window.location.pathname : 'server'
      });
      
      // Hide left panel for clean Pipeline UI (embedded only)
      if (isLeftPanelVisible) {
        setIsLeftPanelVisible(false);
        debug("FORCE_DISABLED_LEFT_PANEL_FOR_EMBEDDED_PIPELINE", {});
      }
      
      // Keep right panel open for Pipeline AI assistance
      if (!isRightPanelVisible) {
        setIsRightPanelVisible(true);
        debug("FORCE_ENABLED_RIGHT_PANEL_FOR_EMBEDDED_PIPELINE", {});
      }
    }
    // Handle standalone pipeline routes - prioritize URL path over activeSubApp
    else if (isClient && (window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/leads') || window.location.pathname.includes('/opportunities') || window.location.pathname.includes('/companies') || window.location.pathname.includes('/people') || window.location.pathname.includes('/partners') || window.location.pathname.includes('/prospects') || window.location.pathname.includes('/sellers') || window.location.pathname.includes('/clients') || window.location.pathname.includes('/metrics') || window.location.pathname.includes('/chronicle') || window.location.pathname.includes('/speedrun'))) {
      debug("ENSURING_STANDALONE_PIPELINE_PANELS_CONFIGURED", {
        leftPanelVisible: isLeftPanelVisible,
        rightPanelVisible: isRightPanelVisible,
        activeSubApp,
        activeSection,
        currentPath: window.location.pathname
      });
      
      // Show left panel for standalone pipeline navigation
      if (!isLeftPanelVisible) {
        setIsLeftPanelVisible(true);
        debug("FORCE_ENABLED_LEFT_PANEL_FOR_STANDALONE_PIPELINE", {});
      }
      
      // Keep right panel open for Pipeline AI assistance
      if (!isRightPanelVisible) {
        setIsRightPanelVisible(true);
        debug("FORCE_ENABLED_RIGHT_PANEL_FOR_STANDALONE_PIPELINE", {});
      }
    }
    // Ensure other apps show panels when navigating away from Pipeline
    else if (activeSubApp !== "pipeline") {
      debug("ENSURING_NON_PIPELINE_PANELS_VISIBLE", {
        activeSubApp,
        leftPanelVisible: isLeftPanelVisible,
        rightPanelVisible: isRightPanelVisible,
      });
      
      if (!isLeftPanelVisible) {
        setIsLeftPanelVisible(true);
        debug("FORCE_ENABLED_LEFT_PANEL_FOR_NON_PIPELINE", {});
      }
      
      if (!isRightPanelVisible) {
        setIsRightPanelVisible(true);
        debug("FORCE_ENABLED_RIGHT_PANEL_FOR_NON_PIPELINE", {});
      }
    }

    // Note: App-specific panel defaults - Pipeline: left hidden/right visible, Monaco: right panel visible for AI, Speedrun: both visible
    // Users can manually control panel visibility with keyboard shortcuts
  }, [activeSubApp, activeSection]);

  // Toggle functions
  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelVisible((prev) => {
      debug("TOGGLE_LEFT_PANEL", { from: prev, to: !prev });
      return !prev;
    });
  }, []);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelVisible((prev) => {
      debug("TOGGLE_RIGHT_PANEL", { from: prev, to: !prev });
      return !prev;
    });
  }, []);

  // Handle record click
  const handleRecordClick = useCallback(
    (record: any, recordType?: string) => {
      debug("RECORD_CLICK", {
        recordId: record.id,
        recordName: record.name,
        recordType,
        activeSection,
      });

      setSelectedRecord(record);

      let type: "lead" | "prospect" | "opportunity" | "account" | "contact" | null = null;
      if (recordType) {
        type = recordType as "lead" | "prospect" | "opportunity" | "account" | "contact";
      } else {
        // Determine from active section
        if (activeSection === "leads") type = "lead";
        else if (activeSection === "prospects") type = "prospect";
        else if (activeSection === "opportunities") type = "opportunity";
        else if (activeSection === "accounts") type = "account";
        else if (activeSection === "contacts") type = "contact";
      }

      setDetailViewType(type);
      debug("RECORD_DETAIL_VIEW_SET", { type });

      // WORKSPACE-AWARE URL NAVIGATION: Navigate to the specific record URL
      if (isClient && record['id'] && type) {
        // CRITICAL: Prevent navigation with external Coresignal IDs
        if (record.id.includes('coresignal')) {
          console.error(`[AcquisitionOS] External Coresignal ID detected: ${record.id}. Cannot navigate to external records.`);
          return;
        }
        
        let sectionName: string;
        switch (type) {
          case 'lead': sectionName = 'leads'; break;
          case 'prospect': sectionName = 'prospects'; break;
          case 'opportunity': sectionName = 'opportunities'; break;
          case 'account': sectionName = 'accounts'; break;
          case 'contact': sectionName = 'contacts'; break;
          default: sectionName = `${type}s`; break;
        }
        
        debug("URL_NAVIGATION", {
          from: window.location.pathname,
          to: `workspace-aware:/${sectionName}/${record.id}`,
          recordId: record.id,
          type
        });

        // Use Next.js router for proper navigation with workspace context
        // This will trigger the workspace navigation system
        if (typeof window !== 'undefined') {
          // We're in a workspace context, navigate using workspace-aware navigation
          const currentPath = window.location.pathname;
          const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
          
          if (workspaceMatch) {
            // We're in a workspace context, maintain it
            const workspaceSlug = workspaceMatch[1];
            const newUrl = `/${workspaceSlug}/${sectionName}/${record.id}`;
            console.log(`[AcquisitionOS] Workspace-aware navigation to: ${newUrl}`);
            window.history.pushState(null, '', newUrl);
          } else {
            // Not in workspace context, use regular navigation
            const newUrl = `/${sectionName}/${record.id}`;
            console.log(`[AcquisitionOS] Regular navigation to: ${newUrl}`);
            window.history.pushState(null, '', newUrl);
          }
        }
      }
    },
    [activeSection, isClient],
  );

  // Handle company click
  const handleCompanyClick = useCallback(
    (companyName: string) => {
      debug("COMPANY_CLICK", { companyName, activeSubApp, activeSection });

      // Store current state in navigation history
      const historyEntry = {
        type: "app" as const,
        app: activeSubApp,
        section: activeSection,
        ...(selectedRecord?.id && { recordId: selectedRecord.id }),
        ...(detailViewType && { recordType: detailViewType }),
      };

      setNavigationHistory((prev) => {
        const newHistory = [...prev, historyEntry];
        debug("NAVIGATION_HISTORY_UPDATED", {
          historyLength: newHistory.length,
          newEntry: historyEntry,
        });
        return newHistory;
      });

      setSelectedCompany(companyName);
      setDetailViewType("company");
      setSelectedRecord(null);
    },
    [activeSubApp, activeSection, selectedRecord, detailViewType],
  );

  // Handle back navigation
  const handleBackNavigation = useCallback(() => {
    debug("BACK_NAVIGATION", { historyLength: navigationHistory.length });

    if (navigationHistory.length > 0) {
      const previousState = navigationHistory[navigationHistory.length - 1];

      if (!previousState) return;

      debug("RESTORING_PREVIOUS_STATE", previousState);

      // Restore previous state
      if (previousState.app) {
        setActiveSubApp(previousState.app);
      }
      if (previousState.section) {
        setActiveSection(previousState.section);
      }
      if (previousState['recordId'] && previousState.recordType) {
        // Note: This would need access to data to find the record
        // For now, just clear selection
        setSelectedRecord(null);
        setDetailViewType(null);
      } else {
        setSelectedRecord(null);
        setDetailViewType(null);
      }

      // Clear company state
      setSelectedCompany(null);

      // Remove last item from history
      setNavigationHistory((prev) => prev.slice(0, -1));
    } else {
      debug("NO_HISTORY_AVAILABLE", { message: "Going to main view" });
      // No history, just go back to main view
      setSelectedCompany(null);
      setDetailViewType(null);
      setSelectedRecord(null);
    }
  }, [navigationHistory]);

  return {
    // State
    activeSubApp,
    activeSection,
    expandedSection,
    isLeftPanelVisible,
    isRightPanelVisible,
    isSectionChanging,
    isThemeModalOpen,
    isProfileOpen,
    profileAnchor,
    isProfilePanelVisible,
    isAddModalOpen,
    isEditModalOpen,
    searchQuery,
    selectedStageFilter,
    selectedForecastFilter,
    sortBy,
    workspaces,
    activeWorkspace,
    selectedRecord,
    detailViewType,
    editingRecord,
    selectedCompany,
    navigationHistory,

    // Setters
    setActiveSubApp,
    setActiveSection: setActiveSectionOptimized,
    setExpandedSection,
    setIsLeftPanelVisible,
    setIsRightPanelVisible,
    setIsThemeModalOpen,
    setIsProfileOpen,
    setProfileAnchor,
    setIsProfilePanelVisible,
    setIsAddModalOpen,
    setIsEditModalOpen,
    setSearchQuery,
    setSelectedStageFilter,
    setSelectedForecastFilter,
    setSortBy,
    setSelectedRecord,
    setDetailViewType,
    setEditingRecord,
    setSelectedCompany,
    setActiveWorkspace,
    setWorkspaces,

    // Actions
    toggleLeftPanel,
    toggleRightPanel,
    handleRecordClick,
    handleCompanyClick,
    handleBackNavigation,
  };
}

// Legacy alias for backwards compatibility
export const useActionPlatformUI = useUI;
