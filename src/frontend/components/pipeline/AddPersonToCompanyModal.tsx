"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, UserPlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-focus first name input when creating new person
  useEffect(() => {
    if (showCreateForm && firstNameInputRef.current) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    }
  }, [showCreateForm]);

  // Search people as user types
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPeople(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowCreateForm(false);
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

  const searchPeople = async (query: string) => {
    setIsSearching(true);
    try {
      // Use excludeCompanyId to filter out people already linked to this company
      // Use includeAllUsers to search across all people in the workspace regardless of seller assignment
      const url = `/api/v1/people?search=${encodeURIComponent(query)}&limit=10&includeAllUsers=true${companyId ? `&excludeCompanyId=${companyId}` : ''}`;
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching people:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
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
      
      // Close modal after a short delay to show the success message
      setTimeout(() => {
        onPersonAdded(updatedPerson);
        onClose();
      }, 1500);
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
      
      // Close modal after a short delay to show the success message
      setTimeout(() => {
        onPersonAdded(newPerson);
        onClose();
      }, 1500);
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
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <UserPlusIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Add Person to Company
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Company Info */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {companyName}
            </span>
          </div>
        </div>

        <div className="p-6">
          {!showCreateForm ? (
            <>
              {/* Search Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search for existing person
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type name or email to search..."
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Search Results
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((person) => (
                      <div
                        key={person.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPerson?.id === person.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handlePersonSelect(person)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {person.fullName}
                              </p>
                              {person.company && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  At {person.company.name}
                                </span>
                              )}
                            </div>
                            {person.email && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {person.email}
                              </p>
                            )}
                            {person.jobTitle && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {person.jobTitle}
                              </p>
                            )}
                            {person.company?.industry && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {person.company.industry}
                              </p>
                            )}
                          </div>
                          {selectedPerson?.id === person.id && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !showCreateForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    No people found matching "{searchQuery}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
                    People already linked to {companyName} are not shown
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Create New Person
                </button>

                {selectedPerson && (
                  <button
                    onClick={handleLinkExistingPerson}
                    disabled={isCreating}
                    className="px-6 py-2 border rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: !isCreating ? colors.bgHover : colors.bg,
                      color: colors.primary,
                      borderColor: colors.border
                    }}
                    onMouseEnter={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.backgroundColor = colors.bgHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.backgroundColor = colors.bgHover;
                      }
                    }}
                  >
                    {isCreating ? 'Saving...' : `Complete (${getCommonShortcut('SUBMIT')})`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Create New Person Form */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Create New Person
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This person will be automatically associated with {companyName}.
                </p>
              </div>

              <form onSubmit={handleCreateNewPerson} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      ref={firstNameInputRef}
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* State field - only for Notary Everyday workspace */}
                {isNotaryEveryday && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g., California, TX"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
                  >
                    Back to Search
                  </button>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2 border rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: !isCreating ? colors.bgHover : colors.bg,
                      color: colors.primary,
                      borderColor: colors.border
                    }}
                    onMouseEnter={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.backgroundColor = colors.bgHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.backgroundColor = colors.bgHover;
                      }
                    }}
                  >
                    {isCreating ? 'Saving...' : `Complete (${getCommonShortcut('SUBMIT')})`}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
