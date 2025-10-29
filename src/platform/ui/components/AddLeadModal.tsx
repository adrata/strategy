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
  
  // 🔍 DEBUG: Log when modal receives isOpen prop changes
  useEffect(() => {
    console.log('🔍 [AddLeadModal] isOpen prop changed:', {
      isOpen,
      section,
      colors,
      timestamp: new Date().toISOString()
    });
    
    if (!isOpen) {
      console.log('❌ [AddLeadModal] Modal is being closed!');
    } else {
      console.log('✅ [AddLeadModal] Modal is being opened!');
    }
  }, [isOpen, section, colors]);

  // Auto-focus first name input when modal opens
  useEffect(() => {
    if (isOpen && firstNameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    selectedCompany: null as any,
    state: null as USState | null,
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

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
          
          // Validate form and submit if valid
          if (formData.firstName.trim() && formData.lastName.trim() && !isLoading) {
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
        
        // Validate form and submit if valid
        if (formData.firstName.trim() && formData.lastName.trim() && !isLoading) {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData.firstName, formData.lastName, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create full name from first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const leadData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        notes: formData.notes,
        companyId: formData.selectedCompany?.id,
        state: formData.state,
        fullName,
        status: "LEAD", // Lock in as LEAD
        source: "Manual Entry"
      };

      console.log('🚀 [AddLeadModal] Creating lead with data:', leadData);
      console.log('🚀 [AddLeadModal] About to make API call to /api/v1/people');

      // Call the v1 API to create the lead
      const result = await authFetch('/api/v1/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
        timeout: 30000 // Increase timeout to 30 seconds
      }, { success: false, error: 'Failed to create lead' }); // fallback

      console.log('Lead creation response:', result);
      
      // Debug: Log the full response
      console.log('🔍 [AddLeadModal] Full API response:', result);
      console.log('🔍 [AddLeadModal] result.success:', result.success);
      console.log('🔍 [AddLeadModal] result.data:', result.data);
      console.log('🔍 [AddLeadModal] result.error:', result.error);
      
      // Check if the response indicates success
      if (result.success && result.data) {
        console.log('✅ [AddLeadModal] Lead created successfully');
        console.log('✅ [AddLeadModal] Response data:', result.data);
        console.log('✅ [AddLeadModal] About to call onLeadAdded callback');
        console.log('✅ [AddLeadModal] onLeadAdded function:', onLeadAdded);
        console.log('✅ [AddLeadModal] onLeadAdded type:', typeof onLeadAdded);
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          jobTitle: "",
          selectedCompany: null,
          state: null,
          notes: ""
        });
        
        // Call callback to close modal, show success message, and refresh list
        console.log(`🚀 [AddLeadModal] CALLING onLeadAdded NOW with data:`, result.data);
        console.log(`🚀 [AddLeadModal] onLeadAdded function:`, onLeadAdded);
        console.log(`🚀 [AddLeadModal] onLeadAdded type:`, typeof onLeadAdded);
        
        if (onLeadAdded) {
          onLeadAdded(result.data);
          console.log(`✅ [AddLeadModal] onLeadAdded callback has been called - waiting for parent component response`);
        } else {
          console.error(`❌ [AddLeadModal] onLeadAdded callback is null/undefined!`);
        }
        
        // Success handled by parent component's success message
        console.log(`🎉 [AddLeadModal] Lead created successfully: ${result.data.firstName} ${result.data.lastName}`);
      } else {
        console.error('❌ [AddLeadModal] Response indicates failure:', result);
        throw new Error(result.error || 'Failed to create lead');
      }
    } catch (error) {
      console.error('❌ [AddLeadModal] Error creating lead:', error);
      console.error('❌ [AddLeadModal] Error type:', typeof error);
      console.error('❌ [AddLeadModal] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ [AddLeadModal] Full error object:', error);
      
      // Error will be handled by the parent component
      const errorMessage = error instanceof Error ? error.message : 'Failed to create lead. Please try again.';
      console.error('❌ [AddLeadModal] Error creating lead:', errorMessage);
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
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Add New Lead</h2>
              <p className="text-sm text-[var(--muted)]">Create a new lead contact</p>
            </div>
          </div>
          <button
            onClick={() => {
              console.log('❌ [AddLeadModal] X button clicked - closing modal');
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              style={{ color: colors.text }}
            >
              Status: {section.charAt(0).toUpperCase() + section.slice(1)}
            </span>
          </div>

          {/* Name Fields - Split like person form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                ref={firstNameInputRef}
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 outline-none transition-colors"
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
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
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
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="Enter job title"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <CompanySelector
              value={formData.selectedCompany}
              onChange={(company) => {
                console.log('🏢 [AddLeadModal] Company selected/changed:', company);
                setFormData(prev => ({ 
                  ...prev, 
                  selectedCompany: company 
                }));
                console.log('🏢 [AddLeadModal] Form data updated with company:', company);
              }}
              placeholder="Search or add company..."
            />
          </div>

          {/* State Field - Only for Notary Everyday workspace */}
          {isNotaryEveryday && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <StateSelector
                value={formData.state}
                onChange={(state) => {
                  console.log('🗺️ [AddLeadModal] State selected/changed:', state);
                  setFormData(prev => ({ 
                    ...prev, 
                    state: state 
                  }));
                  console.log('🗺️ [AddLeadModal] Form data updated with state:', state);
                }}
                placeholder="Search or select state..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                console.log('❌ [AddLeadModal] Cancel button clicked - closing modal');
                onClose();
              }}
              className="flex-1 px-4 py-2 border border-[var(--border)] text-gray-700 rounded-lg hover:bg-[var(--panel-background)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.firstName || !formData.lastName}
              className="flex-1 px-4 py-2 border rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: formData.firstName.trim() && formData.lastName.trim() && !isLoading 
                  ? colors.bgHover 
                  : colors.bg,
                color: colors.primary,
                borderColor: colors.border
              }}
              onMouseEnter={(e) => {
                if (!isLoading && formData.firstName.trim() && formData.lastName.trim()) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = formData.firstName.trim() && formData.lastName.trim()
                    ? colors.bgHover 
                    : colors.bg;
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
});
