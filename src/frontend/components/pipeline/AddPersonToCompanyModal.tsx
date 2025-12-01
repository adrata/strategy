"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, UserPlusIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { authFetch } from "@/platform/api-fetch";
import { getCategoryColors } from "@/platform/config/color-palette";
import { getCommonShortcut } from "@/platform/utils/keyboard-shortcuts";
import { useUnifiedAuth } from "@/platform/auth";

interface AddPersonToCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onPersonAdded: (person: any) => void;
}

interface Person {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
}

export function AddPersonToCompanyModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onPersonAdded
}: AddPersonToCompanyModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSection, setShowSearchSection] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Get section-specific colors
  const colors = getCategoryColors('people');
  const { user } = useUnifiedAuth();
  
  // Check if this is Notary Everyday workspace
  const isNotaryEveryday = user?.activeWorkspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || 
                          user?.activeWorkspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1' || 
                          user?.activeWorkspaceId === 'cmezxb1ez0001pc94yry3ntjk';
  
  // Form data for creating new person
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    state: ''
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first name input when modal opens (create form is default now)
  useEffect(() => {
    if (isOpen && firstNameInputRef.current) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-focus search input when search section is expanded
  useEffect(() => {
    if (showSearchSection && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearchSection]);

  // Search people as user types with debouncing
  useEffect(() => {
    if (searchQuery.length >= 2 && companyId) {
      // Debounce search to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        searchPeople(searchQuery);
      }, 300); // 300ms debounce delay
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, companyId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchSection(false);
      setSelectedPerson(null);
      setSuccessMessage(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        state: ''
      });
    }
  }, [isOpen]);

  // Reset state when companyId changes (switching between companies)
  useEffect(() => {
    if (isOpen && companyId) {
      // Reset all state when switching to a different company
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchSection(false);
      setSelectedPerson(null);
      setSuccessMessage(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        state: ''
      });
      setIsCreating(false);
      setIsSearching(false);
      
      // Focus first name input when company changes (create form is default)
      setTimeout(() => {
        if (firstNameInputRef.current) {
          firstNameInputRef.current.focus();
        }
      }, 100);
    }
  }, [companyId, isOpen]);

  const searchPeople = async (query: string) => {
    // Capture current companyId to prevent stale updates
    const currentCompanyId = companyId;
    
    setIsSearching(true);
    try {
      // Use excludeCompanyId to filter out people already linked to this company
      // Use includeAllUsers to search across all people in the workspace regardless of seller assignment
      const url = `/api/v1/people?search=${encodeURIComponent(query)}&limit=10&includeAllUsers=true${currentCompanyId ? `&excludeCompanyId=${currentCompanyId}` : ''}`;
      const response = await authFetch(url);
      
      // Only update state if companyId hasn't changed during the API call
      if (companyId === currentCompanyId) {
        // authFetch returns parsed JSON data, not a Response object
        if (response && (response.data || Array.isArray(response))) {
          setSearchResults(response.data || response || []);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Error searching people:', error);
      // Only update state if companyId hasn't changed during the API call
      if (companyId === currentCompanyId) {
        setSearchResults([]);
      }
    } finally {
      // Only update loading state if companyId hasn't changed
      if (companyId === currentCompanyId) {
        setIsSearching(false);
      }
    }
  };

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleLinkExistingPerson = async () => {
    if (!selectedPerson) return;

    setIsCreating(true);
    try {
      const result = await authFetch(`/api/companies/${companyId}/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: selectedPerson.id
        })
      });

      // authFetch returns parsed JSON data, not a Response object
      if (result.success === false) {
        const errorMessage = result.message || result.error || 'Failed to link person to company';
        throw new Error(errorMessage);
      }

      // Handle both wrapped response format ({ success: true, data: ... }) and direct person object
      const updatedPerson = result.data || result;
      
      // Validate we got a person object
      if (!updatedPerson || !updatedPerson.id) {
        throw new Error('Invalid response: person data missing');
      }

      // Show success message
      const personName = updatedPerson.fullName || `${updatedPerson.firstName} ${updatedPerson.lastName}`;
      setSuccessMessage(`Successfully linked person: ${personName}`);
      
      // Call callback to notify parent
      onPersonAdded(updatedPerson);
      
      // Reset form to allow adding another person
      setSelectedPerson(null);
      setSearchQuery('');
      setSearchResults([]);
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error linking person to company:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to link person to company. Please try again.';
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('First name and last name are required');
      return;
    }

    setIsCreating(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const personData = {
        ...formData,
        fullName,
        company: companyName,
        companyId: companyId,
        status: "LEAD",
        source: "Manual Entry"
      };

      const result = await authFetch(`/api/companies/${companyId}/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData)
      });

      // authFetch returns parsed JSON data, not a Response object
      // Check for success indicator in the response
      if (result.success === false) {
        const errorMessage = result.message || result.error || 'Failed to create person. Please try again.';
        throw new Error(errorMessage);
      }

      // Handle both wrapped response format ({ success: true, data: ... }) and direct person object
      const newPerson = result.data || result;
      
      // Validate we got a person object with an id
      if (!newPerson || !newPerson.id) {
        throw new Error('Invalid response: person data missing');
      }
      
      // Dispatch refresh events for immediate table update
      window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
        detail: { 
          section: 'leads',
          type: 'record-created',
          recordId: newPerson.id 
        }
      }));
      
      window.dispatchEvent(new CustomEvent('refresh-counts', {
        detail: { 
          section: 'leads',
          type: 'record-created'
        }
      }));
      
      // Show success message
      const personName = newPerson.fullName || `${newPerson.firstName} ${newPerson.lastName}`;
      setSuccessMessage(`Successfully created person: ${personName}`);
      
      // Call callback to notify parent
      onPersonAdded(newPerson);
      
      // Reset form to allow adding another person
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        state: ''
      });
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      
      // Auto-focus first name input for quick entry of next person
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error creating person:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create person. Please try again.';
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10001]">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg px-4 py-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700">{successMessage}</span>
            </div>
          </div>
        </div>
      )}

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <UserPlusIcon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Add Person
              </h2>
              <p className="text-sm text-muted">to {companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-5">
          {/* Optional: Search for existing person (collapsed by default) */}
          <div className="mb-5">
            <button
              onClick={() => setShowSearchSection(!showSearchSection)}
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-full"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>Search existing people</span>
              {showSearchSection ? (
                <ChevronUpIcon className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 ml-auto" />
              )}
            </button>
            
            {showSearchSection && (
              <div className="mt-3 p-4 bg-panel-background rounded-lg border border-border">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type name or email to search..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
                
                {/* Search Results */}
                {isSearching && (
                  <div className="text-center py-3">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="mt-1 text-xs text-muted">Searching...</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((person) => (
                      <div
                        key={person.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                          selectedPerson?.id === person.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-hover'
                        }`}
                        onClick={() => handlePersonSelect(person)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{person.fullName}</p>
                            {person.email && (
                              <p className="text-xs text-muted">{person.email}</p>
                            )}
                          </div>
                          {selectedPerson?.id === person.id && (
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {selectedPerson && (
                      <button
                        onClick={handleLinkExistingPerson}
                        disabled={isCreating}
                        className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCreating ? 'Linking...' : `Link ${selectedPerson.fullName}`}
                      </button>
                    )}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <p className="mt-2 text-xs text-muted text-center">
                    No people found matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          {showSearchSection && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted">OR CREATE NEW</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
          )}

          {/* Create New Person Form (shown by default) */}
          <form onSubmit={handleCreateNewPerson} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  ref={firstNameInputRef}
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="John"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Job Title
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                placeholder="VP of Sales"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@company.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
              />
            </div>

            {/* State field - only for Notary Everyday workspace */}
            {isNotaryEveryday && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g., California, TX"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted"
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-muted hover:text-foreground font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCreating || !formData.firstName.trim() || !formData.lastName.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Add Person'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
