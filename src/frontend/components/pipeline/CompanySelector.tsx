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
    console.log('🔍 [CompanySelector] searchCompanies called with query:', query);
    
    if (!query.trim()) {
      console.log('🔍 [CompanySelector] Empty query, clearing results');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const url = `/api/v1/companies?search=${encodeURIComponent(query.trim())}&limit=20`;
    console.log('🔍 [CompanySelector] Making API request to:', url);
    
    try {
      const data = await authFetch(url);
      console.log('🔍 [CompanySelector] Search response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data?.map((c: any) => ({ id: c.id, name: c.name })) || [],
        fullResponse: data
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
      console.log('🔍 [CompanySelector] Updated searchResults state with', scoredCompanies.length, 'filtered companies');
    } catch (error) {
      console.error('❌ [CompanySelector] Error searching companies:', error);
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

  // Enhanced highlighting function with better visual hierarchy
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const searchTerm = query.trim();
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/10 text-primary font-semibold px-1 rounded">
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
        
        // Note: Cache invalidation is handled by the parent component
        // The company creation will trigger a refresh in the parent context
        
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
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
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
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground disabled:opacity-50"
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-y-auto ${showAddForm ? 'max-h-[500px]' : 'max-h-64'}`}>
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="py-1">
              {searchResults.map((company, index) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleCompanySelect(company)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-primary/10 focus:bg-primary/10 focus:outline-none transition-colors ${
                    selectedIndex === index ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="font-medium text-foreground">
                    {highlightText(company.name, searchQuery)}
                  </div>
                  {company.domain && (
                    <div className="text-sm text-muted mt-0.5">
                      {highlightText(company.domain, searchQuery)}
                    </div>
                  )}
                  {company.relevanceScore && (
                    <div className="text-xs text-gray-400 mt-1">
                      {company.relevanceScore >= 80 ? 'Exact match' : 
                       company.relevanceScore >= 60 ? 'Close match' : 'Partial match'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Add New Company Option */}
          {searchQuery.trim() && !showAddForm && (
            <div className="border-t border-border py-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setNewCompanyName(searchQuery.trim());
                  setCreateError('');
                }}
                className={`w-full px-4 py-2 text-left hover:bg-panel-background focus:bg-panel-background focus:outline-none text-blue-600 ${
                  selectedIndex === searchResults.length ? 'bg-panel-background' : ''
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
            <div className="border-t border-border p-4 bg-panel-background">
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
                  <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddCompany(e)}
                    disabled={!newCompanyName.trim() || isCreating}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="px-4 py-2 text-sm text-muted">
              Searching...
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && !showAddForm && (
            <div className="px-4 py-3 text-sm text-muted text-center">
              <p>No companies found matching "{searchQuery}"</p>
              <p className="text-xs mt-1 opacity-75">Try a different search term or add a new company</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
