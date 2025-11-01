/**
 * ProfilePanel Component
 * 
 * Sliding left panel that appears when profile is clicked.
 * Contains the simplified menu: RevenueOS, Oasis, Settings, Sign Out
 */

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useSettingsPopup } from "./SettingsPopupContext";
import { useFeatureAccess } from "@/platform/ui/context/FeatureAccessProvider";
import {
  UserIcon,
  CogIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  Squares2X2Icon,
  DocumentDuplicateIcon,
  ListBulletIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { X, MessageSquare, FileText, Layers, Building2, Check, GripVertical, PanelLeft } from "lucide-react";
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

interface ActionItem {
  id: string;
  task: string;
  assignee: 'me' | 'adrata';
  completed: boolean;
}

// Mock action list data
const mockActionItems: ActionItem[] = [
  { id: '1', task: 'Review Q1 pipeline forecast', assignee: 'me', completed: false },
  { id: '2', task: 'Update CRM integration settings', assignee: 'adrata', completed: true },
  { id: '3', task: 'Schedule team standup for tomorrow', assignee: 'me', completed: false },
  { id: '4', task: 'Generate monthly performance report', assignee: 'adrata', completed: false },
  { id: '5', task: 'Follow up with Acme Corp prospect', assignee: 'me', completed: true },
  { id: '6', task: 'Optimize database queries for speedrun', assignee: 'adrata', completed: false },
];

// Simple Checkbox Component
const Checkbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
        checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {checked && <Check className="w-3 h-3" />}
    </button>
  );
};

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
  const { hasDesktopDownload } = useFeatureAccess();

  const initial = user.name?.charAt(0).toUpperCase() || "?";
  
  // State for view mode (main or action list)
  const [viewMode, setViewMode] = useState<'main' | 'actionList'>('main');
  
  // State for action items
  const [actionItems, setActionItems] = useState<ActionItem[]>(mockActionItems);
  
  // State for sign out confirmation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  // Resize functionality state
  const [isResizing, setIsResizing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400); // Default width (max width)
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleNavigation = (path: string) => {
    console.log(`🧭 ProfilePanel: Navigating to ${path}`);
    
    // Get current workspace from the URL
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const workspaceSlug = segments[0];
    
    // Build the full path with workspace
    const fullPath = `/${workspaceSlug}${path}`;
    console.log(`🧭 ProfilePanel: Full navigation path: ${fullPath}`);
    
    // Close panel for Stacks, keep open for Atrium and others
    if (path === '/stacks') {
      onClose();
    }
    // For Atrium and other apps, keep panel open
    
    router.push(fullPath);
  };

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    console.log("🚪 ProfilePanel: Sign out confirmed");
    setShowSignOutConfirm(false);
    onClose();
    
    try {
      await signOut();
      // Redirect to sign-in page
      router.push('/sign-in/');
    } catch (error) {
      console.error("❌ ProfilePanel: Sign out error:", error);
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  const handleActionItemToggle = (id: string) => {
    setActionItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Resize functionality handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== resizeHandleRef.current && !resizeHandleRef.current?.contains(e.target as Node)) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    e.preventDefault();
    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;
    
    // Constrain width between min and max
    const minWidth = 200; // Minimum width
    const maxWidth = 400; // Maximum width
    
    setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleDoubleClick = () => {
    setPanelWidth(224); // Reset to original width
  };

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
    return undefined;
  }, [isResizing]);

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
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="h-full bg-[var(--background)] border-r border-[var(--border)] flex flex-col animate-in slide-in-from-left duration-200 relative"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <div 
        ref={resizeHandleRef}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/20 transition-colors z-10 group"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize panel, double-click to reset"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-blue-500/40 rounded-full transition-colors" />
      </div>

      {/* Header with close button */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {(typeof workspace === 'string' ? workspace : workspace?.name || 'W').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {typeof workspace === 'string' ? workspace : workspace?.name || 'Workspace'}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              RevenueOS Sales Acceleration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'main' ? 'actionList' : 'main')}
            className="p-1 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title={viewMode === 'main' ? 'Show action list' : 'Show main menu'}
          >
            {viewMode === 'main' ? (
              <ListBulletIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <Bars3Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title="Close panel"
          >
            <PanelLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* App Navigation */}
      <div className="flex-1 p-3 space-y-4">
        {/* Get Started Section */}
        {viewMode === 'main' && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3">
              Get Started
            </h4>
            <div className="space-y-0.5">
            {/* RevenueOS */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'revenueos' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
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
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/oasis")}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Oasis</span>
            </button>

            {/* Stacks */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'stacks' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/stacks")}
            >
              <Squares2X2Icon className="w-4 h-4 mr-3" />
              <span className="font-medium">Stacks</span>
            </button>

            {/* Atrium */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'atrium' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/atrium")}
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Atrium</span>
            </button>

            {/* Settings */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'settings' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => {
                setIsSettingsOpen(true);
              }}
            >
              <CogIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Settings</span>
            </button>

            {/* Desktop Download - conditionally shown below Settings */}
            {hasDesktopDownload && (
              <button
                className="w-full flex items-center px-3 py-2.5 text-sm text-[var(--foreground)] rounded-md hover:bg-[var(--hover-bg)] transition-colors group"
                onClick={handleDownloadDesktopApp}
              >
                <PlatformIcon className="w-4 h-4 mr-3" />
                <span className="font-medium">Desktop Download</span>
              </button>
            )}

            {/* Sign Out */}
            <button
              className="w-full flex items-center px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors group"
              onClick={handleSignOutClick}
            >
              <UserIcon className="w-4 h-4 mr-3 group-hover:text-gray-700" />
              <span className="font-medium">Sign Out</span>
            </button>

          </div>
          </div>
        )}

        {/* Action List Section */}
        {viewMode === 'actionList' && (
          <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Action List
            </h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {actionItems.filter(item => item.completed).length}/{actionItems.length} completed
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-3 py-2 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
              >
                <Checkbox
                  checked={item.completed}
                  onChange={() => handleActionItemToggle(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${item.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                    {item.task}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    item.assignee === 'me' 
                      ? 'text-blue-600' 
                      : 'text-blue-400'
                  }`}>
                    {item.assignee === 'me' ? 'Me' : 'Adrata'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>


      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={handleSignOutCancel}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your workspace.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSignOutCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOutConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
