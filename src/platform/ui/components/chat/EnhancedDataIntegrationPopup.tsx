"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
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
  TrophyIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon,
  TagIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

interface EnhancedDataIntegrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: FileList) => void;
  onAddContext: (contextItems: ContextItem[]) => void;
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

interface DataCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  searchPlaceholder: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'files',
    label: 'Files & Documents',
    icon: DocumentIcon,
    color: 'blue',
    description: 'Upload files from your device or cloud storage',
    searchPlaceholder: 'Search files...'
  },
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
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: BriefcaseIcon,
    color: 'cyan',
    description: 'Add account information and history',
    searchPlaceholder: 'Search accounts by name or type...'
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: PhoneIcon,
    color: 'pink',
    description: 'Include contact details and interactions',
    searchPlaceholder: 'Search contacts by name or email...'
  },
  {
    id: 'competitors',
    label: 'Competitors',
    icon: ShieldCheckIcon,
    color: 'red',
    description: 'Add competitive intelligence data',
    searchPlaceholder: 'Search competitors by name or industry...'
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: ChartBarIcon,
    color: 'orange',
    description: 'Include recent activities and interactions',
    searchPlaceholder: 'Search activities by type or date...'
  },
  {
    id: 'emails',
    label: 'Emails',
    icon: EnvelopeIcon,
    color: 'teal',
    description: 'Add email conversations for context',
    searchPlaceholder: 'Search emails by subject or sender...'
  }
];

const FILE_OPTIONS = [
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
  },
  {
    id: 'cloud',
    label: 'Cloud Storage',
    icon: CloudIcon,
    action: 'cloud',
    description: 'Connect to Google Drive, Dropbox'
  }
];

