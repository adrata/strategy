"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from '@/platform/api-fetch';
import { XMarkIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { Select } from "./Select";
import { AddCompanyModal } from "./AddCompanyModal";
import { AddLeadModal } from "./AddLeadModal";
import { AddProspectModal } from "./AddProspectModal";
import { DEFAULT_FORM_DATA } from "@/platform/config";
import { SuccessMessage } from "./SuccessMessage";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { getCategoryColors } from '@/platform/config/color-palette';

interface AddModalProps {
  refreshData?: () => Promise<void>;
}

export function AddModal({ refreshData }: AddModalProps = {}) {
  const {
    ui: { isAddModalOpen, setIsAddModalOpen, activeSection, activeWorkspace },
    forms: { formData, setFormData, handleCreateRecord },
    data: { acquireData },
    auth: { authUser },
  } = useAcquisitionOS();

  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Contact search functionality for clients
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);

  // Company search functionality for leads
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  
  // Add Company modal form state
  const [addCompanyFormData, setAddCompanyFormData] = useState({
    name: '',
    website: ''
  });

  // Reset form data when modal opens - start with empty form
  useEffect(() => {
    if (isAddModalOpen) {
      setFormData(DEFAULT_FORM_DATA);
      // Reset contact search state
      setContactSearchQuery('');
      setContactSearchResults([]);
      setSelectedContacts([]);
      // Reset company search state
      setCompanySearchQuery('');
      setCompanySearchResults([]);
      setSelectedCompany(null);
      // Auto-focus the first input field without selecting text
      setTimeout(() => {
        const firstInput = document.querySelector('input[type="text"]:not([readonly]):not([disabled])') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
          // Remove the select() call to prevent text selection that might cause black border
        }
      }, 200); // Slightly longer delay for better reliability
    }
  }, [isAddModalOpen, setFormData]);

  // Search contacts as user types
  useEffect(() => {
    if (contactSearchQuery.length >= 2 && activeSection === "clients") {
      searchContacts(contactSearchQuery);
    } else {
      setContactSearchResults([]);
    }
  }, [contactSearchQuery, activeSection]);

  // Search companies as user types
  useEffect(() => {
    if (companySearchQuery.length >= 2 && activeSection === "leads") {
      searchCompanies(companySearchQuery);
    } else {
      setCompanySearchResults([]);
    }
  }, [companySearchQuery, activeSection]);

  // Auto-focus when add company modal opens
  useEffect(() => {
    if (showAddCompanyModal) {
      setTimeout(() => {
        const companyNameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
        if (companyNameInput) {
          companyNameInput.focus();
        }
      }, 100);
    }
  }, [showAddCompanyModal]);

  // Keyboard shortcut for Add Company (⌘⏎) when Add Company modal is open
  useEffect(() => {
    if (!showAddCompanyModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        console.log('⌨️ [AddModal] Add Company keyboard shortcut detected');
        
        // Check if we're inside the Add Company modal
        const modal = document.querySelector('[data-modal="add-company"]')?.closest('.fixed.inset-0');
        console.log('⌨️ [AddModal] Add Company modal found:', !!modal);
        if (!modal) return; // Not in the Add Company modal
        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('⌨️ [AddModal] Add Company keyboard shortcut triggered');
        
        // Directly trigger the form submission instead of dispatching an event
        const addCompanyForm = document.querySelector('form[data-modal="add-company"]') as HTMLFormElement;
        console.log('⌨️ [AddModal] Add Company form found:', !!addCompanyForm);
        if (addCompanyForm) {
          // Check if form is valid before submitting
          const nameInput = addCompanyForm.querySelector('input[name="name"]') as HTMLInputElement;
          console.log('⌨️ [AddModal] Name input found:', !!nameInput, 'Value:', nameInput?.value);
          if (nameInput && nameInput.value.trim()) {
            console.log('⌨️ [AddModal] Submitting Add Company form via keyboard shortcut');
            addCompanyForm.requestSubmit();
          } else {
            console.log('⌨️ [AddModal] Add Company form not valid - name field is empty');
            nameInput?.focus();
          }
        } else {
          console.error('❌ [AddModal] Add Company form not found');
        }
      }
    };

    // Use capture phase to ensure we get the event before other handlers
    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showAddCompanyModal]);

  // Keyboard shortcut for main AddModal submit (⌘⏎) when modal is open
  useEffect(() => {
    if (!isAddModalOpen || showAddCompanyModal) return; // Don't interfere with Add Company modal

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        // Check if we're in an input field or textarea
        const target = event.target as HTMLElement;
        const isInputField =
          target['tagName'] === "INPUT" ||
          target['tagName'] === "TEXTAREA" ||
          target['contentEditable'] === "true";

        // If we're in an input field, allow the default behavior (form submission)
        if (isInputField) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('⌨️ [AddModal] Main submit keyboard shortcut triggered');
        
        // Validate form based on active section
        let isValid = false;
        let focusSelector = 'input[type="text"]:not([readonly]):not([disabled])';
        
        if (activeSection === 'leads' || activeSection === 'people') {
          // For people/leads, check firstName AND lastName
          isValid = !!(formData.firstName?.trim() && formData.lastName?.trim());
          if (!isValid) {
            console.log('⌨️ [AddModal] Form not valid - firstName or lastName is empty');
            // Focus the first empty required field
            if (!formData.firstName?.trim()) {
              focusSelector = 'input[placeholder*="first name" i]';
            } else if (!formData.lastName?.trim()) {
              focusSelector = 'input[placeholder*="last name" i]';
            }
          }
        } else {
          // For other sections, check name field
          isValid = !!formData.name?.trim();
          if (!isValid) {
            console.log('⌨️ [AddModal] Form not valid - name field is empty');
          }
        }
        
        if (isValid) {
          handleCreateRecord();
        } else {
          // Focus the appropriate input field
          const inputToFocus = document.querySelector(focusSelector) as HTMLInputElement;
          inputToFocus?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isAddModalOpen, showAddCompanyModal, formData.name, formData.firstName, formData.lastName, activeSection, handleCreateRecord]);

  const searchContacts = async (query: string) => {
    setIsSearchingContacts(true);
    try {
      const response = await authFetch(`/api/data/search`);
      
      if (response.ok) {
        const data = await response.json();
        setContactSearchResults(data.contacts || []);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setIsSearchingContacts(false);
    }
  };

  const handleContactSelect = (contact: any) => {
    // Check if contact is already selected
    if (!selectedContacts.find(c => c.id === contact.id)) {
      const newSelectedContacts = [...selectedContacts, contact];
      setSelectedContacts(newSelectedContacts);
      setFormData((prev: any) => ({
        ...prev,
        contactIds: newSelectedContacts.map(c => c.id)
      }));
    }
    setContactSearchQuery('');
    setContactSearchResults([]);
  };

  const handleContactRemove = (contactId: string) => {
    const newSelectedContacts = selectedContacts.filter(c => c.id !== contactId);
    setSelectedContacts(newSelectedContacts);
    setFormData((prev: any) => ({
      ...prev,
      contactIds: newSelectedContacts.map(c => c.id)
    }));
  };

  const searchCompanies = async (query: string) => {
    setIsSearchingCompanies(true);
    try {
      const workspaceId = activeWorkspace?.id || "";
      const userId = authUser?.id || "";
      
      console.log('🔍 [COMPANY SEARCH] Debug info:', {
        workspaceId,
        userId,
        query,
        activeWorkspace: activeWorkspace,
        authUser: authUser
      });
      
      const response = await authFetch(`/api/data/search`);
      
      if (response.ok) {
        const data = await response.json();
        setCompanySearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setIsSearchingCompanies(false);
    }
  };

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setFormData((prev: any) => ({
      ...prev,
      company: company.name
    }));
    setCompanySearchQuery('');
    setCompanySearchResults([]);
  };

  const handleCompanyRemove = () => {
    setSelectedCompany(null);
    setFormData((prev: any) => ({
      ...prev,
      company: ''
    }));
  };

  const handleAddCompany = () => {
    setShowAddCompanyModal(true);
    // Pre-populate the company name with the search query
    setAddCompanyFormData({
      name: companySearchQuery,
      website: ''
    });
    // Clear the company search query after pre-populating
    setCompanySearchQuery('');
    
    // Auto-focus the company name input in the add company modal
    setTimeout(() => {
      const companyNameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
      if (companyNameInput) {
        companyNameInput.focus();
      }
    }, 100);
  };

  // Normalize website URL to standard format
  const normalizeWebsite = (website: string): string => {
    if (!website || website.trim() === '') return '';
    
    let normalized = website.trim().toLowerCase();
    
    // Remove protocol if present
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Remove www. if present
    normalized = normalized.replace(/^www\./, '');
    
    // Add https:// protocol
    return `https://${normalized}`;
  };

  if (!isAddModalOpen) return null;

  const getSectionTitle = () => {
    switch (activeSection) {
      case "leads":
        return "Lead";
      case "prospects":
        return "Prospect";
      case "opportunities":
        return "Opportunity";
      case "partnerships":
      case "partners":
        return "Partner";
      case "people":
        return "Person";
      case "companies":
        return "Company";
      case "clients":
        return "Customer";
      case "speedrun":
        return "Speedrun Item";
      default:
        return "Record";
    }
  };

  // Get category colors for the current section
  const categoryColors = getCategoryColors(activeSection);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // DEBUG: Log the activeSection value to understand routing issue
    console.log(`[ADD MODAL] DEBUG: activeSection = "${activeSection}"`);
    console.log(`[ADD MODAL] DEBUG: formData =`, formData);

    // Validate based on section type
    if (activeSection === "leads" || activeSection === "people") {
      // For people/leads, check firstName and lastName
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        alert("Please enter first name and last name");
        return;
      }
    } else {
      // For other sections (companies, opportunities, etc.), check name
      if (!formData.name?.trim()) {
        alert("Please enter a name for the record");
        return;
      }
    }

    try {
      await handleCreateRecord(
        activeSection,
        "acquire", // activeSubApp
        (message: string) => {
          setSuccessMessage(message);
          setShowSuccessMessage(true);
          setIsAddModalOpen(false);
          setFormData(DEFAULT_FORM_DATA);
          // Auto-hide success message after 3 seconds
          setTimeout(() => setShowSuccessMessage(false), 3000);
        },
        (message: string) => {
          setSuccessMessage(`Error: ${message}`);
          setShowSuccessMessage(true);
          // Auto-hide error message after 5 seconds
          setTimeout(() => setShowSuccessMessage(false), 5000);
        },
        refreshData, // Pass the refresh callback
      );
    } catch (error) {
      console.error("Form submission error:", error);
      setSuccessMessage("Failed to create record. Please try again.");
      setShowSuccessMessage(true);
      // Auto-hide error message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };

  const handleClose = () => {
    setIsAddModalOpen(false);
    // Clear form data when closing
    setFormData(DEFAULT_FORM_DATA);
  };


  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: categoryColors.iconBg }}
            >
              {activeSection === "people" ? (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ) : activeSection === "companies" ? (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : activeSection === "leads" || activeSection === "prospects" ? (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : activeSection === "opportunities" ? (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ) : activeSection === "clients" ? (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: categoryColors.icon }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Add {getSectionTitle()}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Create a new {getSectionTitle().toLowerCase()} record
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Special handling for leads and prospects - show dedicated forms */}
        {(activeSection === "leads" || activeSection === "prospects") ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: categoryColors.light }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: categoryColors.icon }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add New {activeSection === "leads" ? "Lead" : "Prospect"}
              </h3>
              <p className="text-gray-600 mb-6">
                Create a new {activeSection === "leads" ? "lead" : "prospect"} with First Name and Last Name fields, 
                with status locked as {activeSection === "leads" ? "Lead" : "Prospect"}.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (activeSection === "leads") {
                    setShowAddLeadModal(true);
                  } else if (activeSection === "prospects") {
                    setShowAddProspectModal(true);
                  }
                }}
                className="px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{
                  backgroundColor: categoryColors.primary,
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = categoryColors.bgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = categoryColors.primary;
                }}
              >
                Open {activeSection === "leads" ? "Lead" : "Prospect"} Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field - First for people */}
            {activeSection === "people" ? (
            // Split name fields for people/leads
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="Enter first name"
                  className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                  onFocus={(e) => {
                    e.target.style.borderColor = categoryColors.primary;
                    e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Enter last name"
                  className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                  onFocus={(e) => {
                    e.target.style.borderColor = categoryColors.primary;
                    e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
          ) : (
            // Single name field for other sections
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                {activeSection === "opportunities" 
                  ? "Opportunity Name" 
                  : "Name"}{" "}
                *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, name: e.target.value }))
                }
                placeholder={
                  activeSection === "opportunities"
                    ? "Enter opportunity name"
                    : `Enter ${getSectionTitle().toLowerCase()} name`
                }
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                onFocus={(e) => {
                  e.target.style.borderColor = categoryColors.primary;
                  e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          )}

          {/* Status Field - Second for leads and people */}
          {(activeSection === "leads" || activeSection === "people") && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Status *
              </label>
              <Select
                value={formData.status || "LEAD"}
                onChange={(value) =>
                  setFormData((prev: any) => ({ ...prev, status: value }))
                }
                options={[
                  { value: "LEAD", label: "Lead" },
                  { value: "PROSPECT", label: "Prospect" },
                  { value: "OPPORTUNITY", label: "Opportunity" },
                  { value: "CLIENT", label: "Client" },
                  { value: "SUPERFAN", label: "Superfan" }
                ]}
                placeholder="Select status"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Press 1-5 to select, press same number to cycle through options
              </p>
            </div>
          )}

          {/* Company Field - Third for leads and people */}
          {(activeSection === "leads" || activeSection === "people") && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Company
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(true)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Add Company
                </button>
              </div>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    placeholder="Search for company"
                    className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                    onFocus={(e) => {
                      e.target.style.borderColor = categoryColors.primary;
                      e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Search Results */}
                {companySearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                    <div
                      onClick={handleAddCompany}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium border-t border-gray-200"
                    >
                      + Add New Company
                    </div>
                  </div>
                )}

                {/* No results message */}
                {companySearchQuery.length >= 2 && companySearchResults.length === 0 && !isSearchingCompanies && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-500 mb-2">No companies found</div>
                      <button
                        type="button"
                        onClick={handleAddCompany}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add "{companySearchQuery}" as new company
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {isSearchingCompanies && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-500">Searching companies...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Company */}
              {selectedCompany && (
                <div className="mt-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium text-gray-900">{selectedCompany.name}</div>
                      {selectedCompany.website && (
                        <div className="text-sm text-gray-500">{selectedCompany.website}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCompanyRemove}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company/Account Field - Legacy field removed, using new Company field above */}


          {/* Opportunity-specific fields */}
          {activeSection === "opportunities" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Deal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="Enter deal amount"
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
                  />
                </div>

                {/* Probability */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Win Probability (%)
                  </label>
                  <select
                    value={formData.probability || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        probability: e.target.value,
                      }))
                    }
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                  >
                    <option value="">Select probability</option>
                    <option value="10">10% - Early stage</option>
                    <option value="25">25% - Discovery</option>
                    <option value="50">50% - Qualified interest</option>
                    <option value="75">75% - Strong fit</option>
                    <option value="90">90% - Near close</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Current Stage
                  </label>
                  <select
                    value={formData.stage || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        stage: e.target.value,
                      }))
                    }
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                  >
                    <option value="">Select stage</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Solution Validation">
                      Solution Validation
                    </option>
                    <option value="Stakeholder Alignment">
                      Stakeholder Alignment
                    </option>
                    <option value="Business Case Development">
                      Business Case Development
                    </option>
                    <option value="Technical Validation">
                      Technical Validation
                    </option>
                    <option value="Contract Negotiation">
                      Contract Negotiation
                    </option>
                  </select>
                </div>

                {/* Expected Close Date */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formData.closeDate || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        closeDate: e.target.value,
                      }))
                    }
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

            </>
          )}

          {/* Partnership-specific fields */}
          {activeSection === "partnerships" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Partner Type */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Partner Type
                  </label>
                  <select
                    value={formData.partnerType || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        partnerType: e.target.value,
                      }))
                    }
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                  >
                    <option value="">Select partner type</option>
                    <option value="VC">VC - Venture Capital</option>
                    <option value="Agency">Agency</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Referral Partner">Referral Partner</option>
                    <option value="System Integrator">System Integrator</option>
                  </select>
                </div>

                {/* Relationship Status */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Relationship Status
                  </label>
                  <select
                    value={formData.relationshipStatus || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        relationshipStatus: e.target.value,
                      }))
                    }
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                  >
                    <option value="">Select relationship status</option>
                    <option value="Active">Active</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Contact Person */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    placeholder="Contact person name"
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Contact Title
                  </label>
                  <input
                    type="text"
                    value={formData.contactTitle || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        contactTitle: e.target.value,
                      }))
                    }
                    placeholder="e.g., Partner, VP"
                    className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Account-specific fields */}
          {activeSection === "accounts" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, website: e.target.value }))
                }
                placeholder="Enter company website"
                className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Account-specific fields */}
          {activeSection === "accounts" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, industry: e.target.value }))
                }
                placeholder="Enter industry"
                className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Customer-specific fields */}
          {activeSection === "clients" && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Contract Value
                    </label>
                    <input
                      type="number"
                      value={formData.contractValue || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({ ...prev, contractValue: e.target.value }))
                      }
                      placeholder="Enter contract value"
                      className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      value={formData.renewalDate || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({ ...prev, renewalDate: e.target.value }))
                      }
                      className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Contact Search */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Contacts (Optional)
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input
                        type="text"
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                        placeholder="Search contacts to add..."
                        className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors relative z-0"
                      />
                    </div>

                    {/* Search Results */}
                    {contactSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {contactSearchResults.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{contact.name || contact.fullName}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                            {contact.jobTitle && (
                              <div className="text-sm text-gray-500">{contact.jobTitle}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Contacts */}
                  {selectedContacts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-[var(--foreground)]">Selected Contacts:</div>
                      {selectedContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{contact.name || contact.fullName}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleContactRemove(contact.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Title Field - Only show for partnerships (removed from opportunities) */}
          {activeSection === "partnerships" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter job title"
                className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Additional Account-specific fields */}
          {activeSection === "accounts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Company Size
                </label>
                <select
                  value={formData.size || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, size: e.target.value }))
                  }
                  className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Annual Revenue
                </label>
                <select
                  value={formData.revenue || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, revenue: e.target.value }))
                  }
                  className="add-modal-input w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] hover:border-gray-400 transition-colors"
                >
                  <option value="">Select revenue range</option>
                  <option value="Under $1M">Under $1M</option>
                  <option value="$1M - $10M">$1M - $10M</option>
                  <option value="$10M - $50M">$10M - $50M</option>
                  <option value="$50M - $100M">$50M - $100M</option>
                  <option value="$100M - $500M">$100M - $500M</option>
                  <option value="$500M+">$500M+</option>
                </select>
              </div>
            </div>
          )}

          {/* Company-specific fields */}
          {activeSection === "companies" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                  onFocus={(e) => {
                    e.target.style.borderColor = categoryColors.primary;
                    e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes about this company"
                  rows={3}
                  className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                  onFocus={(e) => {
                    e.target.style.borderColor = categoryColors.primary;
                    e.target.style.boxShadow = `0 0 0 1px ${categoryColors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Notes Field - Removed for now */}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                (activeSection === "leads" || activeSection === "people") 
                  ? !formData.firstName?.trim() || !formData.lastName?.trim()
                  : !formData.name?.trim()
              }
              className="flex-1 px-4 py-3 rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: (
                  (activeSection === "leads" || activeSection === "people") 
                    ? (formData.firstName?.trim() && formData.lastName?.trim())
                    : formData.name?.trim()
                ) ? categoryColors.light : categoryColors.bg,
                border: `1px solid ${categoryColors.border}`,
                color: categoryColors.text,
              }}
              onMouseEnter={(e) => {
                const isEnabled = (activeSection === "leads" || activeSection === "people") 
                  ? (formData.firstName?.trim() && formData.lastName?.trim())
                  : formData.name?.trim();
                if (isEnabled) {
                  e.currentTarget.style.backgroundColor = categoryColors.primary;
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                const isEnabled = (activeSection === "leads" || activeSection === "people") 
                  ? (formData.firstName?.trim() && formData.lastName?.trim())
                  : formData.name?.trim();
                if (isEnabled) {
                  e.currentTarget.style.backgroundColor = categoryColors.light;
                  e.currentTarget.style.color = categoryColors.text;
                }
              }}
            >
              Add {getSectionTitle()} ({getCommonShortcut('SUBMIT')})
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Add Company
              </h2>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form data-modal="add-company" onSubmit={async (e) => {
              e.preventDefault();
              const companyData = {
                name: addCompanyFormData.name,
                website: normalizeWebsite(addCompanyFormData.website)
              };

              try {
                console.log('🔍 [FRONTEND] Creating company with data:', companyData);
                console.log('🔍 [FRONTEND] activeWorkspace:', activeWorkspace);
                console.log('🔍 [FRONTEND] authUser:', authUser);
                console.log('🔍 [FRONTEND] Full acquireData object:', acquireData);
                console.log('🔍 [FRONTEND] workspaceId from activeWorkspace:', activeWorkspace?.id);
                console.log('🔍 [FRONTEND] userId from authUser:', authUser?.id);
                
                // Enhanced validation with better error messages
                if (!companyData.name?.trim()) {
                  throw new Error('Company name is required.');
                }
                
                // Try to get workspace ID from multiple sources
                let workspaceId = activeWorkspace?.id;
                let userId = authUser?.id;
                
                if (!workspaceId) {
                  // Fallback 1: Try to get from authUser's workspaces
                  workspaceId = authUser?.workspaces?.[0]?.id;
                  console.log('🔍 [FRONTEND] Fallback workspace ID from authUser:', workspaceId);
                }
                
                if (!workspaceId) {
                  // Fallback 2: Try to get from acquireData
                  workspaceId = acquireData?.auth?.authUser?.activeWorkspaceId;
                  console.log('🔍 [FRONTEND] Fallback workspace ID from acquireData:', workspaceId);
                }
                
                if (!userId) {
                  // Fallback: Try to get from acquireData
                  userId = acquireData?.auth?.authUser?.id;
                  console.log('🔍 [FRONTEND] Fallback user ID from acquireData:', userId);
                }
                
                if (!workspaceId) {
                  console.error('❌ [FRONTEND] No workspace ID found from any source:', {
                    activeWorkspace,
                    authUser,
                    acquireData
                  });
                  throw new Error('No active workspace found. Please refresh the page and try again.');
                }
                
                if (!userId) {
                  console.error('❌ [FRONTEND] No user ID found from any source:', {
                    activeWorkspace,
                    authUser,
                    acquireData
                  });
                  throw new Error('No authenticated user found. Please refresh the page and try again.');
                }
                
                const requestBody = {
                  type: 'companies',
                  action: 'create',
                  data: companyData,
                  workspaceId: workspaceId,
                  userId: userId
                };
                
                console.log('🔍 [FRONTEND] Request body:', requestBody);
                
                const response = await authFetch('/api/data/unified', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody)
                });

                console.log('Company creation response status:', response.status);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Company creation result:', result);
                  
                  if (result.success && result.data) {
                    // Add the new company to the search results and select it
                    const newCompany = result.data;
                    setSelectedCompany(newCompany);
                    setFormData((prev: any) => ({
                      ...prev,
                      company: newCompany.name
                    }));
                    setShowAddCompanyModal(false);
                    setCompanySearchQuery(''); // Clear the search query
                    setCompanySearchResults([]); // Clear search results
                    
                    // Show success message
                    setSuccessMessage(`✅ Successfully created company: ${newCompany.name}`);
                    setShowSuccessMessage(true);
                    // Auto-hide success message after 3 seconds
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                    
                    console.log('Company created successfully:', newCompany);
                  } else {
                    console.error('Company creation failed:', result.error);
                    // Show error message using the success message system
                    setSuccessMessage(`❌ Failed to create company: ${result.error || 'Unknown error'}`);
                    setShowSuccessMessage(true);
                    // Auto-hide error message after 5 seconds
                    setTimeout(() => setShowSuccessMessage(false), 5000);
                  }
                } else {
                  const errorText = await response.text();
                  console.error('Company creation HTTP error:', response.status, errorText);
                  
                  // Try to parse error response for better error message
                  let errorMessage = `HTTP ${response.status}: ${errorText}`;
                  try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error) {
                      errorMessage = errorData.error;
                    } else if (errorData.message) {
                      errorMessage = errorData.message;
                    }
                  } catch (parseError) {
                    // Keep the original error message if parsing fails
                  }
                  
                  // Show error message using the success message system
                  setSuccessMessage(`❌ Failed to create company: ${errorMessage}`);
                  setShowSuccessMessage(true);
                  // Auto-hide error message after 5 seconds
                  setTimeout(() => setShowSuccessMessage(false), 5000);
                }
              } catch (error) {
                console.error('Error creating company:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                // Show error message using the success message system
                setSuccessMessage(`❌ Error creating company: ${errorMessage}`);
                setShowSuccessMessage(true);
                // Auto-hide error message after 5 seconds
                setTimeout(() => setShowSuccessMessage(false), 5000);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={addCompanyFormData.name}
                    onChange={(e) => setAddCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                    onFocus={(e) => {
                      e.target.style.borderColor = getCategoryColors('companies').primary;
                      e.target.style.boxShadow = `0 0 0 1px ${getCategoryColors('companies').primary}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={addCompanyFormData.website}
                    onChange={(e) => setAddCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="example.com or https://example.com"
                    className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition-colors"
                    onFocus={(e) => {
                      e.target.style.borderColor = getCategoryColors('companies').primary;
                      e.target.style.boxShadow = `0 0 0 1px ${getCategoryColors('companies').primary}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm"
                  style={{
                    backgroundColor: getCategoryColors('companies').light,
                    borderColor: getCategoryColors('companies').border,
                    color: getCategoryColors('companies').text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getCategoryColors('companies').bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = getCategoryColors('companies').light;
                  }}
                >
                  Add Company ({getCommonShortcut('SUBMIT')})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Message */}
      <SuccessMessage
        message={successMessage}
        isVisible={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
        type={successMessage.includes('Error') || successMessage.includes('Failed') ? 'error' : 'success'}
        section={activeSection}
      />

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        onCompanyAdded={(company) => {
          // Set the selected company in the form
          setSelectedCompany(company);
          setCompanySearchQuery(company.name);
          setCompanySearchResults([]);
          setShowAddCompanyModal(false);
        }}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onLeadAdded={(lead) => {
          setShowSuccessMessage(true);
          setSuccessMessage(`Lead "${lead.fullName}" created successfully!`);
          setShowAddLeadModal(false);
          if (refreshData) {
            refreshData();
          }
        }}
      />

      {/* Add Prospect Modal */}
      <AddProspectModal
        isOpen={showAddProspectModal}
        onClose={() => setShowAddProspectModal(false)}
        onProspectAdded={(prospect) => {
          setShowSuccessMessage(true);
          setSuccessMessage(`Prospect "${prospect.fullName}" created successfully!`);
          setShowAddProspectModal(false);
          if (refreshData) {
            refreshData();
          }
        }}
      />
    </div>
  );
}
