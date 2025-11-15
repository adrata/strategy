"use client";

import React, { useState, useEffect, useRef } from "react";
// Force rebuild to fix useEffect import issue
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';
import { StateSelector } from '@/frontend/components/pipeline/StateSelector';
import { usePipeline } from '@/products/pipeline/context/PipelineContext';
import { USState } from '@/platform/constants/us-states';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (lead: any) => void;
  section?: string;
}

export const AddLeadModal = React.memo(function AddLeadModal({ isOpen, onClose, onLeadAdded, section = 'leads' }: AddLeadModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  
  // Get workspace context to check if this is Notary Everyday
  const { workspace } = usePipeline();
  const isNotaryEveryday = workspace?.slug === 'ne' || workspace?.name?.includes('Notary Everyday');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'person' | 'company'>('company');
  
  // 🔍 DEBUG: Log when modal receives isOpen prop changes
  useEffect(() => {
    console.log('🔍 [AddLeadModal] isOpen prop changed:', {
      isOpen,
      section,
      colors,
      activeTab,
      timestamp: new Date().toISOString()
    });
    
    if (!isOpen) {
      console.log('❌ [AddLeadModal] Modal is being closed!');
    } else {
      console.log('✅ [AddLeadModal] Modal is being opened!');
    }
  }, [isOpen, section, colors, activeTab]);

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

  // Person form data
  const [personFormData, setPersonFormData] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    linkedin: "",
    selectedCompany: null as any,
    state: null as USState | null,
    notes: "",
    status: "LEAD" as "LEAD" | "PROSPECT" | "OPPORTUNITY" | "CLIENT" | "PARTNER" | "SUPERFAN",
    stage: "Generate" as "Generate" | "Initiate"
  });

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    website: "",
    linkedin: "",
    notes: "",
    state: null as USState | null
  });

  const [isLoading, setIsLoading] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const companyNameInputRef = useRef<HTMLInputElement>(null);
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Image upload handlers
  const handleImageFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select image files only (PNG, JPG, GIF, WebP)');
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Limit to 10 images total
    const remainingSlots = 10 - uploadedImages.length;
    if (validFiles.length > remainingSlots) {
      alert(`Maximum 10 images allowed. You can add ${remainingSlots} more.`);
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    setUploadedImages(prev => [...prev, ...filesToAdd]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleImageFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === 'person') {
        // Create person/lead
        const fullName = `${personFormData.firstName} ${personFormData.lastName}`.trim();
        
        const leadData = {
          firstName: personFormData.firstName,
          lastName: personFormData.lastName,
          jobTitle: personFormData.jobTitle,
          linkedinUrl: personFormData.linkedin,
          notes: personFormData.notes,
          companyId: personFormData.selectedCompany?.id,
          state: personFormData.state,
          fullName,
          status: personFormData.status, // Always "LEAD" for lead modal
          source: "Manual Entry",
          customFields: {
            afmStage: personFormData.stage
          }
        };

        console.log('🚀 [AddLeadModal] Creating person lead with data:', leadData);

        // Call the v1 API to create the lead
        const result = await authFetch('/api/v1/people', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leadData),
          timeout: 30000
        }, { success: false, error: 'Failed to create lead' });

        console.log('Person lead creation response:', result);
        
        if (result.success && result.data) {
          console.log('✅ [AddLeadModal] Person lead created successfully');
          
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
            status: "LEAD",
            stage: "Generate"
          });
          setUploadedImages([]);
          
          // Call callback
          if (onLeadAdded) {
            onLeadAdded(result.data);
          }
          
          console.log(`🎉 [AddLeadModal] Person lead created successfully: ${result.data.firstName} ${result.data.lastName}`);
        } else {
          console.error('❌ [AddLeadModal] Person lead creation failed:', result);
          throw new Error(result.error || 'Failed to create lead');
        }
      } else {
        // Create company
        const companyData = {
          name: companyFormData.name,
          website: companyFormData.website,
          notes: companyFormData.notes,
          state: companyFormData.state,
          source: "Manual Entry"
        };

        console.log('🚀 [AddLeadModal] Creating company with data:', companyData);

        // Call the v1 API to create the company
        const result = await authFetch('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(companyData),
          timeout: 30000
        }, { success: false, error: 'Failed to create company' });

        console.log('Company creation response:', result);
        
        if (result.success && result.data) {
          console.log('✅ [AddLeadModal] Company created successfully');
          
          // Reset company form
          setCompanyFormData({
            name: "",
            website: "",
            linkedin: "",
            notes: "",
            state: null
          });
          setUploadedImages([]);
          
          // Call callback
          if (onLeadAdded) {
            onLeadAdded(result.data);
          }
          
          console.log(`🎉 [AddLeadModal] Company created successfully: ${result.data.name}`);
        } else {
          console.error('❌ [AddLeadModal] Company creation failed:', result);
          throw new Error(result.error || 'Failed to create company');
        }
      }
    } catch (error) {
      console.error('❌ [AddLeadModal] Error creating record:', error);
      console.error('❌ [AddLeadModal] Error type:', typeof error);
      console.error('❌ [AddLeadModal] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ [AddLeadModal] Full error object:', error);
      
      // Error will be handled by the parent component
      const errorMessage = error instanceof Error ? error.message : `Failed to create ${activeTab}. Please try again.`;
      console.error('❌ [AddLeadModal] Error creating record:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🔍 [AddLeadModal] Modal not open, returning null');
    return null;
  }

  console.log('🔍 [AddLeadModal] Modal is open, rendering modal content');

  return (
    <>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {activeTab === 'person' ? 'Add New Person' : 'Add New Company'}
                </h2>
                <p className="text-sm text-muted">Create a new contact or company</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('❌ [AddLeadModal] X button clicked - closing modal');
                onClose();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
            >
              <XMarkIcon className="w-4.5 h-4.5 text-muted" />
            </button>
          </div>
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

          {/* Status Badge - Lighter orange styling */}
          <div 
            className="flex items-center gap-2 p-3 rounded-lg border"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              opacity: 0.8
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
              Status: {activeTab === 'person' ? 'LEAD' : 'Company'}
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

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  value={personFormData.stage}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, stage: e.target.value as "Generate" | "Initiate" }))}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors bg-background"
                >
                  <option value="Generate">Generate — First stage in Generate Pipeline</option>
                  <option value="Initiate">Initiate — Convert pain to interest, map org structure</option>
                </select>
              </div>

              {/* State Field - Only for Notary Everyday workspace */}
              {isNotaryEveryday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <StateSelector
                    value={personFormData.state}
                    onChange={(state) => {
                      console.log('🗺️ [AddLeadModal] State selected/changed:', state);
                      setPersonFormData(prev => ({ 
                        ...prev, 
                        state: state 
                      }));
                      console.log('🗺️ [AddLeadModal] Form data updated with state:', state);
                    }}
                    placeholder="Search or select state..."
                  />
                </div>
              )}

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <CompanySelector
                  value={personFormData.selectedCompany}
                  onChange={(company) => {
                    console.log('🏢 [AddLeadModal] Company selected/changed:', company);
                    setPersonFormData(prev => ({ 
                      ...prev, 
                      selectedCompany: company 
                    }));
                    console.log('🏢 [AddLeadModal] Form data updated with company:', company);
                  }}
                  placeholder="Search or add company..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Notes
                  {uploadedImages.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </label>
                <textarea
                  value={personFormData.notes}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this person"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                />
                <div className="mt-2 flex justify-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-xs text-muted hover:text-foreground bg-background border border-border rounded hover:bg-hover transition-colors"
                  >
                    Add Image
                  </button>
                </div>
                {/* Image previews */}
                {uploadedImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <p className="text-xs text-muted mt-1 truncate w-20" title={image.name}>
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* State field - only for Notary Everyday workspace */}
              {isNotaryEveryday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <StateSelector
                    value={companyFormData.state}
                    onChange={(state) => {
                      console.log('🗺️ [AddLeadModal] Company state selected/changed:', state);
                      setCompanyFormData(prev => ({ 
                        ...prev, 
                        state: state 
                      }));
                      console.log('🗺️ [AddLeadModal] Company form data updated with state:', state);
                    }}
                    placeholder="Search or select state..."
                  />
                </div>
              )}

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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Notes
                  {uploadedImages.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </label>
                <textarea
                  value={companyFormData.notes}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this company"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                />
                <div className="mt-2 flex justify-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-xs text-muted hover:text-foreground bg-background border border-border rounded hover:bg-hover transition-colors"
                  >
                    Add Image
                  </button>
                </div>
                {/* Image previews */}
                {uploadedImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <p className="text-xs text-muted mt-1 truncate w-20" title={image.name}>
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                console.log('❌ [AddLeadModal] Cancel button clicked - closing modal');
                onClose();
              }}
              className="flex-1 px-4 py-2 border border-border text-gray-700 rounded-lg hover:bg-panel-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || 
                uploadingImages ||
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
              {uploadingImages ? 'Uploading images...' : isLoading ? 'Creating...' : `Complete (${getCommonShortcut('SUBMIT')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
});
