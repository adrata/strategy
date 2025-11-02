"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';
import { StateSelector } from '@/frontend/components/pipeline/StateSelector';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { USState } from '@/platform/constants/us-states';

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProspectAdded: (prospect: any) => void;
  section?: string;
}

export function AddProspectModal({ isOpen, onClose, onProspectAdded, section = 'prospects' }: AddProspectModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  
  // Get workspace context to check if this is Notary Everyday
  const { workspace } = usePipeline();
  const isNotaryEveryday = workspace?.slug === 'ne' || workspace?.name?.includes('Notary Everyday');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'person' | 'company'>('company');
  
  // 🔍 DEBUG: Log when modal receives isOpen prop changes
  useEffect(() => {
    console.log('🔍 [AddProspectModal] isOpen prop changed:', {
      isOpen,
      section,
      colors,
      activeTab,
      timestamp: new Date().toISOString()
    });
  }, [isOpen, section, colors, activeTab]);

  // Person form data
  const [personFormData, setPersonFormData] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    linkedin: "",
    selectedCompany: null as any,
    state: null as USState | null,
    notes: "",
    status: "PROSPECT" as "LEAD" | "PROSPECT" | "OPPORTUNITY" | "CLIENT" | "PARTNER" | "SUPERFAN"
  });

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    website: "",
    linkedin: "",
    notes: "",
    state: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const companyNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus appropriate input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        if (activeTab === 'person' && firstNameInputRef.current) {
          firstNameInputRef.current?.focus();
        } else if (activeTab === 'company' && companyNameInputRef.current) {
          companyNameInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Keyboard shortcut for Ctrl+Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // Check if we're in an input field or textarea
        const target = event.target as HTMLElement;
        const isInputField =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true";

        // If we're in an input field, prevent default and trigger form submission
        if (isInputField) {
          event.preventDefault();
          event.stopPropagation();
          
          // Validate form based on active tab and submit if valid
          const isValidPerson = activeTab === 'person' && personFormData.firstName.trim() && personFormData.lastName.trim();
          const isValidCompany = activeTab === 'company' && companyFormData.name.trim();
          
          if ((isValidPerson || isValidCompany) && !isLoading) {
            const form = document.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }
          return;
        }

        // If not in input field, also trigger form submission
        event.preventDefault();
        event.stopPropagation();
        
        // Validate form based on active tab and submit if valid
        const isValidPerson = activeTab === 'person' && personFormData.firstName.trim() && personFormData.lastName.trim();
        const isValidCompany = activeTab === 'company' && companyFormData.name.trim();
        
        if ((isValidPerson || isValidCompany) && !isLoading) {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, personFormData.firstName, personFormData.lastName, companyFormData.name, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === 'person') {
        // Create person prospect
        const fullName = `${personFormData.firstName} ${personFormData.lastName}`.trim();
        
        const prospectData = {
          firstName: personFormData.firstName,
          lastName: personFormData.lastName,
          jobTitle: personFormData.jobTitle,
          linkedin: personFormData.linkedin,
          notes: personFormData.notes,
          companyId: personFormData.selectedCompany?.id,
          state: personFormData.state,
          fullName,
          status: "PROSPECT", // Lock in as PROSPECT
          source: "Manual Entry"
        };

        console.log('Creating person prospect with data:', prospectData);

        // Call the v1 API to create the person prospect
        const result = await authFetch('/api/v1/people', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prospectData)
        }, { success: false, error: 'Failed to create prospect' });

        console.log('Person prospect creation response:', result);
        
        if (result.success && result.data) {
          console.log('✅ [AddProspectModal] Person prospect created successfully');
          
          // Reset person form
          setPersonFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            jobTitle: "",
            selectedCompany: null,
            state: null,
            notes: "",
            status: "PROSPECT"
          });
          
          // Dispatch refresh events
          window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
            detail: { 
              section: 'prospects',
              type: 'record-created',
              recordId: result.data.id 
            }
          }));
          
          window.dispatchEvent(new CustomEvent('refresh-counts', {
            detail: { 
              section: 'prospects',
              type: 'record-created'
            }
          }));
          
          onProspectAdded(result.data);
        } else {
          throw new Error(result.error || 'Failed to create person prospect');
        }
      } else {
        // Create company prospect
        const companyData = {
          name: companyFormData.name,
          website: companyFormData.website,
          notes: companyFormData.notes,
          state: companyFormData.state,
          status: "PROSPECT", // Lock in as PROSPECT
          source: "Manual Entry"
        };

        console.log('Creating company prospect with data:', companyData);

        // Call the v1 API to create the company prospect
        const result = await authFetch('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(companyData)
        }, { success: false, error: 'Failed to create company prospect' });

        console.log('Company prospect creation response:', result);
        
        if (result.success && result.data) {
          console.log('✅ [AddProspectModal] Company prospect created successfully');
          
          // Reset company form
          setCompanyFormData({
            name: "",
            website: "",
            notes: "",
            state: ""
          });
          
          // Dispatch refresh events
          window.dispatchEvent(new CustomEvent('pipeline-data-refresh', {
            detail: { 
              section: 'prospects',
              type: 'record-created',
              recordId: result.data.id 
            }
          }));
          
          window.dispatchEvent(new CustomEvent('refresh-counts', {
            detail: { 
              section: 'prospects',
              type: 'record-created'
            }
          }));
          
          onProspectAdded(result.data);
        } else {
          throw new Error(result.error || 'Failed to create company prospect');
        }
      }
    } catch (error) {
      console.error('Error creating prospect:', error);
      // Show a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create prospect. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🔍 [AddProspectModal] Modal not open, returning null');
    return null;
  }

  console.log('🔍 [AddProspectModal] Modal is open, rendering modal content');

  return (
    <>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {activeTab === 'person' ? 'Add New Person Prospect' : 'Add New Company Prospect'}
              </h2>
              <p className="text-sm text-muted">Create a new prospect contact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Start Header */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {activeTab === 'person' ? 'Person Details' : 'Company Details'}
            </h3>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-panel-background rounded-lg p-1 -mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'company'
                  ? 'text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-hover'
              }`}
              style={{
                backgroundColor: activeTab === 'company' ? colors.primary : 'transparent'
              }}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('person')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'person'
                  ? 'text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-hover'
              }`}
              style={{
                backgroundColor: activeTab === 'person' ? colors.primary : 'transparent'
              }}
            >
              Person
            </button>
          </div>

          {/* Status Badge - Section-specific colors */}
          <div 
            className="flex items-center gap-2 p-3 rounded-lg border"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              Status: {activeTab === 'person' ? personFormData.status : 'Company'}
            </span>
          </div>

          {/* Person Form */}
          {activeTab === 'person' && (
            <>
              {/* Name Fields - Split like person form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    ref={firstNameInputRef}
                    type="text"
                    value={personFormData.firstName}
                    onChange={(e) => setPersonFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                    style={{
                      '--tw-ring-color': `${colors.primary}30`,
                      '--tw-border-color': colors.primary
                    } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={personFormData.lastName}
                    onChange={(e) => setPersonFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={personFormData.email}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={personFormData.phone}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={personFormData.jobTitle}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="Enter job title"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={personFormData.linkedin}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/example"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <CompanySelector
                  value={personFormData.selectedCompany}
                  onChange={(company) => {
                    console.log('🏢 [AddProspectModal] Company selected/changed:', company);
                    setPersonFormData(prev => ({ 
                      ...prev, 
                      selectedCompany: company 
                    }));
                  }}
                  placeholder="Search or select company"
                />
              </div>

              {/* State field - only for Notary Everyday workspace */}
              {isNotaryEveryday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <StateSelector
                    value={personFormData.state}
                    onChange={(state) => setPersonFormData(prev => ({ ...prev, state }))}
                    placeholder="Select state"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={personFormData.notes}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this person"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
              </div>
            </>
          )}

          {/* Company Form */}
          {activeTab === 'company' && (
            <>
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  ref={companyNameInputRef}
                  type="text"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                  style={{
                    '--tw-ring-color': `${colors.primary}30`,
                    '--tw-border-color': colors.primary
                  } as React.CSSProperties}
                  required
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={companyFormData.linkedin}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="linkedin.com/company/example"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={companyFormData.website}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              {/* State field - only for Notary Everyday workspace */}
              {isNotaryEveryday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={companyFormData.state}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., California, TX"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={companyFormData.notes}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this company"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-gray-700 rounded-lg hover:bg-panel-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || 
                (activeTab === 'person' && (!personFormData.firstName || !personFormData.lastName)) ||
                (activeTab === 'company' && !companyFormData.name)
              }
              className="flex-1 px-4 py-2 border rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: (() => {
                  if (isLoading) return colors.bg;
                  if (activeTab === 'person') {
                    return personFormData.firstName.trim() && personFormData.lastName.trim() ? colors.bgHover : colors.bg;
                  } else {
                    return companyFormData.name.trim() ? colors.bgHover : colors.bg;
                  }
                })(),
                color: colors.primary,
                borderColor: colors.border
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  const isValid = activeTab === 'person' 
                    ? personFormData.firstName.trim() && personFormData.lastName.trim()
                    : companyFormData.name.trim();
                  if (isValid) {
                    e.currentTarget.style.backgroundColor = colors.bgHover;
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  const isValid = activeTab === 'person' 
                    ? personFormData.firstName.trim() && personFormData.lastName.trim()
                    : companyFormData.name.trim();
                  e.currentTarget.style.backgroundColor = isValid ? colors.bgHover : colors.bg;
                }
              }}
            >
              {isLoading ? 'Creating...' : `Complete (${getCommonShortcut('SUBMIT')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
