/**
 * 🎯 CUSTOM NAVIGATION BAR
 * VS Code-style header with traffic lights, layout controls, and app navigation
 * Production-ready navigation for Adrata
 */

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  MinusIcon,
  CommandLineIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import {
  UserIcon,
  UserPlusIcon,
  CogIcon,
  PowerIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/solid";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useActionPlatform } from "@/platform/ui/context/ActionPlatformProvider";
import { useUnifiedAuth } from "@/platform/auth";

interface CustomNavigationBarProps {
  showLogo?: boolean;
  isDarkMode?: boolean;
  showActionPlatformBadge?: boolean;
  showOasisBadge?: boolean;
  compactMode?: boolean;
  centerContent?: boolean;
  showTrafficLights?: boolean;
  showLayoutControls?: boolean;
  showSearch?: boolean;
  title?: string;
  className?: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onLayoutChange?: (layout: string) => void;
}

// Safe import of useOasis - not critical for nav functionality
let useOasis: any = () => ({
  getTotalUnreadCount: () => 0,
  markConversationAsRead: () => {},
});
try {
  const oasisModule = require("@/features/oasis/context/components");
  useOasis = oasisModule.useOasis;
} catch (error) {
  console.warn("⚠️ [NAV] Failed to import useOasis (non-critical):", error);
}

// Traffic Light Button Component
function TrafficLightButton({
  color,
  icon: Icon,
  onClick,
}: {
  color: "red" | "yellow" | "green";
  icon: any;
  onClick: () => void;
}) {
  const colorClasses = {
    red: "bg-red-500 hover:bg-red-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    green: "bg-green-500 hover:bg-green-600",
  };

  return (
    <button
      className={`w-3 h-3 rounded-full ${colorClasses[color]} flex items-center justify-center group`}
      onClick={onClick}
    >
      <Icon className="w-2 h-2 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Layout Button Component
function LayoutButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-blue-100 text-blue-600"
          : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function CustomNavigationBar({
  showLogo = true,
  isDarkMode = false,
  showActionPlatformBadge = false,
  showOasisBadge = false,
  compactMode = false,
  centerContent = false,
  showTrafficLights = false,
  showLayoutControls = false,
  showSearch = false,
      title = "Adrata",
  className = "",
  onMinimize,
  onMaximize,
  onClose,
  onLayoutChange,
}: CustomNavigationBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeLayout, setActiveLayout] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Use Oasis context for real notification counts
  const { getTotalUnreadCount, markConversationAsRead } = useOasis();
  const notificationCount = getTotalUnreadCount();

  const clearNotifications = () => {
    console.log(
      "🔔 Clearing notifications by Speedrunng Ross-Dan conversation as read",
    );
    markConversationAsRead("ross-dan-real");
  };

  // Handle window state
  const handleMinimize = () => {
    onMinimize?.();
  };

  const handleMaximize = () => {
    onMaximize?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleLayoutChange = (layout: string) => {
    setActiveLayout(layout);
    onLayoutChange?.(layout);
  };

  // Listen for window state changes
  useEffect(() => {
    if ((window as any).__TAURI__) {
      const unlisten = (window as any).__TAURI__.window.appWindow.onResized(
        () => {
          (window as any).__TAURI__.window.appWindow
            .isMaximized()
            .then(setIsMaximized);
        },
      );

      return () => {
        unlisten.then((fn: any) => fn());
      };
    }
  }, []);

  return (
    <div
      className={`
        flex items-center justify-between h-12 bg-[var(--background)] border-b border-[var(--border)] 
        select-none relative z-50 ${className}
      `}
      style={
        {
          // Make the bar draggable (for Tauri/Electron)
          WebkitAppRegion: "drag",
        } as any
      }
    >
      {/* Left Section - Traffic Lights & Title */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Traffic Light Buttons */}
        {showTrafficLights && (
          <div
            className="flex items-center space-x-2 px-4"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            <TrafficLightButton
              color="red"
              icon={XMarkIcon}
              onClick={handleClose}
            />
            <TrafficLightButton
              color="yellow"
              icon={MinusIcon}
              onClick={handleMinimize}
            />
            <TrafficLightButton
              color="green"
              icon={isMaximized ? ArrowsPointingInIcon : ArrowsPointingOutIcon}
              onClick={handleMaximize}
            />
          </div>
        )}

        {/* App Title */}
        <div className="flex items-center space-x-3 px-2 min-w-0" style={{ marginTop: '1px' }}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--background)] rounded-md flex items-center justify-center overflow-hidden border border-[var(--border)]">
              <img 
                src="/favicon.ico" 
                alt="Sales Acceleration Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[var(--foreground)] truncate leading-tight text-xl">
                  {title}
                </span>
                <span className="bg-[var(--panel-background)]0 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Pro
                </span>
              </div>
              <span className="text-sm text-[var(--muted)] leading-tight">
                Sales Acceleration
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section - Layout Controls */}
      {showLayoutControls && (
        <div
          className="flex items-center space-x-1 px-4"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <LayoutButton
            icon={Squares2X2Icon}
            label="Grid Layout"
            active={activeLayout === "grid"}
            onClick={() => handleLayoutChange("grid")}
          />
          <LayoutButton
            icon={ViewColumnsIcon}
            label="Column Layout"
            active={activeLayout === "columns"}
            onClick={() => handleLayoutChange("columns")}
          />
          <LayoutButton
            icon={RectangleStackIcon}
            label="Stack Layout"
            active={activeLayout === "stack"}
            onClick={() => handleLayoutChange("stack")}
          />
        </div>
      )}

      {/* Right Section - Search & Controls */}
      <div
        className="flex items-center space-x-3 px-4 flex-1 justify-end min-w-0"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        {/* Search */}
        {showSearch && (
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search across all apps..."
              className="block w-full px-3 py-1.5 border border-[var(--border)] rounded-md leading-5 bg-[var(--background)] placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
              onClick={() => {
                console.log(
                  "🔔 Notification button clicked, current count:",
                  notificationCount,
                );
                setShowNotifications(!showNotifications);

                // Clear notifications when panel is opened (not just toggled)
                if (!showNotifications && notificationCount > 0) {
                  console.log(
                    "🔔 Opening notification panel - clearing notifications",
                  );
                  clearNotifications();
                }
              }}
              title="Notifications"
            >
              <BellIcon className="w-4 h-4" />
              {/* Notification badge */}
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Command Palette */}
          <button
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
            title="Command Palette (⌘K)"
          >
            <CommandLineIcon className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
            title="Settings"
          >
            <CogIcon className="w-4 h-4" />
          </button>

          {/* Help */}
          <button
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
            title="Help & Support"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
          </button>

          {/* User Profile */}
          <button
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)] transition-colors"
            title="User Profile"
          >
            <UserCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute top-full right-4 mt-1 w-80 bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border)] z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[var(--foreground)]">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {/* Sample notifications */}
            <div className="p-4 border-b border-gray-50 hover:bg-[var(--panel-background)]">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    New strategic analysis available
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Monaco pipeline completed for TechCorp
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">2 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-gray-50 hover:bg-[var(--panel-background)]">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Flight risk alert resolved
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Sarah Johnson risk level decreased to STABLE
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">15 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 hover:bg-[var(--panel-background)]">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Speedrun campaign needs review
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Q1 Enterprise outreach ready for approval
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-gray-100">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Keyboard shortcuts hook
export function useNavigationShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command palette
      if ((event.metaKey || event.ctrlKey) && event['key'] === "k") {
        event.preventDefault();
        // Open command palette
        console.log("Open command palette");
      }

      // Quick search
      if ((event.metaKey || event.ctrlKey) && event['key'] === "f") {
        event.preventDefault();
        // Focus search
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]',
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Settings
      if ((event.metaKey || event.ctrlKey) && event['key'] === ",") {
        event.preventDefault();
        // Open settings
        console.log("Open settings");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export default CustomNavigationBar;
