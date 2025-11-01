"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  DocumentIcon, 
  CloudIcon, 
  FolderIcon,
  PhotoIcon,
  CodeBracketIcon,
  PresentationChartBarIcon,
  ArchiveBoxIcon,
  ComputerDesktopIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface AddFilesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: FileList) => void;
  onAddFiles: (files: any[]) => void;
}

interface FileOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: 'browse' | 'recent' | 'cloud';
  description: string;
}

interface DataCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  searchPlaceholder: string;
}

interface ContextItem {
  id: string;
  name: string;
  type: 'file' | 'lead' | 'opportunity' | 'person' | 'company' | 'competitor' | 'account' | 'contact' | 'prospect' | 'activity' | 'email' | 'note';
  data?: any;
  size?: number;
  icon?: React.ComponentType<any>;
  color?: string;
  description?: string;
  metadata?: Record<string, any>;
}

const FILE_OPTIONS: FileOption[] = [
  {
    id: 'browse',
    label: 'Browse Computer',
    icon: ComputerDesktopIcon,
    action: 'browse',
    description: 'Upload files from your device'
  },
  {
    id: 'recent',
    label: 'Recent Files',
    icon: ClockIcon,
    action: 'recent',
    description: 'Access recently used files'
  }
];

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'leads',
    label: 'Leads',
    icon: UserIcon,
    color: 'green',
    description: 'Add leads as context for AI analysis',
    searchPlaceholder: 'Search leads by name, email, or company...'
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: CurrencyDollarIcon,
    color: 'yellow',
    description: 'Include opportunities for deal analysis',
    searchPlaceholder: 'Search opportunities by name or stage...'
  },
  {
    id: 'people',
    label: 'People',
    icon: UserGroupIcon,
    color: 'purple',
    description: 'Add people from your network',
    searchPlaceholder: 'Search people by name, title, or company...'
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: BuildingOfficeIcon,
    color: 'indigo',
    description: 'Include company profiles and intelligence',
    searchPlaceholder: 'Search companies by name or industry...'
  }
];