export function EnhancedDataIntegrationPopup({ 
  isOpen, 
  onClose, 
  onFileSelect, 
  onAddContext 
}: EnhancedDataIntegrationPopupProps) {
  const { workspace, user } = useAcquisitionOS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeCategory, setActiveCategory] = useState<string>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<ContextItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  // Load data when category changes or search query updates
  useEffect(() => {
    if (isOpen && activeCategory !== 'files') {
      searchData();
    } else if (isOpen && activeCategory === 'files') {
      loadRecentFiles();
    }
  }, [isOpen, activeCategory, searchQuery]);

  const searchData = async () => {
    if (!workspace?.id) return;
    
    setIsLoading(true);
    try {
      let endpoint = '';
      let params = new URLSearchParams();
      
      // Map categories to v1 endpoints
      switch (activeCategory) {
        case 'leads':
          endpoint = '/api/v1/people';
          params.set('status', 'LEAD');
          if (searchQuery) params.set('search', searchQuery);
          params.set('limit', '20');
          break;
        case 'people':
          endpoint = '/api/v1/people';
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
      setIsLoading(false);
    }
  };

  const loadRecentFiles = async () => {
    try {
      const storedFiles = localStorage.getItem('adrata-recent-files');
      if (storedFiles) {
        const parsed = JSON.parse(storedFiles);
        setRecentFiles(parsed.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to load recent files:', error);
      setRecentFiles([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const updated = [...newFiles, ...existing].slice(0, 10);
      localStorage.setItem('adrata-recent-files', JSON.stringify(updated));
      
      onClose();
    }
  };

  const handleDataItemSelect = (item: any) => {
    const contextItem: ContextItem = {
      id: `${activeCategory}-${item.id}`,
      name: getItemDisplayName(item, activeCategory),
      type: activeCategory as any,
      data: item,
      icon: getItemIcon(activeCategory),
      color: getItemColor(activeCategory),
      description: getItemDescription(item, activeCategory),
      metadata: getItemMetadata(item, activeCategory)
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
      onAddContext(selectedItems);
      setSelectedItems([]);
      onClose();
    }
  };

  const getItemDisplayName = (item: any, category: string): string => {
    switch (category) {
      case 'leads':
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown Lead';
      case 'opportunities':
        return item.name || `${item.company || item.account?.name || 'Unknown Company'} - ${item.stage || 'Unknown Stage'}`;
      case 'people':
        return item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Person';
      case 'companies':
        return item.name || item.company || item.account?.name || 'Unknown Company';
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

  const activeTab = DATA_CATEGORIES.find(cat => cat['id'] === activeCategory);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Enhanced popup */}
      <div className="absolute left-0 bottom-12 bg-[var(--background)] border border-[var(--border)] dark:border-[var(--border)] rounded-lg shadow-xl min-w-[500px] max-w-[700px] max-h-[600px] z-50 flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]">
                Add Context
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--muted)] dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mt-1">
            Add files, leads, opportunities, and other data as context for AI analysis
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--border)] dark:border-[var(--border)] bg-[var(--panel-background)] dark:bg-gray-750">
          {DATA_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `border-${category.color}-500 text-${category.color}-600 bg-[var(--background)]`
                    : 'border-transparent text-[var(--muted)] hover:text-gray-700 dark:text-[var(--muted)] dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Search bar (for non-file categories) */}
          {activeCategory !== 'files' && (
            <div className="p-4 border-b border-[var(--border)] dark:border-[var(--border)]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab?.searchPlaceholder || 'Search...'}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-[var(--foreground)] placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* File options (for files category) */}
          {activeCategory === 'files' && (
            <div className="p-4">
              <div className="space-y-2">
                {FILE_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (option['action'] === 'browse') {
                          fileInputRef.current?.click();
                        } else if (option['action'] === 'recent') {
                          // Show recent files
                        } else if (option['action'] === 'cloud') {
                          console.log('Cloud storage coming soon');
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[var(--foreground)] dark:text-[var(--foreground)] hover:bg-[var(--panel-background)] flex items-center space-x-3 rounded-lg border border-[var(--border)] dark:border-[var(--border)] transition-colors"
                    >
                      <IconComponent className="w-5 h-5 text-[var(--muted)]" />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Recent files */}
              {recentFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] mb-3">Recent Files</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recentFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[var(--panel-background)] cursor-pointer"
                      >
                        <DocumentIcon className="w-4 h-4 text-[var(--muted)]" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search results (for data categories) */}
          {activeCategory !== 'files' && (
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <PipelineSkeleton message="Loading data..." />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((item) => {
                    const IconComponent = getItemIcon(activeCategory);
                    const isSelected = selectedItems.some(selected => selected['id'] === `${activeCategory}-${item.id}`);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleDataItemSelect(item)}
                        disabled={isSelected}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[var(--hover)] border-[var(--border)] dark:border-[var(--border)] opacity-50 cursor-not-allowed'
                            : 'hover:bg-[var(--panel-background)] border-[var(--border)] dark:border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-5 h-5 mt-0.5 ${getColorClasses(getItemColor(activeCategory)).split(' ')[0]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                              {getItemDisplayName(item, activeCategory)}
                            </div>
                            <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)] mt-1">
                              {getItemDescription(item, activeCategory)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-green-500">
                              <StarIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 text-[var(--muted)] dark:text-[var(--muted)]">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted)] dark:text-[var(--muted)]">
                  {activeTab?.icon && <activeTab.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />}
                  <p>Start typing to search {activeTab?.label.toLowerCase()}</p>
                  <p className="text-xs mt-1">{activeTab?.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected items preview */}
        {selectedItems.length > 0 && (
          <div className="border-t border-[var(--border)] dark:border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)]">
                Selected Context ({selectedItems.length})
              </h4>
              <button
                onClick={() => setSelectedItems([])}
                className="text-xs text-[var(--muted)] hover:text-gray-700 dark:text-[var(--muted)] dark:hover:text-gray-300"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4 max-h-20 overflow-y-auto">
              {selectedItems.map((item) => {
                const IconComponent = item.icon || DocumentIcon;
                return (
                  <div
                    key={item.id}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs border ${getColorClasses(item.color || 'gray')}`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="font-medium truncate max-w-32">{item.name}</span>
                    <button
                      onClick={() => removeSelectedItem(item.id)}
                      className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleAddContext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Add Context to Chat</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
