/**
 * ProfileBox Component
 * 
 * User profile dropdown with workspace switching, settings, and navigation options.
 * Follows 2025 best practices for React components and user interface patterns.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { getWorkspaceUrl, getWorkspaceBySlug, parseWorkspaceFromUrl } from "@/platform/auth/workspace-slugs";
import {
  UserIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  BookOpenIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { WindowsIcon, AppleIcon, LinuxIcon } from "./OSIcons";
// import { DemoScenarioSwitcher } from "./DemoScenarioSwitcher"; // Removed - no longer using demo scenarios popup
import { GrandCentralModal } from "./GrandCentralModal";
import { DemoScenarioNavigationService } from "@/platform/services/DemoScenarioNavigationService";
import { useSettingsPopup } from "./SettingsPopupContext";
import { AdminPanel } from "./AdminPanel";
import { ThemePickerModal } from "./ThemePickerModal";

// Theme keys that should be preserved during sign-out to prevent theme flash
const THEME_KEYS_TO_PRESERVE = [
  'adrata-theme-preferences',
  'adrata-theme-mode',
  'adrata-light-theme',
  'adrata-dark-theme',
];

// -------- Types & interfaces --------
interface ProfileBoxProps {
  user: { name: string; lastName?: string };
  company: string;
  workspace: string;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  onGrandCentralClick?: () => void;
  username?: string;
  // Monaco-specific toggle props
  isSellersVisible?: boolean;
  setIsSellersVisible?: (visible: boolean) => void;
  isRtpVisible?: boolean;
  setIsRtpVisible?: (visible: boolean) => void;
  // Pipeline section toggles
  isProspectsVisible?: boolean;
  setIsProspectsVisible?: (visible: boolean) => void;
  isLeadsVisible?: boolean;
  setIsLeadsVisible?: (visible: boolean) => void;
  isOpportunitiesVisible?: boolean;
  setIsOpportunitiesVisible?: (visible: boolean) => void;
  isCustomersVisible?: boolean;
  setIsCustomersVisible?: (visible: boolean) => void;
  isPartnersVisible?: boolean;
  setIsPartnersVisible?: (visible: boolean) => void;
  // RTP Engine configuration
  onRtpEngineClick?: () => void;
  // Speedrun Engine configuration
  onSpeedrunEngineClick?: () => void;
  // Demo scenario props
  isDemoMode?: boolean;
  currentDemoScenario?: string;
  onDemoScenarioChange?: (scenarioSlug: string) => void;
  // Theme picker props
  isThemePickerOpen?: boolean;
  setIsThemePickerOpen?: (open: boolean) => void;
}

interface DocItem {
  id: string;
  title: string;
  description: string;
  category: "user-guide" | "api-docs" | "ai-knowledge" | "training" | "help";
  icon: React.ComponentType<any>;
  href?: string;
  isExternal?: boolean;
}

// -------- Main component --------
export const ProfileBox: React.FC<ProfileBoxProps> = ({
  user,
  company,
  workspace,
  username,
  isProfileOpen,
  setIsProfileOpen,
  onGrandCentralClick,
  isSellersVisible,
  setIsSellersVisible,
  isRtpVisible,
  setIsRtpVisible,
  isProspectsVisible,
  setIsProspectsVisible,
  isLeadsVisible,
  setIsLeadsVisible,
  isOpportunitiesVisible,
  setIsOpportunitiesVisible,
  isCustomersVisible,
  setIsCustomersVisible,
  isPartnersVisible,
  setIsPartnersVisible,
  onRtpEngineClick,
  onSpeedrunEngineClick,
  isDemoMode,
  currentDemoScenario,
  onDemoScenarioChange,
  isThemePickerOpen,
  setIsThemePickerOpen,
}) => {
  const router = useRouter();
  const { signOut, isDesktop, user: authUser } = useUnifiedAuth();
  console.log('🚨 ProfileBox component is rendering!', { userEmail: authUser?.email, isProfileOpen });
  const { setIsSettingsOpen } = useSettingsPopup();
  const [activeTab, setActiveTab] = useState<"main" | "docs">("main");
  // const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false); // Removed - no longer using demo scenarios popup
  const [isGrandCentralOpen, setIsGrandCentralOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const initial = user.name?.charAt(0).toUpperCase() || "?";

  // Get current workspace info
  const currentWorkspaceId = authUser?.activeWorkspaceId;
  const currentWorkspace = authUser?.workspaces?.find(ws => ws['id'] === currentWorkspaceId);
  const currentWorkspaceSlug = currentWorkspace ? getWorkspaceUrl(currentWorkspace, "").replace("/", "") : "";
  
  const currentUserEmail = authUser?.email;
  const isDanoUser = currentUserEmail?.toLowerCase().includes('dano') || currentUserEmail === 'dano@retail-products.com';
  
  // Demo options should show for Adrata users (dan and ross) in the adrata workspace
  const isAdrataUser = (currentUserEmail === 'dan@adrata.com' || currentUserEmail === 'ross@adrata.com') || isDemoMode;
  const shouldShowMonacoOptions = isAdrataUser;
  
  // Admin features restricted to ross, todd, and dan@adrata.com
  const ADMIN_EMAILS = ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'];
  const isAdminUser = ADMIN_EMAILS.includes(currentUserEmail || '');
  
  console.log(`🏢 ProfileBox: Current workspace ID: ${currentWorkspaceId}, User email: ${currentUserEmail}, Workspace name: ${workspace}, isDanoUser: ${isDanoUser}, isAdrataUser: ${isAdrataUser}, isDemoMode: ${isDemoMode}`);

  // Use inline styles for positioning instead of fixed positioning
  const profileBoxStyle: React.CSSProperties = {
    width: "320px",
    // Remove positioning - let parent container handle it
    zIndex: 9999,
  };

  // Documentation items organized by category
  const docItems: DocItem[] = [
    // User Guides
    {
      id: "aos-guide",
      title: "Action Platform Guide",
      description:
        "Complete guide to all 6 sub-apps: Cal, Speedrun, Acquire, Expand, Monaco, Notes",
      category: "user-guide",
      icon: BookOpenIcon,
      href: "/docs/aos",
    },
    {
      id: "ai-intelligence-guide",
      title: "AI Intelligence Guide",
      description:
        "How to use Adrata AI for maximum efficiency and 95% cost optimization",
      category: "user-guide",
      icon: SparklesIcon,
      href: "/docs/ai-intelligence",
    },
    {
      id: "accessibility-guide",
      title: "Accessibility Features",
      description:
        "Screen reader support, keyboard navigation, and visual accessibility options",
      category: "user-guide",
      icon: QuestionMarkCircleIcon,
      href: "/docs/accessibility",
    },

    // AI Knowledge Base
    {
      id: "prompt-engineering",
      title: "Prompt Engineering Best Practices",
      description:
        "Advanced prompting techniques for Claude 4, GPT-4.1, and Gemini 2.5",
      category: "ai-knowledge",
      icon: AcademicCapIcon,
      href: "/docs/prompt-engineering",
    },
    {
      id: "model-selection",
      title: "AI Model Selection Guide",
      description: "When to use Claude vs GPT vs Gemini for different tasks",
      category: "ai-knowledge",
      icon: SparklesIcon,
      href: "/docs/model-selection",
    },
    {
      id: "cost-optimization",
      title: "AI Cost Optimization",
      description: "How we achieve 95% cost savings with smart model routing",
      category: "ai-knowledge",
      icon: SparklesIcon,
      href: "/docs/cost-optimization",
    },

    // API Documentation
    {
      id: "api-reference",
      title: "API Reference",
      description: "Complete API documentation for developers and integrations",
      category: "api-docs",
      icon: CogIcon,
      href: "/docs/api",
    },

    // Training Materials
    {
      id: "onboarding",
      title: "New User Onboarding",
      description: "Step-by-step guide to getting started with Adrata",
      category: "training",
      icon: AcademicCapIcon,
      href: "/docs/onboarding",
    },
  ];

  const getCategoryIcon = (category: DocItem["category"]) => {
    switch (category) {
      case "user-guide":
        return BookOpenIcon;
      case "ai-knowledge":
        return SparklesIcon;
      case "api-docs":
        return CogIcon;
      case "training":
        return AcademicCapIcon;
      case "help":
        return QuestionMarkCircleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getCategoryTitle = (category: DocItem["category"]) => {
    switch (category) {
      case "user-guide":
        return "User Guides";
      case "ai-knowledge":
        return "AI Knowledge Base";
      case "api-docs":
        return "API Documentation";
      case "training":
        return "Training & Onboarding";
      case "help":
        return "Help & Support";
      default:
        return "Documentation";
    }
  };

  const groupedDocs = docItems.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<DocItem["category"], DocItem[]>,
  );

  const handleNavigation = (route: string) => {
    setIsProfileOpen(false);

    // Use appropriate navigation method for platform
    if (isDesktop) {
      // Allow navigation to Grand Central routes, pipeline, settings pages, and workspace apps for admin users
      const allowedDesktopRoutes = [
        "/pipeline",
        "./grand-central/dashboard",
        "./grand-central/profile",
        "./grand-central/integrations",
        "./grand-central/settings",
        "/highway",
        "/optimization",
        "/docs/", // Allow all docs routes
        "./action-guide", // Allow action guide routes
        // Workspace apps - only for admin users
        ...(isAdminUser ? [
          "./stacks",
          "./atrium", 
          "./particle",
          "./tower",
          "./olympus",
          "./encode",
          "./database"
        ] : []),
        // Grand Central - available for all users
        "./grand-central"
      ];

      const isAllowedRoute = allowedDesktopRoutes.some(
        (allowedRoute) =>
          route === allowedRoute || route.startsWith(allowedRoute),
      );

      if (isAllowedRoute) {
        console.log(
          `🖥️ ProfileBox: Desktop mode - allowing navigation to ${route}`,
        );
        try {
          router.push(route);
        } catch (error) {
          console.warn(
            "🖥️ ProfileBox: Router failed, using window.location:",
            error,
          );
          window['location']['href'] = route;
        }
      } else {
        console.log(
          `🖥️ ProfileBox: Desktop mode - route ${route} not in allowed list, redirecting to home`,
        );
        window['location']['href'] = "/";
      }
    } else {
      console.log(`🌐 ProfileBox: Web mode, navigating to ${route}`);
      router.push(route);
    }
  };

  const handleDocClick = (docItem: DocItem) => {
    if (docItem.href) {
      if (docItem.isExternal) {
        window.open(docItem.href, "_blank", "noopener,noreferrer");
      } else {
        handleNavigation(docItem.href);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("🔐 ProfileBox: Starting optimized sign out process...");

      // 🚀 PERFORMANCE: Close profile popup immediately for instant UI feedback
      setIsProfileOpen(false);

      // 🚀 PERFORMANCE: Show immediate visual feedback
      if (typeof window !== "undefined") {
        document.body['style']['pointerEvents'] = "none";
        document.body['style']['opacity'] = "0.7";
      }

      // 🚀 PERFORMANCE: Call the optimized auth system sign-out
      await signOut();
      console.log("✅ ProfileBox: Sign out completed successfully");

      // 🚀 PERFORMANCE: Additional cleanup (auth system already cleared most storage)
      if (typeof window !== "undefined") {
        // Clear any remaining app-specific storage
        localStorage.removeItem('speedrun-engine-settings');
        localStorage.removeItem('dashboard-cache');
        localStorage.removeItem('pipeline-cache');
        
        console.log("🎯 ProfileBox: Additional storage cleared");
        
        // 🚀 PERFORMANCE: Use optimized redirect
        if (isDesktop) {
          console.log("🖥️ ProfileBox: Desktop - using optimized redirect...");
          window.location.replace('/sign-in');
        } else {
          // For web, use optimized redirect
          const homeUrl = "/sign-in";
          
          console.log("🌐 ProfileBox: Web - Redirecting to sign-in form");
          console.log("🌐 ProfileBox: Before redirect - current URL:", window.location.href);
          console.log("🌐 ProfileBox: Attempting redirect to:", homeUrl);
          
          // Try using both methods for maximum compatibility
          try {
            window['location']['href'] = homeUrl;
            console.log("✅ ProfileBox: Location.href redirect attempted");
          } catch (error) {
            console.error("❌ ProfileBox: Location.href failed, trying replace:", error);
            try {
              window.location.replace(homeUrl);
              console.log("✅ ProfileBox: Location.replace redirect attempted");
            } catch (replaceError) {
              console.error("❌ ProfileBox: Both redirect methods failed:", replaceError);
              // Final fallback - reload the page
              window.location.reload();
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ ProfileBox: Sign out error:", error);
      console.error("❌ ProfileBox: Current URL during error:", window.location.href);

      // Emergency fallback - immediate clear and reload (preserve theme to prevent flash)
      if (typeof window !== "undefined") {
        // Save theme preferences before clearing
        const themeData: Record<string, string | null> = {};
        THEME_KEYS_TO_PRESERVE.forEach(key => {
          themeData[key] = localStorage.getItem(key);
        });
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore theme preferences to prevent flash
        Object.entries(themeData).forEach(([key, value]) => {
          if (value !== null) {
            localStorage.setItem(key, value);
          }
        });
        
        console.log("🔧 ProfileBox: Emergency fallback - reloading page (theme preserved)");
        window.location.reload();
      }
    }
  };



  const handleGrandCentralClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🏢 ProfileBox: Grand Central clicked");
    setIsProfileOpen(false);

    if (onGrandCentralClick) {
      console.log("🏢 ProfileBox: Using provided onGrandCentralClick callback");
      onGrandCentralClick();
    } else {
      console.log("🏢 ProfileBox: Navigating to Grand Central dashboard");
      handleNavigation("./grand-central/dashboard");
    }
  };

  const handleDemoScenarioSelection = async (scenarioSlug: string) => {
    try {
      console.log(`🎯 ProfileBox: Demo scenario selected: ${scenarioSlug}`);
      setIsProfileOpen(false); // Close profile popup
      
      // Use the demo scenario navigation service
      await DemoScenarioNavigationService.handleDemoScenarioSelection(scenarioSlug);
      
    } catch (error) {
      console.error('❌ ProfileBox: Error handling demo scenario selection:', error);
      // Show error message to user
      alert('Failed to switch to demo scenario. Please try again.');
    }
  };

  const handleDemoWorkspaceClick = async () => {
    try {
      console.log('🎯 ProfileBox: Demo workspace clicked - navigating directly to demo workspace');
      setIsProfileOpen(false); // Close profile popup
      
      // Navigate directly to the demo workspace
      if (typeof window !== 'undefined') {
        window.location.href = '/demo/people';
      }
      
    } catch (error) {
      console.error('❌ ProfileBox: Error navigating to demo workspace:', error);
      // Show error message to user
      alert('Failed to switch to demo workspace. Please try again.');
    }
  };

  const handleDownloadDesktopApp = () => {
    console.log('📥 ProfileBox: Download desktop app clicked');
    setIsProfileOpen(false);
    
    // Detect platform
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    let downloadUrl = '';
    
    if (platform.includes('mac') || userAgent.includes('mac')) {
      downloadUrl = '/downloads/Adrata_1.0.2_universal.dmg';
    } else if (platform.includes('win') || userAgent.includes('windows')) {
      downloadUrl = '/downloads/Adrata_1.0.2_x64_en-US.msi';
    } else {
      // Linux
      downloadUrl = '/downloads/adrata_1.0.2_amd64.deb';
    }
    
    console.log(`📥 ProfileBox: Triggering download for ${platform}: ${downloadUrl}`);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Platform detection for appropriate icon
  const getPlatformIcon = () => {
    if (typeof window === 'undefined') return WindowsIcon;
    
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check if mobile device
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return DevicePhoneMobileIcon;
    }
    
    // Check if Mac
    if (platform.includes('mac') || userAgent.includes('mac')) {
      return AppleIcon;
    }
    
    // Check if Linux
    if (platform.includes('linux') || userAgent.includes('linux')) {
      return LinuxIcon;
    }
    
    // Default to Windows icon
    return WindowsIcon;
  };

  const PlatformIcon = getPlatformIcon();

  return (
    <div
      className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50"
      style={profileBoxStyle}
      role="dialog"
      aria-labelledby="profile-dialog-title"
      aria-describedby="profile-dialog-description"
    >
      {/* Header */}
      <div className="pl-6 pr-4 pt-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h3
              id="profile-dialog-title"
              className="text-base font-semibold text-[var(--foreground)]"
            >
              {user.name}
            </h3>
            {workspace && (
              <p
                id="profile-dialog-description"
                className="text-sm text-[var(--muted)] mt-0.5"
              >
                {workspace}
              </p>
            )}
            {username && (
              <p className="text-sm text-[var(--muted)] mt-0.5">{username}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content - no tabs */}
      <div className="pl-4 pr-2 pt-2 pb-2">
        {/* Download Button - Show only for web users and admin users */}
        {!isDesktop && isAdminUser && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors flex items-center"
            onClick={handleDownloadDesktopApp}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleDownloadDesktopApp()}
          >
            <PlatformIcon className="w-4 h-4 mr-2" />
            Download
          </div>
        )}

        {/* Demo Section - Show for Adrata users (dan and ross) */}
        {isAdrataUser && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={handleDemoWorkspaceClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e['key'] === "Enter" && handleDemoWorkspaceClick()}
          >
            Demo
          </div>
        )}

        {/* Docs - Documentation System - Admin only */}
        {isAdminUser && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              console.log("📚 Docs clicked - navigating to documentation");
              setIsProfileOpen(false);
              handleNavigation("./docs");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e['key'] === "Enter") {
                setIsProfileOpen(false);
                handleNavigation("./docs");
              }
            }}
          >
            Docs
          </div>
        )}

        {/* Workspace Apps - Admin only */}
        {isAdminUser && (
          <>
            {/* Stacks */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("📦 Stacks clicked - navigating to stacks");
                setIsProfileOpen(false);
                handleNavigation("./stacks");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./stacks");
                }
              }}
            >
              Stacks
            </div>

            {/* Atrium */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("🏛️ Atrium clicked - navigating to atrium");
                setIsProfileOpen(false);
                handleNavigation("./atrium");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./atrium");
                }
              }}
            >
              Atrium
            </div>

            {/* Particle */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("⚛️ Particle clicked - navigating to particle");
                setIsProfileOpen(false);
                handleNavigation("./particle");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./particle");
                }
              }}
            >
              Particle
            </div>

            {/* Tower */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("🗼 Tower clicked - navigating to tower");
                setIsProfileOpen(false);
                handleNavigation("./tower");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./tower");
                }
              }}
            >
              Tower
            </div>


            {/* Olympus */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("🏔️ Olympus clicked - navigating to olympus");
                setIsProfileOpen(false);
                handleNavigation("./olympus");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./olympus");
                }
              }}
            >
              Olympus
            </div>

            {/* Encode */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("💻 Encode clicked - navigating to encode");
                setIsProfileOpen(false);
                handleNavigation("./encode");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./encode");
                }
              }}
            >
              Encode
            </div>

            {/* Database */}
            <div
              className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                console.log("🗄️ Database clicked - navigating to database");
                setIsProfileOpen(false);
                handleNavigation("./database");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e['key'] === "Enter") {
                  setIsProfileOpen(false);
                  handleNavigation("./database");
                }
              }}
            >
              Database
            </div>
          </>
        )}

        {/* Monaco Display Options - Show only in demo mode */}
        {isDemoMode && setIsSellersVisible && typeof setIsSellersVisible === 'function' && (
          <>
            <div className="px-2 py-1">
              <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                Monaco Display Options
              </div>
              
              {/* Speedrun Real-Time Priority toggle - Only for demo mode */}
              {setIsRtpVisible && typeof setIsRtpVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Speedrun</span>
                  <button
                    onClick={() => setIsRtpVisible(!isRtpVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isRtpVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isRtpVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              {/* Sellers visibility toggle - Only for demo mode */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--foreground)]">Show Sellers</span>
                <button
                  onClick={() => setIsSellersVisible(!isSellersVisible)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isSellersVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                      isSellersVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Prospects visibility toggle - Only for demo mode */}
              {setIsProspectsVisible && typeof setIsProspectsVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Prospects</span>
                  <button
                    onClick={() => setIsProspectsVisible(!isProspectsVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isProspectsVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isProspectsVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              {/* Leads visibility toggle - Only for demo mode */}
              {setIsLeadsVisible && typeof setIsLeadsVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Leads</span>
                  <button
                    onClick={() => setIsLeadsVisible(!isLeadsVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isLeadsVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isLeadsVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              {/* Opportunities visibility toggle - Only for demo mode */}
              {setIsOpportunitiesVisible && typeof setIsOpportunitiesVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Opportunities</span>
                  <button
                    onClick={() => setIsOpportunitiesVisible(!isOpportunitiesVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isOpportunitiesVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isOpportunitiesVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              {/* Customers (Clients) visibility toggle - Only for demo mode */}
              {setIsCustomersVisible && typeof setIsCustomersVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Customers</span>
                  <button
                    onClick={() => setIsCustomersVisible(!isCustomersVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isCustomersVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isCustomersVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              {/* Partners visibility toggle - Only for demo mode */}
              {setIsPartnersVisible && typeof setIsPartnersVisible === 'function' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--foreground)]">Show Partners</span>
                  <button
                    onClick={() => setIsPartnersVisible(!isPartnersVisible)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      isPartnersVisible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-[var(--background)] rounded-full absolute top-1 transition-transform ${
                        isPartnersVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* 1. Themes - Hidden from all users */}
        {/* {isAdminUser && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 Themes clicked - opening theme picker');
              console.log('🎨 Current isThemePickerOpen:', isThemePickerOpen);
              setIsProfileOpen(false);
              // Use setTimeout to ensure state update happens after profile closes
              setTimeout(() => {
                console.log('🎨 Setting isThemePickerOpen to true after timeout');
                setIsThemePickerOpen?.(true);
              }, 100);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e['key'] === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                setIsProfileOpen(false);
                setTimeout(() => {
                  setIsThemePickerOpen?.(true);
                }, 100);
              }
            }}
          >
            Themes
          </div>
        )} */}
        

        {/* 3. Settings */}
        <div
          className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
          onClick={() => {
            console.log('⚙️ ProfileBox: Settings clicked, opening settings popup');
            setIsProfileOpen(false);
            // Open settings popup after profile closes
            setTimeout(() => {
              console.log('⚙️ ProfileBox: Opening settings popup');
              setIsSettingsOpen(true);
            }, 100);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e['key'] === "Enter" && setIsProfileOpen(false)
          }
        >
          Settings
        </div>

        {/* 4. Admin Panel - Show only for admin users */}
        {isAdminUser && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors flex items-center"
            onClick={() => {
              console.log('👥 ProfileBox: Admin clicked, opening admin panel');
              setIsProfileOpen(false);
              
              // Open admin panel after profile closes
              setTimeout(() => {
                console.log('👥 ProfileBox: Opening admin panel');
                setIsAdminPanelOpen(true);
              }, 100);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e['key'] === "Enter" && setIsProfileOpen(false)
            }
          >
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Admin
          </div>
        )}
        
        {/* 3. Workspaces Section - Show for users with multiple workspaces */}
        {authUser?.workspaces && authUser.workspaces.length > 1 && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={() => handleNavigation("/workspaces")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e['key'] === "Enter" && handleNavigation("/workspaces")}
          >
            Workspaces
          </div>
        )}
        
        {/* 4. Action Guide - Restricted to dan, ross, and todd */}
        {(() => {
          const isAuthorized = authUser?.email && ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com'].includes(authUser.email);
          console.log('🔍 Action Guide access check:', { 
            userEmail: authUser?.email, 
            isAuthorized, 
            authorizedEmails: ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com']
          });
          return isAuthorized;
        })() && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={() => handleNavigation("./action-guide")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e['key'] === "Enter" && handleNavigation("./action-guide")}
          >
            Action Guide
          </div>
        )}
        
        {/* 5. Grand Central - Restricted to admin users */}
        {(() => {
          const isAuthorized = authUser?.email && ADMIN_EMAILS.includes(authUser.email);
          return isAuthorized;
        })() && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              console.log("🚉 Grand Central clicked - navigating to grand-central");
              setIsProfileOpen(false);
              handleNavigation("./grand-central");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e['key'] === "Enter") {
                setIsProfileOpen(false);
                handleNavigation("./grand-central");
              }
            }}
          >
            Grand Central
          </div>
        )}
        
        {/* 6. Speedrun Engine Configuration - Available for all users */}
        {onSpeedrunEngineClick && (
          <div
            className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsProfileOpen(false);
              setTimeout(() => {
                onSpeedrunEngineClick();
              }, 100);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e['key'] === "Enter" && onSpeedrunEngineClick()}
          >
            Speedrun Engine
          </div>
        )}

        {/* 7. Theme Picker - Hidden from all users */}
        {/* <div
          className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors flex items-center gap-2"
          onClick={() => {
            console.log("🎨 Theme picker clicked - opening theme picker");
            setIsProfileOpen(false);
            setIsSettingsOpen(true);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e['key'] === "Enter" && setIsSettingsOpen(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          Themes
        </div> */}
        
        {/* 8. Sign Out */}
        <div
          className="adrata-popover-item px-2 py-1.5 text-sm text-[var(--foreground)] rounded-lg cursor-pointer hover:bg-[var(--hover)] transition-colors"
          onClick={handleSignOut}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e['key'] === "Enter" && handleSignOut()}
        >
          Sign Out
        </div>
      </div>

      {/* Demo Scenario Switcher Modal - Removed, now goes directly to demo workspace */}

      {/* Grand Central Modal */}
      <GrandCentralModal
        isOpen={isGrandCentralOpen}
        onClose={() => setIsGrandCentralOpen(false)}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />

      {/* Theme Picker Modal */}
      <ThemePickerModal
        isOpen={isThemePickerOpen || false}
        onClose={() => setIsThemePickerOpen?.(false)}
      />

    </div>
  );
};
