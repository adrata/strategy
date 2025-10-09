"use client";

/**
 * 🎯 ADD ACTION MODAL
 * 
 * Modal for logging actions on pipeline records
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { useUnifiedAuth } from '@/platform/auth-unified';

export interface ActionLogData {
  actionType: string;
  meetingType?: string;
  customActionType?: string;
  actionDate: string;
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
  actionPerformedBy?: string;
  personId?: string;
}

export interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  record: any;
  recordType: string;
  isLoading?: boolean;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  jobTitle?: string;
  company?: string;
}

interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
}

export function AddActionModal({
  isOpen,
  onClose,
  onSubmit,
  record,
  recordType,
  isLoading = false
}: AddActionModalProps) {
  const { users, currentUser, loading, error } = useWorkspaceUsers();
  const { user: authUser } = useUnifiedAuth();
  
  // State for contact selection
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  
  // State for account selection
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [accountSearchResults, setAccountSearchResults] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isSearchingAccounts, setIsSearchingAccounts] = useState(false);
  const [accountContacts, setAccountContacts] = useState<Contact[]>([]);
  const [isLoadingAccountContacts, setIsLoadingAccountContacts] = useState(false);
  
  // Determine default user based on workspace
  const getDefaultUserId = () => {
    if (!authUser?.activeWorkspaceId || !users.length) return currentUser?.id || '';
    
    // Check if current workspace is RPS
    const isRPSWorkspace = authUser.workspaces?.some(w => 
      w['id'] === authUser['activeWorkspaceId'] && w['name'] === 'Retail Product Solutions'
    );
    
    if (isRPSWorkspace) {
      // For RPS, default to Derek even if Dano did it
      const derekUser = users.find(u => 
        u.name?.toLowerCase().includes('derek') || 
        u.email?.toLowerCase().includes('derek')
      );
      return derekUser?.id || currentUser?.id || '';
    }
    
    // For other workspaces, default to current user (dano)
    return currentUser?.id || '';
  };
  
  const [formData, setFormData] = useState<ActionLogData>({
    actionType: 'linkedin_inmail',
    meetingType: '',
    customActionType: '',
    actionDate: new Date().toISOString().slice(0, 16), // Default to now
    notes: '',
    nextAction: '',
    nextActionDate: new Date().toISOString().slice(0, 16), // Default to now
    actionPerformedBy: '' // Start empty, will be set when users load
  });

  // State for time category selection
  const [timeCategory, setTimeCategory] = useState<'now' | 'future' | 'past'>('now');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Search contacts
  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setContactSearchResults([]);
      return;
    }
    
    setIsSearchingContacts(true);
    try {
      const response = await fetch('/api/data/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: authUser?.activeWorkspaceId || '',
          category: 'contacts',
          query: query,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setContactSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setIsSearchingContacts(false);
    }
  };

  // Search accounts
  const searchAccounts = async (query: string) => {
    if (query.length < 2) {
      setAccountSearchResults([]);
      return;
    }
    
    setIsSearchingAccounts(true);
    try {
      const response = await fetch('/api/data/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: authUser?.activeWorkspaceId || '',
          category: 'accounts',
          query: query,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccountSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching accounts:', error);
    } finally {
      setIsSearchingAccounts(false);
    }
  };

  // Load contacts for selected account
  const loadAccountContacts = async (companyId: string) => {
    setIsLoadingAccountContacts(true);
    try {
      const response = await fetch('/api/data/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: authUser?.activeWorkspaceId || '',
          category: 'company-contacts',
          query: companyId,
          limit: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccountContacts(data.results || []);
      }
    } catch (error) {
      console.error('Error loading account contacts:', error);
      setAccountContacts([]);
    } finally {
      setIsLoadingAccountContacts(false);
    }
  };

  // Handle contact search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (contactSearchQuery) {
        searchContacts(contactSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [contactSearchQuery]);

  // Handle account search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (accountSearchQuery) {
        searchAccounts(accountSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [accountSearchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes.trim()) return;
    
    // Contact selection is required
    if (!selectedContact && !record) {
      alert('Please select a person to associate this action with.');
      return;
    }
    
    // Meeting type is required when Meeting is selected
    if (formData['actionType'] === 'meeting' && !formData.meetingType) {
      alert('Please select a meeting type.');
      return;
    }
    
    // Custom action type is required when Other is selected
    if (formData['actionType'] === 'other' && !formData.customActionType?.trim()) {
      alert('Please enter a custom action type.');
      return;
    }
    
    // If we have a selected contact, include it in the action data
    if (selectedContact) {
      formData['personId'] = selectedContact.id;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field: keyof ActionLogData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearchQuery('');
    setContactSearchResults([]);
  };

  const clearSelectedContact = () => {
    setSelectedContact(null);
    setFormData(prev => ({ ...prev, personId: undefined }));
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setAccountSearchQuery('');
    setAccountSearchResults([]);
    loadAccountContacts(account.id);
  };

  const clearSelectedAccount = () => {
    setSelectedAccount(null);
    setAccountContacts([]);
    setSelectedContact(null);
    setFormData(prev => ({ ...prev, personId: undefined }));
  };

  const handleAccountContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Update default user when modal opens or workspace changes
  useEffect(() => {
    if (isOpen && users.length > 0) {
      const defaultUserId = getDefaultUserId();
      console.log('🔍 [AddActionModal] Setting default user:', {
        defaultUserId,
        usersCount: users.length,
        currentUser: currentUser?.name,
        workspaceId: authUser?.activeWorkspaceId,
        workspaceName: authUser?.workspaces?.find(w => w['id'] === authUser?.activeWorkspaceId)?.name
      });
      
      setFormData(prev => ({
        ...prev,
        actionPerformedBy: defaultUserId
      }));
      
      // If we have a record, pre-select the contact
      if (record) {
        if (record.id) {
          setFormData(prev => ({ ...prev, personId: record.id }));
        }
      }
    } else if (isOpen) {
      console.log('🔍 [AddActionModal] Modal open but users not loaded yet:', {
        usersCount: users.length,
        loading: loading,
        workspaceId: authUser?.activeWorkspaceId
      });
    }
  }, [isOpen, loading, authUser?.activeWorkspaceId, users, record]);

  // Keyboard shortcuts for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleSubmit();
      }
      
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, false);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isOpen, handleSubmit, onClose]);

  const actionTypes = [
    { value: 'linkedin_inmail', label: 'LinkedIn InMail' },
    { value: 'linkedin_dm', label: 'LinkedIn Direct Message' },
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'add_prospect', label: 'Add Prospect' },
    { value: 'other', label: 'Other' }
  ];

  const meetingTypes = [
    { value: 'discovery_call', label: 'Discovery Call' },
    { value: 'demo', label: 'Demo' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closing', label: 'Closing' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'check_in', label: 'Check In' },
    { value: 'technical_review', label: 'Technical Review' },
    { value: 'stakeholder_meeting', label: 'Stakeholder Meeting' },
    { value: 'other', label: 'Other' }
  ];

  if (!isOpen) return null;

  const displayName = record?.fullName || 
                     (record?.firstName && record?.lastName ? `${record.firstName} ${record.lastName}` : '') ||
                     record?.name || 
                     'Unknown Contact';

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add Action
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {record ? `Log an action for ${displayName}` : 'Log an action for a contact'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Date *
            </label>
            
            {/* Primary Time Selection */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, actionDate: new Date().toISOString().slice(0, 16) }));
                  setTimeCategory('now');
                  setShowCustomDate(false);
                }}
                className={`px-4 py-2 text-sm rounded-md border ${
                  timeCategory === 'now'
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeCategory('future');
                  setShowCustomDate(false);
                }}
                className={`px-4 py-2 text-sm rounded-md border ${
                  timeCategory === 'future'
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Future
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeCategory('past');
                  setShowCustomDate(false);
                }}
                className={`px-4 py-2 text-sm rounded-md border ${
                  timeCategory === 'past'
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Past
              </button>
            </div>

            {/* Secondary Time Selection */}
            {timeCategory === 'future' && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const laterToday = new Date();
                    laterToday.setHours(17, 0, 0, 0); // 5 PM today
                    setFormData(prev => ({ ...prev, actionDate: laterToday.toISOString().slice(0, 16) }));
                  }}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Later Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
                    setFormData(prev => ({ ...prev, actionDate: tomorrow.toISOString().slice(0, 16) }));
                  }}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomDate(true)}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Custom
                </button>
              </div>
            )}

            {timeCategory === 'past' && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const earlierToday = new Date();
                    earlierToday.setHours(9, 0, 0, 0); // 9 AM today
                    setFormData(prev => ({ ...prev, actionDate: earlierToday.toISOString().slice(0, 16) }));
                  }}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Earlier Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    yesterday.setHours(14, 0, 0, 0); // 2 PM yesterday
                    setFormData(prev => ({ ...prev, actionDate: yesterday.toISOString().slice(0, 16) }));
                  }}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomDate(true)}
                  className="px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Custom
                </button>
              </div>
            )}

            {/* Custom Date Input */}
            {(showCustomDate || timeCategory === 'now') && (
              <input
                type="datetime-local"
                value={formData.actionDate}
                onChange={(e) => handleChange('actionDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
          </div>

          {/* Action Performed By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Performed By *
            </label>
            <select
              value={formData.actionPerformedBy}
              onChange={(e) => handleChange('actionPerformedBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              {loading ? (
                <option value="">Loading users...</option>
              ) : error ? (
                <option value="">Error loading users</option>
              ) : users['length'] === 0 ? (
                <option value="">No users found in workspace</option>
              ) : (
                <>
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user['id'] === currentUser?.id ? `Me (${currentUser?.name || currentUser?.email || 'Current User'})` : (user.name || user.email || 'Unknown User')}
                    </option>
                  ))}
                </>
              )}
            </select>
            {error && (
              <p className="text-sm text-red-600 mt-1">
                Failed to load users: {error}
              </p>
            )}
            {users['length'] === 0 && !loading && !error && (
              <p className="text-sm text-yellow-600 mt-1">
                No users found in current workspace
              </p>
            )}
            {loading && (
              <p className="text-sm text-blue-600 mt-1">
                Loading users from workspace...
              </p>
            )}
          </div>

          {/* Contact Selection - Required if no record is provided */}
          {!record && (
            <div className="space-y-4">
              {/* Account Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    placeholder="Search for a company..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  
                  {/* Account Search Results */}
                  {accountSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {accountSearchResults.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleAccountSelect(account)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{account.name}</div>
                          <div className="text-sm text-gray-600">{account.industry}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {isSearchingAccounts && (
                    <div className="text-center py-2 text-gray-500">
                      Searching...
                    </div>
                  )}
                </div>
                
                {/* Selected Account */}
                {selectedAccount && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">{selectedAccount.name}</div>
                        <div className="text-sm text-green-700">{selectedAccount.industry}</div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedAccount}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person *
                </label>
                
                {/* If account is selected, show account contacts dropdown */}
                {selectedAccount ? (
                  <div>
                    <select
                      value={selectedContact?.id || ''}
                      onChange={(e) => {
                        const contact = accountContacts.find(c => c['id'] === e.target.value);
                        if (contact) handleAccountContactSelect(contact);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a person from {selectedAccount.name}...</option>
                      {accountContacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'} - {contact.jobTitle}
                        </option>
                      ))}
                    </select>
                    {isLoadingAccountContacts && (
                      <p className="text-sm text-blue-600 mt-1">Loading people...</p>
                    )}
                    {accountContacts['length'] === 0 && !isLoadingAccountContacts && (
                      <p className="text-sm text-gray-500 mt-1">No people found for this company</p>
                    )}
                  </div>
                ) : (
                  /* Direct contact search */
                  <div className="relative">
                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search for a person..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    
                    {/* Person Search Results */}
                    {contactSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {contactSearchResults.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => handleContactSelect(contact)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {contact.jobTitle} {contact.company ? `at ${contact.company}` : ''}
                            </div>
                            <div className="text-xs text-gray-400">{contact.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {isSearchingContacts && (
                      <div className="text-center py-2 text-gray-500">
                        Searching...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Person */}
                {selectedContact && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedContact.fullName || `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim() || 'Unnamed Contact'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedContact.jobTitle} {selectedContact.company ? `at ${selectedContact.company}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedContact}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type *
            </label>
            <select
              value={formData.actionType}
              onChange={(e) => handleChange('actionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Type - Show when Meeting is selected */}
          {formData['actionType'] === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type *
              </label>
              <select
                value={formData.meetingType || ''}
                onChange={(e) => handleChange('meetingType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select meeting type...</option>
                {meetingTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Action Type - Show when Other is selected */}
          {formData['actionType'] === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Action Type *
              </label>
              <input
                type="text"
                value={formData.customActionType || ''}
                onChange={(e) => handleChange('customActionType', e.target.value)}
                placeholder="Enter the action type..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Notes *
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Describe what happened in this interaction..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>


          {/* Next Action Date removed - populated automatically per user request */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || 
                !formData.notes.trim() || 
                (!selectedContact && !record) ||
                (formData['actionType'] === 'meeting' && !formData.meetingType) ||
                (formData['actionType'] === 'other' && !formData.customActionType?.trim())
              }
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Log Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