export function AddFilesPopup({ isOpen, onClose, onFileSelect, onAddFiles }: AddFilesPopupProps) {
  const { auth, ui } = useRevenueOS();
  const workspace = ui.activeWorkspace;
  const user = auth.authUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  
  // Enhanced state for data integration
  const [showDataOptions, setShowDataOptions] = useState(false);
  const [activeDataCategory, setActiveDataCategory] = useState<string>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<ContextItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load data when category changes or search query updates
  const searchData = useCallback(async () => {
    if (!workspace?.id) return;
    
    setIsSearching(true);
    try {
      let endpoint = '';
      let params = new URLSearchParams();
      
      // Map categories to v1 endpoints
      switch (activeDataCategory) {
        case 'leads':
          endpoint = '/api/v1/people';
          params.set('status', 'LEAD');
          params.set('section', 'leads');
          if (searchQuery) params.set('search', searchQuery);
          params.set('limit', '20');
          break;
        case 'people':
          endpoint = '/api/v1/people';
          params.set('section', 'prospects');
          if (searchQuery) params.set('search', searchQuery);
          params.set('limit', '20');
          break;
        case 'companies':
          endpoint = '/api/v1/companies';
          if (searchQuery) params.set('search', searchQuery);
          params.set('limit', '20');
          break;
        case 'opportunities':
          // TODO: Add v1 opportunities endpoint when available
          endpoint = '/api/data/search';
          break;
        default:
          endpoint = '/api/data/search';
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || data.results || []);
      } else {
        console.error('Failed to search data:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching data:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [workspace?.id, user?.id, activeDataCategory, searchQuery]);

  useEffect(() => {
    if (isOpen && showDataOptions) {
      searchData();
    } else if (isOpen) {
      loadRecentFiles();
    }
  }, [isOpen, showDataOptions, activeDataCategory, searchQuery, searchData]);

  const loadRecentFiles = async () => {
    setIsLoadingRecent(true);
    try {
      // Try to get recent files from localStorage first
      const storedFiles = localStorage.getItem('adrata-recent-files');
      if (storedFiles) {
        const parsed = JSON.parse(storedFiles);
        setRecentFiles(parsed.slice(0, 5)); // Show last 5 files
      }
      
      // TODO: Also fetch from API if needed
      // const response = await fetch('/api/files/recent');
      // const apiFiles = await response.json();
      // setRecentFiles(apiFiles.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent files:', error);
      setRecentFiles([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
    onClose();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e['target']['files'] && e.target.files.length > 0) {
      onFileSelect(e.target.files);
      
      // Store in recent files
      const newFiles = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        uploadedAt: Date.now()
      }));
      
      const existing = JSON.parse(localStorage.getItem('adrata-recent-files') || '[]');
      const updated = [...newFiles, ...existing].slice(0, 10); // Keep last 10
      localStorage.setItem('adrata-recent-files', JSON.stringify(updated));
    }
  };

  const handleDataItemSelect = (item: any) => {
    const contextItem: ContextItem = {
      id: `${activeDataCategory}-${item.id}`,
      name: getItemDisplayName(item, activeDataCategory),
      type: activeDataCategory as any,
      data: item,
      icon: getItemIcon(activeDataCategory),
      color: getItemColor(activeDataCategory),
      description: getItemDescription(item, activeDataCategory),
      metadata: getItemMetadata(item, activeDataCategory)
    };

    setSelectedItems(prev => {
      // Avoid duplicates
      if (prev.some(selected => selected['id'] === contextItem.id)) {
        return prev;
      }
      return [...prev, contextItem];
    });
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddContext = () => {
    if (selectedItems.length > 0) {
      // Convert to the format expected by onAddFiles
      const contextFiles = selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        data: item.data,
        size: item.size,
        metadata: item.metadata
      }));
      
      onAddFiles(contextFiles);
      setSelectedItems([]);
      onClose();
    }
  };

  const handleRecentFileSelect = (file: any) => {
    // For recent files, we'd need to implement file retrieval
    // For now, show a message
    console.log('Recent file selected:', file);
    onClose();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return DocumentIcon;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return PhotoIcon;
      case 'ppt':
      case 'pptx':
        return PresentationChartBarIcon;
      case 'zip':
      case 'rar':
        return ArchiveBoxIcon;
      case 'js':
      case 'ts':
      case 'html':
      case 'css':
        return CodeBracketIcon;
      default:
        return DocumentIcon;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getItemDisplayName = (item: any, category: string): string => {
    switch (category) {
      case 'leads':
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown Lead';
      case 'opportunities':
        return item.name || `${item.company || 'Unknown Company'} - ${item.stage || 'Unknown Stage'}`;
      case 'people':
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Person';
      case 'companies':
        return item.name || item.company || 'Unknown Company';
      case 'people':
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown Contact';
      case 'activities':
        return item.subject || item.type || 'Activity';
      case 'emails':
        return item.subject || 'Email';
      default:
        return item.name || item.title || 'Unknown Item';
    }
  };

  const getItemDescription = (item: any, category: string): string => {
    switch (category) {
      case 'leads':
        return `${item.company || 'Unknown Company'} • ${item.jobTitle || 'Unknown Title'} • ${item.status || 'Unknown Status'}`;
      case 'opportunities':
        return `${item.stage || 'Unknown Stage'} • ${item.amount ? `$${item.amount.toLocaleString()}` : 'No amount'} • ${item.probability ? `${item.probability}%` : 'No probability'}`;
      case 'people':
        return `${item.company || 'Unknown Company'} • ${item.jobTitle || item.title || 'Unknown Title'}`;
      case 'companies':
        return `${item.industry || 'Unknown Industry'} • ${item.type || 'Unknown Type'}`;
      case 'people':
        return `${item.company || 'Unknown Company'} • ${item.email || 'No email'}`;
      case 'activities':
        return `${item.type || 'Unknown Type'} • ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}`;
      case 'emails':
        return `${item.from || 'Unknown Sender'} • ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}`;
      default:
        return 'Additional context';
    }
  };

  const getItemIcon = (category: string): React.ComponentType<any> => {
    const categoryData = DATA_CATEGORIES.find(cat => cat['id'] === category);
    return categoryData?.icon || DocumentIcon;
  };

  const getItemColor = (category: string): string => {
    const categoryData = DATA_CATEGORIES.find(cat => cat['id'] === category);
    return categoryData?.color || 'gray';
  };

  const getItemMetadata = (item: any, category: string): Record<string, any> => {
    return {
      category,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      workspaceId: item.workspaceId,
      ...item
    };
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      teal: 'text-teal-600 bg-teal-50 border-teal-200',
      gray: 'text-[var(--muted)] bg-[var(--panel-background)] border-[var(--border)]'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* Simple popup - matches Cursor's clean design */}
      <div className="absolute left-0 bottom-12 bg-[var(--background)] border border-[var(--border)] dark:border-[var(--border)] rounded-lg shadow-xl py-2 min-w-[320px] max-w-[400px] z-50">
        
        {/* File options */}
        <div className="space-y-1">
          {FILE_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => {
                  if (option['action'] === 'browse') {
                    handleBrowseFiles();
                  } else if (option['action'] === 'recent') {
                    // Show recent files
                  }
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-[var(--foreground)] dark:text-[var(--foreground)] hover:bg-[var(--panel-background)] flex items-center space-x-3 transition-colors"
              >
                <IconComponent className="w-4 h-4 text-[var(--muted)]" />
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)] dark:border-[var(--border)] my-2"></div>

        {/* Data context options */}
        <div className="px-4 py-1">
          <div className="text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase tracking-wide mb-2">
            Add Context
          </div>
        </div>

        {/* Search bar */}
        {showDataOptions && (
          <div className="px-4 pb-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${DATA_CATEGORIES.find(cat => cat['id'] === activeDataCategory)?.label.toLowerCase() || 'data'}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Data category buttons */}
        <div className="space-y-1">
          {DATA_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeDataCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveDataCategory(category.id);
                  setShowDataOptions(true);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--panel-background)] flex items-center space-x-3 transition-colors ${
                  isActive && showDataOptions ? 'bg-[var(--panel-background)]' : ''
                }`}
              >
                <IconComponent className="w-4 h-4 text-[var(--muted)]" />
                <div className="flex-1">
                  <div className="font-medium text-[var(--foreground)] dark:text-[var(--foreground)]">{category.label}</div>
                  <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">{category.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search results */}
        {showDataOptions && (
          <>
            <div className="border-t border-[var(--border)] dark:border-[var(--border)] my-2"></div>
            <div className="max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="ml-2 text-xs text-[var(--muted)]">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => {
                    const IconComponent = getItemIcon(activeDataCategory);
                    const isSelected = selectedItems.some(selected => selected['id'] === `${activeDataCategory}-${item.id}`);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleDataItemSelect(item)}
                        disabled={isSelected}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-[var(--hover)] opacity-50 cursor-not-allowed'
                            : 'hover:bg-[var(--panel-background)]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-4 h-4 text-[var(--muted)]" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                              {getItemDisplayName(item, activeDataCategory)}
                            </div>
                            <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)] truncate">
                              {getItemDescription(item, activeDataCategory)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-red-500">
                              <StarIcon className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-4 text-[var(--muted)] dark:text-[var(--muted)]">
                  <p className="text-xs">No results found</p>
                </div>
              ) : (
                <div className="text-center py-4 text-[var(--muted)] dark:text-[var(--muted)]">
                  <p className="text-xs">Start typing to search</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Selected items */}
        {selectedItems.length > 0 && (
          <>
            <div className="border-t border-[var(--border)] dark:border-[var(--border)] my-2"></div>
            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--foreground)] dark:text-[var(--foreground)]">
                  Selected ({selectedItems.length})
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-[var(--muted)] hover:text-red-500"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedItems.map((item) => {
                  const IconComponent = item.icon || DocumentIcon;
                  return (
                    <div
                      key={item.id}
                      className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs bg-[var(--hover)] text-[var(--foreground)] dark:text-[var(--foreground)]"
                    >
                      <IconComponent className="w-3 h-3" />
                      <span className="truncate max-w-24">{item.name}</span>
                      <button
                        onClick={() => removeSelectedItem(item.id)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleAddContext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
              >
                Add to Chat
              </button>
            </div>
          </>
        )}

        {/* Recent files section */}
        {recentFiles.length > 0 && !showDataOptions && (
          <>
            <div className="border-t border-[var(--border)] dark:border-[var(--border)] mt-2 pt-2">
              <div className="px-4 py-1 text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase tracking-wide">
                Recent Files
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {recentFiles.slice(0, 3).map((file) => {
                const IconComponent = getFileIcon(file.name);
                return (
                  <button
                    key={file.id}
                    onClick={() => handleRecentFileSelect(file)}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--foreground)] dark:text-[var(--foreground)] hover:bg-[var(--panel-background)] flex items-center space-x-3 transition-colors"
                  >
                    <IconComponent className="w-4 h-4 text-[var(--muted)]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                        {formatFileSize(file.size)} • {formatTimeAgo(file.uploadedAt)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Loading state for recent files */}
        {isLoadingRecent && (
          <div className="px-4 py-2 text-xs text-[var(--muted)] dark:text-[var(--muted)]">
            Loading recent files...
          </div>
        )}
      </div>
    </>
  );
}
