"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from '@/platform/auth-fetch';
import { XMarkIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { DEFAULT_FORM_DATA } from "@/platform/config";
import { SuccessMessage } from "./SuccessMessage";

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
      // Auto-focus the first input field (Person Name field)
      setTimeout(() => {
        const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
          firstInput.select(); // Also select any existing text for better UX
        }
      }, 150); // Slightly longer delay for better reliability
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
    if (!selectedContacts.find(c => c['id'] === contact.id)) {
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Please enter a name for the record");
      return;
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
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
            className="px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - First for leads */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {activeSection === "opportunities" 
                ? "Opportunity Name" 
                : activeSection === "leads" 
                ? "Person Name" 
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
                  : activeSection === "leads"
                  ? "Enter person name"
                  : `Enter ${getSectionTitle().toLowerCase()} name`
              }
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
              required
            />
          </div>

          {/* Company/Account Field - Second for leads */}
          {activeSection === "leads" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company/Account
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    placeholder="Search for company..."
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                        {company['website'] && (
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
                {companySearchQuery.length >= 2 && companySearchResults['length'] === 0 && !isSearchingCompanies && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div
                      onClick={handleAddCompany}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                    >
                      + Add New Company: "{companySearchQuery}"
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
                      {selectedCompany['website'] && (
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              {/* Primary Contact */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Primary Contact
                </label>
                <input
                  type="text"
                  value={formData.contact || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      contact: e.target.value,
                    }))
                  }
                  placeholder="Contact name"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
                />
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Standard fields for all record types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Field - Hide for accounts */}
            {activeSection !== "accounts" && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
                />
              </div>
            )}

            {/* Phone Field - Hide for accounts */}
            {activeSection !== "accounts" && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
                />
              </div>
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
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors relative z-0"
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
                            {contact['jobTitle'] && (
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
          </div>

          {/* Company Field - Regular input for non-leads sections */}
          {activeSection !== "leads" && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Enter company name"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Title Field (not for opportunities, partnerships, or accounts) */}
          {activeSection !== "opportunities" &&
            activeSection !== "partnerships" &&
            activeSection !== "accounts" && (
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
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, notes: e.target.value }))
              }
              placeholder={`Additional notes about this ${getSectionTitle().toLowerCase()}`}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
            />
          </div>

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
              disabled={!formData.name?.trim()}
              className={`flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm ${
                formData.name?.trim()
                  ? 'bg-blue-200 border-blue-300 text-blue-700 hover:bg-blue-300' // Active state when typing
                  : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200' // Default state
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add {getSectionTitle()}
            </button>
          </div>
        </form>
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

            <form onSubmit={async (e) => {
              e.preventDefault();
              const companyData = {
                name: addCompanyFormData.name,
                website: normalizeWebsite(addCompanyFormData.website),
                workspaceId: activeWorkspace?.id || "",
                userId: authUser?.id || ""
              };

              try {
                console.log('🔍 [FRONTEND] Creating company with data:', companyData);
                console.log('🔍 [FRONTEND] activeWorkspace:', activeWorkspace);
                console.log('🔍 [FRONTEND] authUser:', authUser);
                console.log('🔍 [FRONTEND] Full acquireData object:', acquireData);
                console.log('🔍 [FRONTEND] workspaceId from activeWorkspace:', activeWorkspace?.id);
                console.log('🔍 [FRONTEND] userId from authUser:', authUser?.id);
                
                const response = await fetch('/api/data/unified', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'accounts',
                    action: 'create',
                    data: companyData
                  })
                });

                console.log('Company creation response status:', response.status);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Company creation result:', result);
                  
                  if (result['success'] && result.data) {
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
                    console.log('Company created successfully:', newCompany);
                  } else {
                    console.error('Company creation failed:', result.error);
                    alert(`Failed to create company: ${result.error || 'Unknown error'}`);
                  }
                } else {
                  const errorText = await response.text();
                  console.error('Company creation HTTP error:', response.status, errorText);
                  alert(`Failed to create company: ${response.status} ${errorText}`);
                }
              } catch (error) {
                console.error('Error creating company:', error);
                alert(`Error creating company: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] hover:border-gray-400 transition-colors"
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
                  className="flex-1 px-4 py-3 bg-blue-200 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-300 transition-colors font-semibold text-sm"
                >
                  Add Company
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
      />
    </div>
  );
}
