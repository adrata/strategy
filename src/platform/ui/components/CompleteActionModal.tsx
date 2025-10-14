"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { getCategoryColors } from '@/platform/config/color-palette';
import { authFetch } from '@/platform/api-fetch';

interface CompleteActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  personName?: string; // Optional - if not provided, will show search
  companyName?: string; // Optional company name for auto-fill
  isLoading?: boolean;
  section?: string; // The section type to determine color scheme
  initialData?: ActionLogData; // For undo functionality
}

export interface ActionLogData {
  person: string;
  personId?: string;
  company?: string;
  companyId?: string;
  type: 'LinkedIn Connection' | 'LinkedIn InMail' | 'LinkedIn Message' | 'Phone' | 'Email';
  time: 'Now' | 'Past' | 'Future';
  action: string;
  actionPerformedBy?: string; // User ID of who performed the action
}

export function CompleteActionModal({
  isOpen,
  onClose,
  onSubmit,
  personName,
  companyName,
  isLoading = false,
  section = 'speedrun',
  initialData
}: CompleteActionModalProps) {
  const { users, currentUser } = useWorkspaceUsers();
  
  // Debug logging
  console.log('🔍 [CompleteActionModal] Props:', {
    personName,
    companyName,
    section,
    isOpen
  });
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  
  // Get section-specific colors
  const categoryColors = getCategoryColors(section);
  
  // Search functionality for when no person is provided
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [personSearchResults, setPersonSearchResults] = useState<any[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [showCreatePersonForm, setShowCreatePersonForm] = useState(false);
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  
  // Form data for creating new person
  const [newPersonData, setNewPersonData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: ''
  });
  
  const [formData, setFormData] = useState<ActionLogData>(() => {
    // Use initialData if provided (for undo), otherwise use defaults
    const initialFormData = initialData ? {
      ...initialData,
      person: personName || initialData.person, // Use provided personName or keep existing
      company: companyName || initialData.company // Use provided company or keep existing
    } : {
      person: personName || '',
      personId: '',
      company: companyName || '',
      companyId: '',
      type: 'LinkedIn Connection',
      time: 'Now',
      action: '',
      actionPerformedBy: currentUser?.id || ''
    };
    
    console.log('🔍 [CompleteActionModal] Initial formData:', {
      personName,
      companyName,
      initialFormData
    });
    
    return initialFormData;
  });

  // Update form data when initialData or props change
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        person: personName || initialData.person, // Use provided personName or keep existing
        company: companyName || initialData.company // Use provided company or keep existing
      });
    } else {
      setFormData(prev => ({
        ...prev,
        person: personName || prev.person,
        company: companyName || prev.company
      }));
    }
  }, [initialData, personName, companyName]);

  // Auto-focus notes field when modal opens (only if person is already selected)
  useEffect(() => {
    if (isOpen && notesRef.current && formData.person) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        notesRef.current?.focus();
      }, 100);
    }
  }, [isOpen, formData.person]);

  // Auto-focus first name input when create form opens
  useEffect(() => {
    if (showCreatePersonForm && firstNameInputRef.current) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    }
  }, [showCreatePersonForm]);

  // Search people as user types
  useEffect(() => {
    const trimmedQuery = personSearchQuery.trim();
    
    // Only search if the query is meaningful
    if (trimmedQuery.length >= 2) {
      // Check if the query looks like random characters (not a real name/email)
      const isLikelyRandomText = /^[^a-zA-Z\s@\-']*$/.test(trimmedQuery) || 
                                 (trimmedQuery.length < 3 && !trimmedQuery.includes('@'));
      
      if (isLikelyRandomText) {
        // Don't search for obviously random text
        setPersonSearchResults([]);
        return;
      }
      
      searchPeople(trimmedQuery);
    } else {
      setPersonSearchResults([]);
    }
  }, [personSearchQuery]);

  const searchPeople = async (query: string) => {
    setIsSearchingPeople(true);
    try {
      // Build API URL with section-aware filtering
      const params = new URLSearchParams({
        search: query,
        limit: '10'
      });
      
      // Apply section-based filtering
      if (section === 'leads' || section === 'prospects' || section === 'opportunities') {
        // For leads/prospects/opportunities, pass the section to filter by status
        params.set('section', section);
      } else if (section === 'people' || section === 'companies') {
        // For people/companies sections, search all people regardless of status
        params.set('section', 'people');
      }
      // For other sections (like 'speedrun'), don't add section filter to search all
      
      // TEMPORARY DEBUG: Remove section filtering to test if that's the issue
      // params.delete('section');
      
      const apiUrl = `/api/v1/people?${params.toString()}`;
      console.log('🔍 [CompleteActionModal] Searching people:', {
        query,
        section,
        apiUrl,
        params: Object.fromEntries(params.entries())
      });
      
      const data = await authFetch(apiUrl);
      console.log('🔍 [CompleteActionModal] Search response:', {
        success: data.success,
        resultCount: data.data?.length || 0,
        results: data.data?.map((p: any) => ({ id: p.id, name: p.fullName || `${p.firstName} ${p.lastName}` })) || []
      });
      setPersonSearchResults(data.data || []); // API wraps results in 'data' field
    } catch (error) {
      console.error('Error searching people:', error);
    } finally {
      setIsSearchingPeople(false);
    }
  };

  const handlePersonSelect = (person: any) => {
    setFormData(prev => ({
      ...prev,
      person: person.fullName || `${person.firstName} ${person.lastName}`.trim(),
      personId: person.id,
      company: person.company || prev.company,
      companyId: person.companyId || prev.companyId
    }));
    setPersonSearchQuery('');
    setPersonSearchResults([]);
    setShowCreatePersonForm(false);
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonData.firstName.trim() || !newPersonData.lastName.trim()) {
      alert('First name and last name are required');
      return;
    }

    setIsCreatingPerson(true);
    try {
      const response = await authFetch('/api/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newPersonData.firstName.trim(),
          lastName: newPersonData.lastName.trim(),
          email: newPersonData.email.trim() || undefined,
          jobTitle: newPersonData.jobTitle.trim() || undefined,
          company: formData.company || undefined,
          companyId: formData.companyId || undefined
        })
      });

      if (response.ok) {
        const newPerson = await response.json();
        // Auto-select the newly created person
        handlePersonSelect(newPerson);
        // Reset form
        setNewPersonData({
          firstName: '',
          lastName: '',
          email: '',
          jobTitle: ''
        });
      } else {
        throw new Error('Failed to create person');
      }
    } catch (error) {
      console.error('Error creating person:', error);
      alert('Failed to create person. Please try again.');
    } finally {
      setIsCreatingPerson(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action.trim()) {
      alert('Please enter action details');
      return;
    }
    if (!formData.person.trim()) {
      alert('Please select a person');
      return;
    }
    
    // Check if this is an undo action (has initialData)
    const isUndoAction = !!initialData;
    
    if (isUndoAction) {
      console.log('🔄 Resubmitting action after undo - will save to database');
    }
    
    onSubmit(formData);
  };

  // Cross-platform keyboard shortcut detection
  const isModifierKeyPressed = (event: KeyboardEvent | React.KeyboardEvent) => {
    // Mac: metaKey (⌘), Windows/Linux: ctrlKey (Ctrl)
    return event.metaKey || event.ctrlKey;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isModifierKeyPressed(e) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && formData.action.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // Document-level keyboard shortcut handler for better reliability
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      // Handle action type shortcuts (1-5) with cycling
      // Check both key and code for better cross-platform compatibility
      const isNumberKey = (event.key >= '1' && event.key <= '5') || 
                         (event.code >= 'Digit1' && event.code <= 'Digit5') ||
                         (event.code >= 'Numpad1' && event.code <= 'Numpad5');
      
      if (isNumberKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const actionTypes: ActionLogData['type'][] = [
          'LinkedIn Connection',
          'LinkedIn InMail', 
          'LinkedIn Message',
          'Phone',
          'Email'
        ];
        
        // Extract number from key or code
        let pressedNumber: number;
        if (event.key >= '1' && event.key <= '5') {
          pressedNumber = parseInt(event.key);
        } else if (event.code.includes('Digit')) {
          pressedNumber = parseInt(event.code.replace('Digit', ''));
        } else if (event.code.includes('Numpad')) {
          pressedNumber = parseInt(event.code.replace('Numpad', ''));
        } else {
          return; // Fallback if we can't determine the number
        }
        
        const currentType = formData.type;
        const currentIndex = actionTypes.indexOf(currentType);
        
        // If pressing the same number as current selection, cycle to next option
        if (currentIndex === pressedNumber - 1) {
          const nextIndex = (currentIndex + 1) % actionTypes.length;
          setFormData(prev => ({ ...prev, type: actionTypes[nextIndex] }));
        } else {
          // Otherwise, select the pressed number
          setFormData(prev => ({ ...prev, type: actionTypes[pressedNumber - 1] }));
        }
        return;
      }

      // Handle submit shortcut
      if (isModifierKeyPressed(event) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (!isLoading && formData.action.trim()) {
          handleSubmit(event as any);
        }
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleDocumentKeyDown, true); // Capture phase
    document.addEventListener('keydown', handleDocumentKeyDown, false); // Bubble phase
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown, true);
      document.removeEventListener('keydown', handleDocumentKeyDown, false);
    };
  }, [isOpen, isLoading, formData.action, formData.type]);

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        person: personName || '',
        personId: '',
        company: companyName || '',
        companyId: '',
        type: 'LinkedIn Connection',
        time: 'Now',
        action: '',
        actionPerformedBy: currentUser?.id || ''
      });
      setPersonSearchQuery('');
      setPersonSearchResults([]);
      setShowCreatePersonForm(false);
      setNewPersonData({
        firstName: '',
        lastName: '',
        email: '',
        jobTitle: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: categoryColors.bg }}
              >
                <svg 
                  className="w-5 h-5" 
                  style={{ color: categoryColors.primary }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {initialData ? '🔄 Undo Action' : 'Add Action'}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {initialData 
                    ? `Resubmit your interaction with ${personName || 'selected person'} (undo mode - will resave to database)`
                    : `Log your interaction with ${personName || 'selected person'}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
            {/* Person - Auto-filled or Search */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Person *
              </label>
              {formData.person ? (
                // Show selected person
                <div 
                  className="px-3 py-2 border rounded-lg text-[var(--foreground)] text-sm"
                  style={{ 
                    backgroundColor: categoryColors.bg,
                    borderColor: categoryColors.border
                  }}
                >
                  {formData.person}
                  {formData.company && (
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {formData.company}
                    </div>
                  )}
                </div>
              ) : (
                // Show search field
                <div className="relative">
                  <input
                    type="text"
                    value={personSearchQuery}
                    onChange={(e) => setPersonSearchQuery(e.target.value)}
                    placeholder="Search for person..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                    style={{
                      '--tw-ring-color': categoryColors.primary
                    } as React.CSSProperties}
                    disabled={isLoading}
                  />

                  {/* Person Search Results */}
                  {(personSearchResults.length > 0 || (personSearchQuery.trim().length >= 2 && !isSearchingPeople)) && !showCreatePersonForm && (
                    <div className="absolute z-20 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isSearchingPeople ? (
                        <div className="px-4 py-3 text-center">
                          <div className="text-sm text-[var(--muted)]">Searching...</div>
                        </div>
                      ) : personSearchResults.length > 0 ? (
                        personSearchResults.map((person) => (
                          <div
                            key={person.id}
                            onClick={() => handlePersonSelect(person)}
                            className="px-4 py-2 hover:bg-[var(--panel-background)] cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-[var(--foreground)]">
                              {person.fullName || `${person.firstName} ${person.lastName}`.trim()}
                            </div>
                            {person.jobTitle && (
                              <div className="text-sm text-[var(--muted)]">{person.jobTitle}</div>
                            )}
                            {person.company && (
                              <div className="text-sm text-[var(--muted)]">{person.company.name}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center">
                          <div className="text-sm text-[var(--muted)] mb-2">
                            No people found for "{personSearchQuery}"
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreatePersonForm(true);
                              setPersonSearchQuery('');
                              setPersonSearchResults([]);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Create new person
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create Person Form */}
            {showCreatePersonForm && (
              <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--panel-background)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--foreground)]">Create New Person</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreatePersonForm(false)}
                    className="text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreatePerson} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                        First Name *
                      </label>
                      <input
                        ref={firstNameInputRef}
                        type="text"
                        value={newPersonData.firstName}
                        onChange={(e) => setNewPersonData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1"
                        placeholder="First name"
                        required
                        disabled={isCreatingPerson}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newPersonData.lastName}
                        onChange={(e) => setNewPersonData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1"
                        placeholder="Last name"
                        required
                        disabled={isCreatingPerson}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPersonData.email}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1"
                      placeholder="email@example.com"
                      disabled={isCreatingPerson}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={newPersonData.jobTitle}
                      onChange={(e) => setNewPersonData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1"
                      placeholder="Job title"
                      disabled={isCreatingPerson}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreatePersonForm(false)}
                      className="flex-1 px-3 py-1.5 text-xs text-[var(--muted)] bg-[var(--background)] border border-[var(--border)] rounded hover:bg-[var(--panel-background)] transition-colors"
                      disabled={isCreatingPerson}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingPerson || !newPersonData.firstName.trim() || !newPersonData.lastName.trim()}
                      className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingPerson ? 'Creating...' : 'Create Person'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Company - Auto-filled if provided */}
            {formData.company && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Company
                </label>
                <div 
                  className="px-3 py-2 border rounded-lg text-[var(--foreground)] text-sm"
                  style={{ 
                    backgroundColor: categoryColors.bg,
                    borderColor: categoryColors.border
                  }}
                >
                  {formData.company}
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActionLogData['type'] }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 bg-[var(--background)] text-[var(--foreground)] text-sm shadow-sm hover:border-gray-400 transition-colors"
                style={{
                  '--tw-ring-color': `${categoryColors.primary}30`,
                  '--tw-border-color': categoryColors.primary
                } as React.CSSProperties}
                disabled={isLoading}
              >
                <option value="LinkedIn Connection">1. LinkedIn Connection</option>
                <option value="LinkedIn InMail">2. LinkedIn InMail</option>
                <option value="LinkedIn Message">3. LinkedIn Message</option>
                <option value="Phone">4. Phone</option>
                <option value="Email">5. Email</option>
              </select>
              <p className="text-xs text-[var(--muted)] mt-1">
                Press 1-5 to select, press same number to cycle through options
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Notes
              </label>
              <textarea
                ref={notesRef}
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] resize-none text-sm"
                style={{
                  '--tw-ring-color': categoryColors.primary
                } as React.CSSProperties}
                placeholder="Describe what happened during this interaction..."
                disabled={isLoading}
                required
              />
            </div>

            {/* Action Performed By - Hidden but still tracked */}
            <input
              type="hidden"
              value={formData.actionPerformedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, actionPerformedBy: e.target.value }))}
            />

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.person.trim() || !formData.action.trim()}
                className="flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: formData.action.trim() && formData.person.trim() && !isLoading 
                    ? categoryColors.bgHover 
                    : categoryColors.bg,
                  color: categoryColors.primary,
                  borderColor: categoryColors.border
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && formData.person.trim() && formData.action.trim()) {
                    e.currentTarget.style.backgroundColor = categoryColors.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = formData.action.trim() && formData.person.trim()
                      ? categoryColors.bgHover 
                      : categoryColors.bg;
                  }
                }}
                title={`Add action (${getCommonShortcut('SUBMIT')})`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  initialData ? `Resubmit (${getCommonShortcut('SUBMIT')})` : `Add Action (${getCommonShortcut('SUBMIT')})`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
