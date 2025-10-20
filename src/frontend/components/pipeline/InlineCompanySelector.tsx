import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { authFetch } from '@/platform/api-fetch';

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

  // Search companies with debouncing
  const searchCompanies = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await authFetch(`/api/v1/companies?search=${encodeURIComponent(query.trim())}&limit=10`);
      console.log('🔍 [InlineCompanySelector] Search response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data
      });
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching companies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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

  // Highlight matching text in search results
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
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
            className={`w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
          />
          
          {/* Search Results Dropdown */}
          {(searchResults.length > 0 || showAddForm || (editValue.trim() && !isSearching) || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((company, index) => (
                  <div
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      selectedIndex === index ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="font-medium text-sm">{highlightText(company.name, searchQuery)}</div>
                    {company.website && (
                      <div className="text-xs text-gray-500">{highlightText(company.website, searchQuery)}</div>
                    )}
                  </div>
                ))
              ) : editValue.trim() && !showAddForm && !isSearching ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No companies found
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
                          className="px-3 py-1 bg-[var(--button-background)] text-[var(--button-text)] text-xs rounded hover:bg-[var(--button-hover)] disabled:opacity-50"
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
                          className="px-3 py-1 bg-[var(--panel-background)] text-[var(--foreground)] text-xs rounded hover:bg-[var(--hover)] border border-[var(--border)]"
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
          className="p-1 text-[var(--success)] hover:text-[var(--success-text)] disabled:opacity-50"
          title="Save"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleEditCancel}
          disabled={isLoading}
          className="p-1 text-[var(--error)] hover:text-[var(--error-text)] disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <span className={`${className} ${!getCurrentCompanyName() ? 'text-[var(--muted)]' : ''}`}>
        {getCurrentCompanyName() || '-'}
      </span>
      <button
        onClick={handleEditStart}
        className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit"
      >
        <PencilIcon className="h-3 w-3" />
      </button>
    </div>
  );
};
