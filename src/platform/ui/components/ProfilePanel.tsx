/**
 * ProfilePanel Component
 * 
 * Sliding left panel that appears when profile is clicked.
 * Contains the simplified menu: RevenueOS, Oasis, Settings, Sign Out
 */

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useSettingsPopup } from "./SettingsPopupContext";
import { useFeatureAccess } from "@/platform/ui/context/FeatureAccessProvider";
import { useChecklist, type ChecklistItem } from "./useChecklist";
import {
  UserIcon,
  CogIcon,
  ChartBarIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  ListBulletIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { Check, PanelLeft, Trash2 } from "lucide-react";
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

// Checklist Item Component with animations
interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isRemoving: boolean;
}

const ChecklistItemComponent: React.FC<ChecklistItemComponentProps> = ({
  item,
  onToggle,
  onDelete,
  isRemoving
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRemoving && itemRef.current) {
      // Trigger exit animation
      itemRef.current.style.opacity = '0';
      itemRef.current.style.transform = 'translateY(-10px)';
      itemRef.current.style.maxHeight = '0';
      itemRef.current.style.paddingTop = '0';
      itemRef.current.style.paddingBottom = '0';
      itemRef.current.style.marginBottom = '0';
    }
  }, [isRemoving]);

  return (
    <div
      ref={itemRef}
      className={`flex items-start gap-3 px-3 py-2 hover:bg-[var(--hover-bg)] rounded-md transition-all duration-300 ease-in-out ${
        isRemoving ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Checklist item: ${item.text}`}
    >
      <Checkbox
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        aria-label={item.completed ? `Uncomplete ${item.text}` : `Complete ${item.text}`}
      />
      <div className="flex-1 min-w-0">
        <div 
          className={`text-sm transition-all duration-200 ${
            item.completed 
              ? 'line-through text-[var(--muted-foreground)]' 
              : 'text-[var(--foreground)]'
          }`}
        >
          {item.text}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onDelete(item.id);
          }
        }}
        className={`ml-2 p-1 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${
          isHovered || isRemoving
            ? 'opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50'
            : 'opacity-0'
        }`}
        aria-label={`Delete ${item.text}`}
        title="Delete item"
        tabIndex={isHovered || isRemoving ? 0 : -1}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// Simple Checkbox Component
const Checkbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}> = ({ checked, onChange, disabled = false, 'aria-label': ariaLabel }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }
      }}
      disabled={disabled}
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-label={ariaLabel}
      aria-checked={checked}
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
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
  currentApp: propCurrentApp = 'revenueos',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, isDesktop, user } = useUnifiedAuth();
  const { setIsSettingsOpen } = useSettingsPopup();
  const { hasDesktopDownload } = useFeatureAccess();

  // Get userId and workspaceId for checklist
  const userId = user?.id;
  const workspaceId = user?.activeWorkspaceId || (typeof workspace === 'string' ? undefined : workspace?.id);

  // Checklist hook
  const {
    items: checklistItems,
    addItem,
    deleteItem,
    toggleItem,
    isLoading: checklistLoading,
    error: checklistError
  } = useChecklist(userId, workspaceId);

  // Automatically detect current app from pathname if not provided
  const getCurrentAppFromPath = (): string => {
    if (pathname.includes('/oasis')) return 'oasis';
    if (pathname.includes('/workshop')) return 'workshop';
    if (pathname.includes('/adrata')) return 'adrata';
    if (pathname.includes('/stacks')) return 'stacks';
    if (pathname.includes('/speedrun') || pathname.includes('/pipeline')) return 'revenueos';
    return propCurrentApp; // Fallback to prop or default
  };

  // Use detected app or fallback to prop
  const currentApp = getCurrentAppFromPath();
  
  // State for view mode (main or action list)
  const [viewMode, setViewMode] = useState<'main' | 'actionList'>('main');
  
  // State for checklist input
  const [newItemText, setNewItemText] = useState('');
  const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Close panel for Stacks, keep open for Workshop and others
    if (path === '/stacks') {
      onClose();
    }
    // For Workshop and other apps, keep panel open
    
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

  // Checklist handlers
  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (trimmed) {
      addItem(trimmed);
      setNewItemText('');
      // Refocus input after adding
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleToggleItem = (id: string) => {
    const item = checklistItems.find(i => i.id === id);
    if (item && !item.completed) {
      // Item is being completed - start removal animation
      setRemovingItemIds(prev => new Set(prev).add(id));
      
      // Mark as completed first (triggers visual state change)
      toggleItem(id);
      
      // Remove after animation completes (350ms for smooth fade-out)
      setTimeout(() => {
        deleteItem(id);
        setRemovingItemIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 350);
    }
    // If already completed, do nothing (shouldn't happen as completed items are removed)
  };

  const handleDeleteItem = (id: string) => {
    setRemovingItemIds(prev => new Set(prev).add(id));
    
    // Remove after animation
    setTimeout(() => {
      deleteItem(id);
      setRemovingItemIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 350);
  };

  // Filter out completed items for display (they're removed after animation)
  const activeItems = checklistItems.filter(item => !item.completed);
  const remainingCount = activeItems.length;

  // Auto-focus input when switching to actionList view
  useEffect(() => {
    if (viewMode === 'actionList' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewMode, isOpen]);

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
              Workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'main' ? 'actionList' : 'main')}
            className="p-1 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title={viewMode === 'main' ? 'Show action list' : 'Go home'}
          >
            {viewMode === 'main' ? (
              <ListBulletIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
            ) : (
              <HomeIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
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

            {/* Adrata */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'adrata' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/adrata")}
            >
              <SparklesIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Adrata</span>
            </button>

            {/* Workshop */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'workshop' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/workshop")}
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Workshop</span>
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

        {/* Checklist Section */}
        {viewMode === 'actionList' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Checklist
              </h4>
              {remainingCount > 0 && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  {remainingCount} remaining
                </span>
              )}
            </div>

            {/* Add Item Input */}
            <div className="px-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Add a new item..."
                  className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  aria-label="Add checklist item"
                  aria-describedby="checklist-input-help"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItemText.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Add item to checklist"
                  title="Add item (Enter)"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-xs">Add</span>
                </button>
              </div>
              <p id="checklist-input-help" className="sr-only">
                Type an item and press Enter or click Add to add it to your checklist
              </p>
            </div>

            {/* Error Message */}
            {checklistError && (
              <div className="px-3 py-2 mx-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800" role="alert">
                {checklistError}
              </div>
            )}

            {/* Checklist Items */}
            <div 
              className="max-h-96 overflow-y-auto space-y-1"
              role="list"
              aria-label="Checklist items"
              aria-live="polite"
              aria-atomic="false"
            >
              {checklistLoading ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                  Loading checklist...
                </div>
              ) : remainingCount === 0 ? (
                <div className="px-3 py-8 text-center" role="status">
                  <ClipboardDocumentCheckIcon className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3 opacity-50" />
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                    No checklist items yet
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Add your first item above
                  </p>
                </div>
              ) : (
                activeItems.map((item) => (
                    <ChecklistItemComponent
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onDelete={handleDeleteItem}
                      isRemoving={removingItemIds.has(item.id)}
                    />
                  ))
              )}
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
