/**
 * ProfilePanel Component
 * 
 * Sliding left panel that appears when profile is clicked.
 * Contains the simplified menu: Download, RevenueOS, Oasis, Settings, Sign Out
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useSettingsPopup } from "./SettingsPopupContext";
import {
  UserIcon,
  CogIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { X, MessageSquare, FileText } from "lucide-react";
import { WindowsIcon, AppleIcon, LinuxIcon } from "./OSIcons";

interface ProfilePanelProps {
  user: { name: string; lastName?: string };
  company: string;
  workspace: string;
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  currentApp?: string;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  user,
  company,
  workspace,
  isOpen,
  onClose,
  username,
  currentApp = 'revenueos',
}) => {
  const router = useRouter();
  const { signOut, isDesktop } = useUnifiedAuth();
  const { setIsSettingsOpen } = useSettingsPopup();

  const initial = user.name?.charAt(0).toUpperCase() || "?";

  const handleNavigation = (path: string) => {
    console.log(`🧭 ProfilePanel: Navigating to ${path}`);
    onClose();
    
    // Get current workspace from the URL
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    // Build the full path with workspace
    const fullPath = `/${workspaceSlug}${path}`;
    console.log(`🧭 ProfilePanel: Full navigation path: ${fullPath}`);
    router.push(fullPath);
  };

  const handleSignOut = async () => {
    console.log("🚪 ProfilePanel: Sign out initiated");
    onClose();
    
    try {
      await signOut();
    } catch (error) {
      console.error("❌ ProfilePanel: Sign out error:", error);
    }
  };

  const handleDownloadDesktopApp = () => {
    console.log('📥 ProfilePanel: Download desktop app clicked');
    onClose();
    
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
    
    console.log(`📥 ProfilePanel: Triggering download for ${platform}: ${downloadUrl}`);
    
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
      return UserIcon; // Use user icon for mobile
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

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="h-full w-56 bg-[var(--background)] border-r border-[var(--border)] flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header with close button */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {workspace.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {workspace}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Workspace
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--hover)] rounded-md transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>
      </div>

      {/* App Navigation */}
      <div className="flex-1 p-3 space-y-0.5">
        {/* RevenueOS */}
        <button
          className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
            currentApp === 'revenueos' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-[var(--foreground)] hover:bg-[var(--hover)]'
          }`}
          onClick={() => handleNavigation("/speedrun")}
        >
          <ChartBarIcon className="w-4 h-4 mr-3" />
          <span className="font-medium">RevenueOS</span>
        </button>

        {/* Oasis */}
        <button
          className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
            currentApp === 'oasis' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-[var(--foreground)] hover:bg-[var(--hover)]'
          }`}
          onClick={() => handleNavigation("/oasis")}
        >
          <MessageSquare className="w-4 h-4 mr-3" />
          <span className="font-medium">Oasis</span>
        </button>

        {/* Atrium */}
        <button
          className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
            currentApp === 'atrium' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-[var(--foreground)] hover:bg-[var(--hover)]'
          }`}
          onClick={() => handleNavigation("/atrium")}
        >
          <FileText className="w-4 h-4 mr-3" />
          <span className="font-medium">Atrium</span>
        </button>

        {/* Settings */}
        <button
          className="w-full flex items-center px-3 py-2.5 text-sm text-[var(--foreground)] rounded-md hover:bg-[var(--hover)] transition-colors group"
          onClick={() => {
            setIsSettingsOpen(true);
          }}
        >
          <CogIcon className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Footer - Download and Sign Out */}
      <div className="p-3 space-y-0.5">
        <button
          className="w-full flex items-center px-3 py-2.5 text-sm text-[var(--foreground)] rounded-md hover:bg-[var(--hover)] transition-colors group"
          onClick={handleDownloadDesktopApp}
        >
          <PlatformIcon className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
          <span className="font-medium">Download</span>
        </button>
        
        <button
          className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors group"
          onClick={handleSignOut}
        >
          <UserIcon className="w-4 h-4 mr-3 group-hover:text-red-700" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
