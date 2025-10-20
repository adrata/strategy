"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatFieldValue } from './utils/field-formatters';
import { authFetch } from '@/platform/api-fetch';

interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
}

interface CompanySelectorProps {
  value?: string | Company;
  onChange: (company: Company | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CompanySelector({ 
  value, 
  onChange, 
  placeholder = "Search or add company...", 
  className = "",
  disabled = false 
}: CompanySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Search companies with debouncing
  const searchCompanies = useCallback(async (query: string) => {
    console.log('🔍 [CompanySelector] searchCompanies called with query:', query);
    
    if (!query.trim()) {
      console.log('🔍 [CompanySelector] Empty query, clearing results');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const url = `/api/v1/companies?search=${encodeURIComponent(query.trim())}&limit=10`;
    console.log('🔍 [CompanySelector] Making API request to:', url);
    
    try {
      const data = await authFetch(url);
      console.log('🔍 [CompanySelector] Search response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data?.map((c: any) => ({ id: c.id, name: c.name })) || [],
        fullResponse: data
      });
      setSearchResults(data.data || []);
      console.log('🔍 [CompanySelector] Updated searchResults state with', data.data?.length || 0, 'companies');
    } catch (error) {
      console.error('❌ [CompanySelector] Error searching companies:', error);
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

  // Load initial companies when dropdown opens
  const loadInitialCompanies = async () => {
    console.log('🔍 [CompanySelector] Loading initial companies');
    setIsSearching(true);
    try {
      const data = await authFetch('/api/v1/companies?limit=20');
      console.log('🔍 [CompanySelector] Initial companies response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data?.map((c: any) => ({ id: c.id, name: c.name })) || []
      });
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('❌ [CompanySelector] Error loading initial companies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('🔍 [CompanySelector] Search input changed:', {
      newQuery: query,
      previousQuery: searchQuery,
      currentResultsCount: searchResults.length
    });
    setSearchQuery(query);
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
    onChange(company);
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = searchResults.length + (searchQuery.trim() && !showAddForm ? 1 : 0); // +1 for "Add new" option

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleCompanySelect(searchResults[selectedIndex]);
        } else if (selectedIndex === searchResults.length && searchQuery.trim() && !showAddForm) {
          // Trigger "Add new" action
          setShowAddForm(true);
          setNewCompanyName(searchQuery.trim());
          setCreateError('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setShowAddForm(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle adding new company
  const handleAddCompany = async (e?: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering parent click handlers
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newCompanyName.trim()) return;

    console.log('🏢 [CompanySelector] Starting company creation:', {
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

      console.log('🏢 [CompanySelector] Company creation response:', data);

      if (data.success && data.data) {
        const isExisting = data.isExisting || false;
        console.log('✅ [CompanySelector] Company operation successful:', {
          isExisting,
          company: data.data,
          message: data.meta?.message
        });
        
        // Clear companies cache to ensure fresh data
        if (typeof window !== 'undefined') {
          const workspaceId = data.data.workspaceId || 'default';
          const cacheKey = `adrata-companies-${workspaceId}`;
          localStorage.removeItem(cacheKey);
          console.log('🧹 [CompanySelector] Cleared companies cache:', cacheKey);
          
          // Dispatch cache invalidation event
          window.dispatchEvent(new CustomEvent('cache-invalidate', {
            detail: { 
              pattern: 'companies-*', 
              reason: 'new_company_created',
              section: 'companies'
            }
          }));
        }
        
        onChange(data.data);
        setNewCompanyName('');
        setNewCompanyWebsite('');
        setShowAddForm(false);
        setIsOpen(false);
        setCreateError('');
        setSearchQuery('');
        setSearchResults([]);
        console.log('✅ [CompanySelector] Company selector state reset, dropdown closed');
      } else {
        const errorMsg = data.error || 'Failed to create company';
        console.error('❌ [CompanySelector] Failed to create company:', errorMsg);
        setCreateError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create company. Please try again.';
      console.error('❌ [CompanySelector] Error creating company:', error);
      setCreateError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle input focus
  const handleInputFocus = () => {
    console.log('🔍 [CompanySelector] Input focused, current state:', {
      isOpen,
      searchQuery,
      searchResultsCount: searchResults.length,
      searchResults: searchResults.map(c => c.name)
    });
    setIsOpen(true);
    if (searchQuery) {
      console.log('🔍 [CompanySelector] Input focus: searching with existing query:', searchQuery);
      searchCompanies(searchQuery);
    } else {
      console.log('🔍 [CompanySelector] Input focus: no search query, loading initial companies');
      // Load initial companies when opening without a query
      loadInitialCompanies();
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : getCurrentCompanyName()}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => {
            console.log('🔍 [CompanySelector] Chevron clicked, current state:', {
              isOpen,
              searchQuery,
              searchResultsCount: searchResults.length,
              searchResults: searchResults.map(c => c.name)
            });
            if (!isOpen) {
              // Opening dropdown - load initial companies if no search query
              if (!searchQuery) {
                console.log('🔍 [CompanySelector] Chevron: loading initial companies on open');
                loadInitialCompanies();
              }
            }
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg overflow-y-auto ${showAddForm ? 'max-h-[500px]' : 'max-h-64'}`}>
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="py-1">
              {searchResults.map((company, index) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleCompanySelect(company)}
                  className={`w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] focus:bg-[var(--panel-background)] focus:outline-none ${
                    selectedIndex === index ? 'bg-[var(--panel-background)]' : ''
                  }`}
                >
                  <div className="font-medium text-[var(--foreground)]">
                    {highlightText(company.name, searchQuery)}
                  </div>
                  {company.domain && (
                    <div className="text-sm text-[var(--muted)]">
                      {highlightText(company.domain, searchQuery)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Add New Company Option */}
          {searchQuery.trim() && !showAddForm && (
            <div className="border-t border-[var(--border)] py-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setNewCompanyName(searchQuery.trim());
                  setCreateError('');
                }}
                className={`w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] focus:bg-[var(--panel-background)] focus:outline-none text-blue-600 ${
                  selectedIndex === searchResults.length ? 'bg-[var(--panel-background)]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  <span>Add "{searchQuery}" as new company</span>
                </div>
              </button>
            </div>
          )}

          {/* Add New Company Form */}
          {showAddForm && (
            <div className="border-t border-[var(--border)] p-4 bg-[var(--panel-background)]">
              <div className="space-y-3">
                {/* Error Message */}
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-red-700">{createError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => {
                      setNewCompanyName(e.target.value);
                      setCreateError('');
                    }}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Website (optional)
                  </label>
                  <input
                    type="text"
                    value={newCompanyWebsite}
                    onChange={(e) => {
                      setNewCompanyWebsite(e.target.value);
                      setCreateError('');
                    }}
                    placeholder="https://example.com or example.com"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddCompany(e)}
                    disabled={!newCompanyName.trim() || isCreating}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Adding...' : 'Add Company'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setCreateError('');
                    }}
                    disabled={isCreating}
                    className="px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="px-4 py-2 text-sm text-[var(--muted)]">
              Searching...
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && !showAddForm && (
            <div className="px-4 py-2 text-sm text-[var(--muted)]">
              No companies found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
