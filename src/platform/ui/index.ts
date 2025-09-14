/**
 * 🎨 Platform UI System
 * Consolidated UI components, themes, and design primitives
 * All shared UI infrastructure for Adrata products
 */

// Core Theme System
export * from "./components/ThemeProvider";
export * from "./components/ThemePicker";

// Layout Components
export * from "./components/layout/PanelLayout";
export * from "./components/layout/ThinLeftPanel";
export * from "./components/layout/AppNavIcons";

// Shared UI Components
export * from "./components/ProfileBox";
export * from "./components/ProfilePopupContext";
export * from "./components/ChatInterface";
export * from "./components/ShareBar";
export * from "./components/EmojiPicker";
export * from "./components/AdrataIntelligence";
export * from "./components/MagicalChanges";
export * from "./components/StandaloneAppFramework";
export * from "./components/StrategicIntelligenceSystem";
// export * from "./components/SlideViewer"; // Component not found
// export * from "./components/DownloadSection"; // Component not found
export * from "./components/AdrataApps";

// Platform Components (moved from components/)
export * from "./components/AppShell";
export * from "./components/NotificationInitializer";
// export * from "./components/NotificationDemo"; // Component not found
export * from "./components/ErrorBoundary";
export * from "./components/DesktopErrorBoundary";
export * from "./components/EnhancedDesktopErrorBoundary";
export * from "./components/RouteGuard";
export * from "./components/HydrationFix";
export * from "./components/React19HydrationFix";
// export * from "./components/RefreshNotification"; // Component not found
export * from "./components/RossWelcomeToast";

// Individual component exports (no index files)
export { default as Chart } from "./components/charts/Chart";
// export * from "./components/utils/environment"; // Module not found
