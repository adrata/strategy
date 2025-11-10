import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { authFetch } from '@/platform/api-fetch';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';
import { generateSlug } from '@/platform/utils/url-utils';

interface Company {
  id: string;
  name: string;
  website?: string;
}

interface InlineCompanySelectorProps {
  value: string | Company | null;
  field: string;
  onSave: (field: string, value: string | Company, recordId: string, recordType: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  recordId?: string;
  recordType?: string;
  companyId?: string;
  onSuccess?: (message: string) => void;
}

export const InlineCompanySelector: React.FC<InlineCompanySelectorProps> = ({
  value,
  field,
  onSave,
  className = '',
  placeholder = 'Search or add company',
  recordId,
  recordType,
  companyId,
  onSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Navigation hook for workspace-aware routing
  const { navigateToPipelineItem } = useWorkspaceNavigation();

  // Get current company name for display
  const getCurrentCompanyName = (): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  // Sync editValue with value prop when it changes, but not while saving
  useEffect(() => {
    if (!isSaving) {
      setEditValue(getCurrentCompanyName());
    }
  }, [value, isSaving]);

  // Calculate relevance score for search results
  const calculateRelevanceScore = useCallback((company: Company, query: string) => {
    const searchTerm = query.toLowerCase().trim();
    const name = (company.name || '').toLowerCase();
    const legalName = (company.legalName || '').toLowerCase();
    const tradingName = (company.tradingName || '').toLowerCase();
    
    let score = 0;
    
    // Exact matches (highest priority)
    if (name === searchTerm) score = 100;
    else if (legalName === searchTerm) score = 95;
    else if (tradingName === searchTerm) score = 90;
    
    // Starts with matches (high priority)
    else if (name.startsWith(searchTerm)) score = 80;
    else if (legalName.startsWith(searchTerm)) score = 75;
    else if (tradingName.startsWith(searchTerm)) score = 70;
    
    // Contains matches (lower priority, only for longer terms)
    else if (searchTerm.length >= 3) {
      if (name.includes(searchTerm)) score = 40;
      else if (legalName.includes(searchTerm)) score = 35;
      else if (tradingName.includes(searchTerm)) score = 30;
    }
    
    return score;
  }, []);

  // Search companies with debouncing
  const searchCompanies = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await authFetch(`/api/v1/companies?search=${encodeURIComponent(query.trim())}&limit=20`);
      console.log('🔍 [InlineCompanySelector] Search response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data
      });
      
      // Apply client-side relevance scoring and filtering
      const companies = data.data || [];
      const scoredCompanies = companies
        .map(company => ({
          ...company,
          relevanceScore: calculateRelevanceScore(company, query)
        }))
        .filter(company => company.relevanceScore >= 30) // Filter out low-relevance results
        .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
        .slice(0, 10); // Limit to top 10 results
      
      setSearchResults(scoredCompanies);
    } catch (error) {
      console.error('Error searching companies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [calculateRelevanceScore]);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchCompanies(query);
    }, 300); // 300ms debounce
  }, [searchCompanies]);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setEditValue(query);
    setSelectedIndex(-1); // Reset selection when typing
    
    // Clear results immediately when query becomes empty
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Use debounced search
    debouncedSearch(query);
  };

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    setEditValue(company.name);
    setSearchQuery('');
    setSearchResults([]);
    setShowAddForm(false);
    setCreateError('');
    setSelectedIndex(-1);
  };

  // Enhanced highlighting function with better visual hierarchy
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const searchTerm = query.trim();
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-blue-100 text-blue-900 font-semibold px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Handle keyboard navigation and form submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) return;

    // Handle form submission (Enter key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showAddForm) {
        handleAddCompany();
      } else if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleCompanySelect(searchResults[selectedIndex]);
      } else if (selectedIndex === searchResults.length && searchQuery.trim() && !showAddForm) {
        // Trigger "Add new" action
        setShowAddForm(true);
        setNewCompanyName(searchQuery.trim());
        setCreateError('');
      } else {
        handleEditSave();
      }
      return;
    }

    // Handle escape key
    if (e.key === 'Escape') {
      if (showAddForm) {
        setShowAddForm(false);
        setCreateError('');
      } else {
        setIsEditing(false);
        setShowAddForm(false);
        setSelectedIndex(-1);
      }
      return;
    }

    // Handle arrow key navigation (only when not in add form)
    if (!showAddForm) {
      const totalItems = searchResults.length + (searchQuery.trim() ? 1 : 0); // +1 for "Add new" option

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
          break;
      }
    }
  };

  // Handle adding new company
  const handleAddCompany = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newCompanyName.trim()) return;

    console.log('🏢 [InlineCompanySelector] Starting company creation:', {
      name: newCompanyName.trim(),
      website: newCompanyWebsite.trim()
    });

    setIsCreating(true);
    setCreateError('');

    try {
      const data = await authFetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          website: newCompanyWebsite.trim() || undefined
        }),
      });

      console.log('🏢 [InlineCompanySelector] Company creation response:', data);

      if (data.success && data.data) {
        const isExisting = data.isExisting || false;
        console.log('✅ [InlineCompanySelector] Company operation successful:', {
          isExisting,
          company: data.data,
          message: data.meta?.message
        });
        setEditValue(data.data.name);
        setNewCompanyName('');
        setNewCompanyWebsite('');
        setShowAddForm(false);
        setCreateError('');
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const errorMsg = data.error || 'Failed to create company';
        console.error('❌ [InlineCompanySelector] Failed to create company:', errorMsg);
        setCreateError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create company';
      console.error('❌ [InlineCompanySelector] Error creating company:', errorMsg);
      setCreateError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStart = () => {
    setEditValue(getCurrentCompanyName());
    setSearchQuery('');
    setSearchResults([]);
    setShowAddForm(false);
    setCreateError('');
    setNewCompanyName('');
    setNewCompanyWebsite('');
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    const currentValue = getCurrentCompanyName();
    if (editValue === currentValue) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setIsSaving(true);
    try {
      // Determine if this is a company object or string
      let saveValue: string | Company;
      
      // Check if the editValue matches any search result
      const matchingCompany = searchResults.find(company => 
        company.name.toLowerCase() === editValue.toLowerCase()
      );
      
      if (matchingCompany) {
        // User selected an existing company
        saveValue = matchingCompany;
      } else {
        // User typed a new company name
        saveValue = editValue;
      }

      await onSave(field, saveValue, recordId || '', recordType || '');
      
      const message = `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`;
      onSuccess?.(message);
      
      // Clear all search state when saving
      setSearchQuery('');
      setSearchResults([]);
      setShowAddForm(false);
      setCreateError('');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating field:', error);
      onSuccess?.('Failed to update. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditValue(getCurrentCompanyName());
    setSearchQuery('');
    setSearchResults([]);
    setShowAddForm(false);
    setCreateError('');
    setNewCompanyName('');
    setNewCompanyWebsite('');
    setIsEditing(false);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setShowAddForm(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
          />
          
          {/* Search Results Dropdown */}
          {(searchResults.length > 0 || showAddForm || (editValue.trim() && !isSearching) || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Searching companies...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((company, index) => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                      selectedIndex === index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {highlightText(company.name, searchQuery)}
                    </div>
                    {company.website && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {highlightText(company.website, searchQuery)}
                      </div>
                    )}
                    {company.relevanceScore && (
                      <div className="text-xs text-gray-400 mt-1">
                        {company.relevanceScore >= 80 ? 'Exact match' : 
                         company.relevanceScore >= 60 ? 'Close match' : 'Partial match'}
                      </div>
                    )}
                  </div>
                ))
              ) : editValue.trim() && !showAddForm && !isSearching ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  <div className="text-4xl mb-2">🏢</div>
                  <p className="font-medium">No companies found matching "{editValue}"</p>
                  <p className="text-xs mt-1 opacity-75">Try a different search term or add a new company</p>
                </div>
              ) : null}
              
              {/* Add New Company Option */}
              {editValue.trim() && !searchResults.some(company => 
                company.name.toLowerCase() === editValue.toLowerCase()
              ) && (
                <div className="border-t border-gray-200">
                  {!showAddForm ? (
                    <div
                      onClick={() => {
                        setNewCompanyName(editValue);
                        setShowAddForm(true);
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 text-sm"
                    >
                      + Add "{editValue}"
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50">
                      <div className="text-sm font-medium mb-2">Add New Company</div>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Company name"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newCompanyWebsite}
                        onChange={(e) => setNewCompanyWebsite(e.target.value)}
                        placeholder="Website (optional)"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                      />
                      {createError && (
                        <div className="text-red-500 text-xs mb-2">{createError}</div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCompany}
                          disabled={isCreating || !newCompanyName.trim()}
                          className="px-3 py-1 bg-button-background text-button-text text-xs rounded hover:bg-button-hover disabled:opacity-50"
                        >
                          {isCreating ? 'Creating...' : 'Add Company'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddForm(false);
                            setNewCompanyName('');
                            setNewCompanyWebsite('');
                            setCreateError('');
                          }}
                          className="px-3 py-1 bg-panel-background text-foreground text-xs rounded hover:bg-hover border border-border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={handleEditSave}
          disabled={isLoading}
          className="p-1 text-success hover:text-success-text disabled:opacity-50"
          title="Save"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleEditCancel}
          disabled={isLoading}
          className="p-1 text-error hover:text-error-text disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const handleCompanyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const companyName = getCurrentCompanyName();
    if (companyName && companyName !== '-') {
      // Use companyId if available, otherwise fall back to searching by name
      if (companyId) {
        // Navigate to the actual company record using workspace-aware navigation
        // Include search parameter and tab=overview in the URL
        try {
          const slug = generateSlug(companyName, companyId);
          const currentPath = window.location.pathname;
          const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
          const workspaceSlug = workspaceMatch ? workspaceMatch[1] : 'workspace';
          
          // Build URL with search parameter and tab
          const url = `/${workspaceSlug}/companies/${slug}?search=${encodeURIComponent(companyName)}&tab=overview`;
          window.location.href = url;
        } catch (error) {
          console.error('Error navigating to company:', error);
          // Fallback to search navigation if navigateToPipelineItem fails
          const currentPath = window.location.pathname;
          const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
          if (workspaceMatch) {
            const workspaceSlug = workspaceMatch[1];
            window.location.href = `/${workspaceSlug}/companies?search=${encodeURIComponent(companyName)}`;
          } else {
            window.location.href = `/workspace/companies?search=${encodeURIComponent(companyName)}`;
          }
        }
      } else {
        // Fallback: search for company by name and navigate to first result
        console.warn('No companyId provided, falling back to search navigation');
        const currentPath = window.location.pathname;
        const workspaceMatch = currentPath.match(/^\/([^\/]+)\//);
        if (workspaceMatch) {
          const workspaceSlug = workspaceMatch[1];
          window.location.href = `/${workspaceSlug}/companies?search=${encodeURIComponent(companyName)}`;
        } else {
        window.location.href = `/workspace/companies?search=${encodeURIComponent(companyName)}`;
        }
      }
    }
  };

  return (
    <div className="group flex items-center gap-2">
      <button
        onClick={handleCompanyClick}
        className={`${className} ${!getCurrentCompanyName() ? 'text-muted' : 'text-blue-600 hover:text-blue-700 hover:underline cursor-pointer'} transition-colors`}
        title={getCurrentCompanyName() ? `View ${getCurrentCompanyName()} company details` : ''}
      >
        {getCurrentCompanyName() || '-'}
      </button>
      <button
        onClick={handleEditStart}
        className="p-1 text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit"
      >
        <PencilIcon className="h-3 w-3" />
      </button>
    </div>
  );
};
