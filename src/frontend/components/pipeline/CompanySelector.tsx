"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  const [newCompanyDomain, setNewCompanyDomain] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current company name for display
  const getCurrentCompanyName = (): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  // Search companies
  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await authFetch(`/api/v1/companies?search=${encodeURIComponent(query.trim())}&limit=10`);
      console.log('🔍 [CompanySelector] Search response:', {
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
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCompanies(query);
  };

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    onChange(company);
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
    setShowAddForm(false);
  };

  // Handle adding new company
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      const data = await authFetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          domain: newCompanyDomain.trim() || undefined,
          website: newCompanyDomain.trim() ? `https://${newCompanyDomain.trim()}` : undefined
        }),
      });

      if (data.success && data.data) {
        onChange(data.data);
        setNewCompanyName('');
        setNewCompanyDomain('');
        setShowAddForm(false);
        setIsOpen(false);
      } else {
        console.error('Failed to create company:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating company:', error);
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
    setIsOpen(true);
    if (searchQuery) {
      searchCompanies(searchQuery);
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
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="py-1">
              {searchResults.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleCompanySelect(company)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] focus:bg-[var(--panel-background)] focus:outline-none"
                >
                  <div className="font-medium text-[var(--foreground)]">
                    {company.name}
                  </div>
                  {company.domain && (
                    <div className="text-sm text-[var(--muted)]">
                      {company.domain}
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
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-2 text-left hover:bg-[var(--panel-background)] focus:bg-[var(--panel-background)] focus:outline-none text-blue-600"
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
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Domain (optional)
                  </label>
                  <input
                    type="text"
                    value={newCompanyDomain}
                    onChange={(e) => setNewCompanyDomain(e.target.value)}
                    placeholder="example.com"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    disabled={!newCompanyName.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
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
              No companies found. Click to add new company.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
