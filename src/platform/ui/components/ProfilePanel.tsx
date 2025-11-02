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
import { getPresetTemplate, type PresetTemplateId } from "./daily100Presets";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
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
  PlusIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  PuzzlePieceIcon,
  Bars3Icon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Check, PanelLeft, Trash2, Pencil } from "lucide-react";
import { WindowsIcon, AppleIcon, LinuxIcon } from "./OSIcons";
import { CalendarView } from "./CalendarView";
import { NotesEditor } from "./NotesEditor";

interface ProfilePanelProps {
  user: { name: string; lastName?: string };
  company: string;
  workspace: string;
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  currentApp?: string;
  onToggleLeftPanel?: () => void;
}

// Action List Item Component with animations
interface ChecklistItemComponentProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isRemoving: boolean;
}

const ChecklistItemComponent: React.FC<ChecklistItemComponentProps> = ({
  item,
  onToggle,
  onDelete,
  onEdit,
  isRemoving
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const editInputRef = useRef<HTMLInputElement>(null);
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

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Update edit text when item changes
  useEffect(() => {
    if (!isEditing) {
      setEditText(item.text);
    }
  }, [item.text, isEditing]);

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text) {
      onEdit(item.id, trimmed);
    }
    setIsEditing(false);
    setEditText(item.text);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(item.text);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div
      ref={itemRef}
      className={`flex items-start gap-3 px-3 py-2 hover:bg-[var(--hover-bg)] rounded-md transition-all duration-300 ease-in-out ${
        isRemoving ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Action list item: ${item.text}`}
    >
      <Checkbox
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        disabled={isEditing}
        aria-label={item.completed ? `Uncomplete ${item.text}` : `Complete ${item.text}`}
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleSaveEdit}
            className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            aria-label="Edit item text"
          />
        ) : (
          <div 
            className={`text-sm transition-all duration-200 ${
              item.completed 
                ? 'line-through text-[var(--muted-foreground)]' 
                : 'text-[var(--foreground)]'
            }`}
          >
            {item.text}
          </div>
        )}
      </div>
      {!isEditing && item.itemType === 'custom' && (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
            className={`ml-2 p-1 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 ${
              isHovered || isRemoving
                ? 'opacity-100 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                : 'opacity-0'
            }`}
            aria-label={`Edit ${item.text}`}
            title="Edit item"
            tabIndex={isHovered || isRemoving ? 0 : -1}
          >
            <Pencil className="w-4 h-4" />
          </button>
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
            className={`p-1 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${
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
      )}
      {item.itemType === 'preset' && (
        <div className="flex items-center">
          <span className="text-xs text-[var(--muted-foreground)] px-2 py-0.5 rounded bg-[var(--hover-bg)]">
            Daily 100
          </span>
        </div>
      )}
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
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 ${
        checked
          ? 'bg-slate-700 border-slate-700 text-white'
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
  onToggleLeftPanel,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, isDesktop, user: authUser } = useUnifiedAuth();
  const { setIsSettingsOpen } = useSettingsPopup();
  const { hasDesktopDownload } = useFeatureAccess();
  
  // Get toggle left panel from context if not provided as prop
  const revenueOSContext = useRevenueOS();
  const toggleLeftPanel = onToggleLeftPanel || revenueOSContext?.ui?.toggleLeftPanel || (() => {
    console.warn('Toggle left panel function not available');
  });

  // Get userId and workspaceId for action list
  const userId = authUser?.id;
  const workspaceId = authUser?.activeWorkspaceId || (typeof workspace === 'string' ? undefined : workspace?.id);

  // Action list hook
  const {
    items: checklistItems,
    presetItems,
    customItems,
    addItem,
    deleteItem,
    toggleItem,
    editItem,
    isLoading: checklistLoading,
    error: checklistError,
    currentPreset,
    lastResetDate
  } = useChecklist(userId, workspaceId);

  // Automatically detect current app from pathname if not provided
  const getCurrentAppFromPath = (): string => {
    if (pathname.includes('/oasis')) return 'oasis';
    if (pathname.includes('/workshop')) return 'workshop';
    if (pathname.includes('/adrata')) return 'adrata';
    if (pathname.includes('/stacks')) return 'stacks';
    if (pathname.includes('/olympus')) return 'olympus';
    if (pathname.includes('/grand-central')) return 'grand-central';
    if (pathname.includes('/speedrun') || pathname.includes('/pipeline')) return 'revenueos';
    return propCurrentApp; // Fallback to prop or default
  };

  // Use detected app or fallback to prop
  const currentApp = getCurrentAppFromPath();
  
  // State for view mode (main, action list, calendar, or notes)
  const [viewMode, setViewMode] = useState<'main' | 'actionList' | 'calendar' | 'notes'>('actionList');
  const [previousViewMode, setPreviousViewMode] = useState<'main' | 'actionList'>('main');
  
  // State for action list input
  const [newItemText, setNewItemText] = useState('');
  const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(new Set());
  const [showAllItems, setShowAllItems] = useState(false);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State for notes
  const [notesContent, setNotesContent] = useState<string>('');
  const [notesSearchQuery, setNotesSearchQuery] = useState<string>('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [notesLastSavedAt, setNotesLastSavedAt] = useState<Date | null>(null);
  const notesEditorRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleHomeClick = () => {
    // Show main view instead of navigating
    console.log(`🏠 ProfilePanel: Showing main view`);
    setViewMode('main');
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
      // Redirect to sign-in page using hard redirect to bypass workspace layout checks
      if (typeof window !== "undefined") {
        window.location.replace('/sign-in/');
      }
    } catch (error) {
      console.error("❌ ProfilePanel: Sign out error:", error);
      // Fallback: force redirect even if there's an error
      if (typeof window !== "undefined") {
        window.location.replace('/sign-in/');
      }
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  // Action list handlers
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
    // Simply toggle the item - completed items stay in the list now
    toggleItem(id);
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

  const handleEditItem = (id: string, text: string) => {
    editItem(id, text);
  };

  // Filter items for display
  const activeItems = checklistItems.filter(item => !item.completed);
  const completedItems = checklistItems.filter(item => item.completed);
  const remainingCount = activeItems.length;
  const completedCount = completedItems.length;

  // Auto-focus input when switching to actionList view
  useEffect(() => {
    if (viewMode === 'actionList' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewMode, isOpen]);

  // Load notes when component mounts or workspace/user changes
  useEffect(() => {
    const loadNotes = async () => {
      if (!authUser?.id || !workspaceId) return;
      
      try {
        const response = await fetch(`/api/settings/user-notes?workspaceId=${workspaceId}&userId=${authUser.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.notes) {
            setNotesContent(data.notes.content || '');
            setNotesLastSavedAt(data.notes.updatedAt ? new Date(data.notes.updatedAt) : null);
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };
    
    if (isOpen && viewMode === 'notes') {
      loadNotes();
    }
  }, [isOpen, viewMode, authUser?.id, workspaceId]);

  // Save notes function
  const saveNotes = async (content: string) => {
    if (!authUser?.id || !workspaceId) return;
    
    try {
      setNotesSaveStatus('saving');
      const response = await fetch('/api/settings/user-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: authUser.id,
          content
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotesSaveStatus('saved');
          setNotesLastSavedAt(new Date());
        } else {
          setNotesSaveStatus('error');
        }
      } else {
        setNotesSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      setNotesSaveStatus('error');
    }
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
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-500/20 transition-colors z-10 group"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize panel, double-click to reset"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-slate-500/40 rounded-full transition-colors" />
      </div>

      {/* Header with navigation buttons */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Profile icon (clickable to close) */}
          <button
            onClick={onClose}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            title="Close panel"
          >
            <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:bg-[var(--accent)]/90">
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
          </button>

          {/* Right: Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleHomeClick}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'main'
                  ? 'bg-gray-100 text-[var(--foreground)]'
                  : 'bg-transparent hover:bg-gray-50 text-[var(--foreground)]'
              }`}
              title="Home"
              aria-label="Go to home"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
              }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-gray-100 text-[var(--foreground)]'
                  : 'bg-transparent hover:bg-gray-50 text-[var(--foreground)]'
              }`}
              title="Calendar"
              aria-label="Calendar view"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('actionList');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'actionList'
                  ? 'bg-gray-100 text-[var(--foreground)]'
                  : 'bg-transparent hover:bg-gray-50 text-[var(--foreground)]'
              }`}
              title="Daily 100 Checklist"
              aria-label="Action list"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('notes');
              }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'notes'
                  ? 'bg-gray-100 text-[var(--foreground)]'
                  : 'bg-transparent hover:bg-gray-50 text-[var(--foreground)]'
              }`}
              title="Notes"
              aria-label="Notes"
            >
              <DocumentTextIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-transparent hover:bg-gray-50 text-[var(--foreground)] transition-colors"
              title="Hide profile panel"
              aria-label="Hide profile panel"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* App Navigation */}
      <div className="flex-1 p-3 space-y-4 overflow-hidden flex flex-col">
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
                  ? 'bg-slate-100 text-slate-700' 
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
                  ? 'bg-slate-100 text-slate-700' 
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
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/workshop")}
            >
              <DocumentTextIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Workshop</span>
            </button>

            {/* Oasis */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'oasis' 
                  ? 'bg-slate-100 text-slate-700' 
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
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/stacks")}
            >
              <Squares2X2Icon className="w-4 h-4 mr-3" />
              <span className="font-medium">Stacks</span>
            </button>

            {/* Grand Central */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'grand-central' 
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => handleNavigation("/grand-central")}
            >
              <PuzzlePieceIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Grand Central</span>
            </button>

            {/* Settings */}
            <button
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group ${
                currentApp === 'settings' 
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
              }`}
              onClick={() => {
                setIsSettingsOpen(true);
              }}
            >
              <CogIcon className="w-4 h-4 mr-3" />
              <span className="font-medium">Settings</span>
            </button>

            {/* Sign Out */}
            <button
              className="w-full flex items-center px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors group"
              onClick={handleSignOutClick}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 group-hover:text-gray-700" />
              <span className="font-medium">Sign Out</span>
            </button>

          </div>
          </div>
        )}

        {/* Calendar Section */}
        {viewMode === 'calendar' && (
          <div className="h-full flex flex-col flex-1 min-h-0">
            <CalendarView onClose={() => setViewMode('actionList')} />
          </div>
        )}

        {/* Notes Section */}
        {viewMode === 'notes' && (
          <div className="h-full flex flex-col flex-1 min-h-0">
            {/* Header with Notes title and status */}
            <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
              <h2 className="text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}>
                Notes
              </h2>
              <div className="flex items-center gap-2">
                {notesSaveStatus === 'saving' ? (
                  <>
                    <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />
                    <span className="text-sm font-medium text-gray-400">Saving...</span>
                  </>
                ) : notesSaveStatus === 'saved' && notesLastSavedAt ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Start typing—auto-saved</span>
                  </>
                ) : notesSaveStatus === 'error' ? (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-500">Error saving</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-400">Start typing—auto-saved</span>
                )}
              </div>
            </div>
            
            {/* Search Bar - Below Notes header and status */}
            <div className="flex-shrink-0 px-1 pb-3 mb-2">
              <input
                type="text"
                value={notesSearchQuery}
                onChange={(e) => setNotesSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Notes Editor - Endless scroll without header */}
            <div className="flex-1 overflow-hidden">
              <NotesEditor
                value={notesContent}
                onChange={setNotesContent}
                placeholder="Start writing your notes here..."
                autoSave={true}
                saveStatus={notesSaveStatus}
                onSave={saveNotes}
                debounceMs={1000}
                lastSavedAt={notesLastSavedAt}
                className="h-full"
                showHeader={false}
              />
            </div>
          </div>
        )}

        {/* Action List Section */}
        {viewMode === 'actionList' && (
          <div className="space-y-2 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-3">
              <div className="flex flex-col">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Action List
                </h4>
                {currentPreset !== 'custom-only' && (() => {
                  const preset = getPresetTemplate(currentPreset);
                  return preset ? (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {preset.name}
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  {completedCount > 0 && (
                    <button
                      onClick={() => {
                        setShowOnlyCompleted(!showOnlyCompleted);
                        setShowAllItems(false);
                      }}
                      className={`font-medium hover:text-[var(--foreground)] cursor-pointer transition-colors ${
                        showOnlyCompleted ? 'text-[var(--foreground)]' : ''
                      }`}
                      title={showOnlyCompleted ? "Show all items" : "Show only completed items"}
                    >
                      {completedCount} {showOnlyCompleted ? 'all time completed' : 'completed'}
                    </button>
                  )}
                  {!showOnlyCompleted && remainingCount > 0 && (
                    <span>
                      {remainingCount} remaining
                    </span>
                  )}
                </div>
                {lastResetDate && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Resets daily
                  </p>
                )}
              </div>
            </div>

            {/* Add Item Input - Fixed at top above scrollable area */}
            {!showOnlyCompleted && (
              <div className="px-3 pb-3 flex-shrink-0 border-b border-[var(--border)]">
                <div className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setNewItemText('');
                        inputRef.current?.blur();
                      }
                    }}
                    placeholder="Add a task..."
                    className="flex-1 px-4 py-3 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all shadow-sm hover:shadow-md"
                    aria-label="Add action list item"
                    aria-describedby="action-list-input-help"
                  />
                  <button
                    onClick={handleAddItem}
                    disabled={!newItemText.trim()}
                    className="p-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm hover:shadow-md disabled:shadow-none"
                    aria-label="Add item to action list"
                    title="Add item (Enter)"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                <p id="action-list-input-help" className="sr-only">
                  Type an item and press Enter or click Add to add it to your action list. Press Escape to clear.
                </p>
              </div>
            )}

            {/* Error Message */}
            {checklistError && (
              <div className="px-3 py-2 mx-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800" role="alert">
                {checklistError}
              </div>
            )}

            {/* Action List Items - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto space-y-1 min-h-0"
              role="list"
              aria-label="Action list items"
              aria-live="polite"
              aria-atomic="false"
            >
              {checklistLoading ? (
                <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                  Loading action list...
                </div>
              ) : remainingCount === 0 && completedCount === 0 ? (
                <div className="px-3 py-12 text-center" role="status">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl border-2 border-[var(--border)] flex items-center justify-center bg-[var(--hover-bg)]">
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-[var(--muted-foreground)] opacity-60" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                    No action items yet
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Type above to add your first item
                  </p>
                </div>
              ) : showOnlyCompleted && completedItems.length === 0 ? (
                <div className="px-3 py-12 text-center" role="status">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl border-2 border-[var(--border)] flex items-center justify-center bg-[var(--hover-bg)]">
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-[var(--muted-foreground)] opacity-60" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                    No completed items
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Complete items to see them here
                  </p>
                </div>
              ) : (
                <>
                  {/* Preset Items Section */}
                  {!showOnlyCompleted && presetItems.length > 0 && (
                    <div className="space-y-1">
                      {presetItems.map((item) => (
                        <ChecklistItemComponent
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                          onDelete={handleDeleteItem}
                          onEdit={handleEditItem}
                          isRemoving={removingItemIds.has(item.id)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Custom Items Section */}
                  {customItems.length > 0 && (
                    <div className={`space-y-1 ${presetItems.length > 0 ? 'mt-3 pt-3 border-t border-[var(--border)]' : ''}`}>
                      {!showOnlyCompleted && (
                        <p className="px-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                          Custom Items
                        </p>
                      )}
                      {(showOnlyCompleted 
                        ? customItems.filter(item => item.completed)
                        : showAllItems 
                          ? customItems 
                          : customItems.filter(item => !item.completed)
                      ).map((item) => (
                        <ChecklistItemComponent
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                          onDelete={handleDeleteItem}
                          onEdit={handleEditItem}
                          isRemoving={removingItemIds.has(item.id)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Show completed preset items if showing only completed */}
                  {showOnlyCompleted && presetItems.length > 0 && (
                    <div className="space-y-1">
                      {presetItems.filter(item => item.completed).map((item) => (
                        <ChecklistItemComponent
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                          onDelete={handleDeleteItem}
                          onEdit={handleEditItem}
                          isRemoving={removingItemIds.has(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section - Desktop Download */}
      {hasDesktopDownload && (
        <div className="p-3">
          <button
            className="w-full flex items-center px-3 py-2.5 text-sm text-[var(--foreground)] rounded-md hover:bg-[var(--hover-bg)] transition-colors group"
            onClick={handleDownloadDesktopApp}
          >
            <PlatformIcon className="w-4 h-4 mr-3" />
            <span className="font-medium">Desktop Download</span>
          </button>
        </div>
      )}

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
