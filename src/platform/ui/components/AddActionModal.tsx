"use client";

import React, { useState, useEffect } from 'react';
import { Kbd, formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { authFetch } from '@/platform/api-fetch';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  isLoading?: boolean;
  contextRecord?: any; // The record from which the action is being added
  section?: string; // The section type to determine color scheme
}

export interface ActionLogData {
  person: string;
  personId?: string;
  company?: string;
  companyId?: string;
  type: 'LinkedIn Friend Request' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email' | 'Meeting' | 'Other';
  time: 'Now' | 'Past' | 'Future';
  action: string;
  nextAction?: string;
  nextActionDate?: string;
  actionPerformedBy?: string;
}

export function AddActionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  contextRecord,
  section = 'speedrun'
}: AddActionModalProps) {
  const [formData, setFormData] = useState<ActionLogData>({
    person: contextRecord?.name || contextRecord?.fullName || '',
    personId: contextRecord?.id || '',
    company: contextRecord?.company?.name || contextRecord?.company || '',
    companyId: contextRecord?.company?.id || '',
    type: 'LinkedIn Friend Request',
    time: 'Now',
    action: '',
    actionPerformedBy: ''
  });

  // Search functionality
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [personSearchResults, setPersonSearchResults] = useState<any[]>([]);
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        person: contextRecord?.name || contextRecord?.fullName || '',
        personId: contextRecord?.id || '',
        company: contextRecord?.company?.name || contextRecord?.company || '',
        companyId: contextRecord?.company?.id || '',
        type: 'LinkedIn Friend Request',
        time: 'Now',
        action: '',
        actionPerformedBy: ''
      });
      setPersonSearchQuery('');
      setCompanySearchQuery('');
      setPersonSearchResults([]);
      setCompanySearchResults([]);
    }
  }, [isOpen, contextRecord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.action.trim()) {
      alert('Please enter action details');
      return;
    }
    if (!formData.person.trim()) {
      alert('Please select a person');
      return;
    }
    onSubmit(formData);
  };

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
  }, [isOpen, formData, onClose]);

  // Search people as user types
  useEffect(() => {
    if (personSearchQuery.length >= 2) {
      searchPeople(personSearchQuery);
    } else {
      setPersonSearchResults([]);
    }
  }, [personSearchQuery]);

  // Search companies as user types
  useEffect(() => {
    if (companySearchQuery.length >= 2) {
      searchCompanies(companySearchQuery);
    } else {
      setCompanySearchResults([]);
    }
  }, [companySearchQuery]);

  const searchPeople = async (query: string) => {
    setIsSearchingPeople(true);
    try {
      const response = await authFetch(`/api/data/search?q=${encodeURIComponent(query)}&type=people`);
      if (response.ok) {
        const data = await response.json();
        setPersonSearchResults(data.people || []);
      }
    } catch (error) {
      console.error('Error searching people:', error);
    } finally {
      setIsSearchingPeople(false);
    }
  };

  const searchCompanies = async (query: string) => {
    setIsSearchingCompanies(true);
    try {
      const response = await authFetch(`/api/data/search?q=${encodeURIComponent(query)}&type=companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanySearchResults(data.companies || []);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setIsSearchingCompanies(false);
    }
  };

  const handlePersonSelect = (person: any) => {
    setFormData(prev => ({
      ...prev,
      person: person.name || person.fullName,
      personId: person.id
    }));
    setPersonSearchQuery('');
    setPersonSearchResults([]);
  };

  const handleCompanySelect = (company: any) => {
    setFormData(prev => ({
      ...prev,
      company: company.name,
      companyId: company.id
    }));
    setCompanySearchQuery('');
    setCompanySearchResults([]);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${section === 'speedrun' ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${section === 'speedrun' ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Action</h2>
              <p className="text-sm text-gray-600">Log an action for a person or company</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Person Search */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Person *
            </label>
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={personSearchQuery}
                  onChange={(e) => setPersonSearchQuery(e.target.value)}
                  placeholder="Search for person..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                />
              </div>

              {/* Person Search Results */}
              {personSearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {personSearchResults.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{person.name || person.fullName}</div>
                      {person.title && (
                        <div className="text-sm text-gray-500">{person.title}</div>
                      )}
                      {person.company && (
                        <div className="text-sm text-gray-500">{person.company}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Person Display */}
            {formData.person && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{formData.person}</div>
                {formData.personId && (
                  <div className="text-sm text-gray-500">ID: {formData.personId}</div>
                )}
              </div>
            )}
          </div>

          {/* Company Search */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Company
            </label>
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  placeholder="Search for company..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                />
              </div>

              {/* Company Search Results */}
              {companySearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {companySearchResults.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{company.name}</div>
                      {company.website && (
                        <div className="text-sm text-gray-500">{company.website}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Company Display */}
            {formData.company && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{formData.company}</div>
                {formData.companyId && (
                  <div className="text-sm text-gray-500">ID: {formData.companyId}</div>
                )}
              </div>
            )}
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Action Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
            >
              <option value="LinkedIn Friend Request">LinkedIn Friend Request</option>
              <option value="LinkedIn InMail">LinkedIn InMail</option>
              <option value="LinkedIn DM">LinkedIn DM</option>
              <option value="Phone">Phone Call</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* When */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              When
            </label>
            <select
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
            >
              <option value="Now">Now</option>
              <option value="Past">Past</option>
              <option value="Future">Future</option>
            </select>
          </div>

          {/* Action Details */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Action Details *
            </label>
            <textarea
              value={formData.action}
              onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
              placeholder="Describe what happened or what you plan to do..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
              required
            />
          </div>

          {/* Next Action */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Next Action
            </label>
            <input
              type="text"
              value={formData.nextAction || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
              placeholder="What's the next step?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
            />
          </div>

          {/* Next Action Date */}
          {formData.nextAction && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Next Action Date
              </label>
              <input
                type="date"
                value={formData.nextActionDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nextActionDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.action.trim() || !formData.person.trim() || isLoading}
              className={`flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm ${
                formData.action.trim() && formData.person.trim() && !isLoading
                  ? section === 'speedrun' 
                    ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Adding...' : `Add Action (${getCommonShortcut('SUBMIT')})`}
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-xs text-gray-500 text-center">
            Press <Kbd variant="default" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd> to submit quickly
          </div>
        </form>
      </div>
    </div>
  );
}
