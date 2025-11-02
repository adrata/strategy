"use client";

import React, { useState, useEffect, useRef } from "react";
// Force rebuild to fix useEffect import issue
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded: (person: any) => void;
  section?: string;
}

export function AddPersonModal({ isOpen, onClose, onPersonAdded, section = 'people' }: AddPersonModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  // 🔍 DEBUG: Log when modal receives isOpen prop changes
  useEffect(() => {
    console.log('🔍 [AddPersonModal] isOpen prop changed:', {
      isOpen,
      timestamp: new Date().toISOString()
    });
  }, [isOpen]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    linkedin: "",
    company: "",
    companyId: "",
    status: "LEAD", // Default to LEAD, but allow selection
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first name input when modal opens
  useEffect(() => {
    if (isOpen && firstNameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
      
      const personData = {
        ...formData,
        fullName,
        source: "Manual Entry",
        // Only include companyId if it's set
        companyId: formData.companyId || undefined
      };

      console.log('Creating person with data:', personData);

      // Call the v1 API to create the person
      const result = await authFetch('/api/v1/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData)
      }, { success: false, error: 'Failed to create person' }); // fallback

      console.log('Person creation response:', result);
      
      // Check if the response indicates success
      if (result.success && result.data) {
        console.log('✅ [AddPersonModal] Person created successfully');
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          jobTitle: "",
          linkedin: "",
          company: "",
          companyId: "",
          status: "LEAD",
          notes: ""
        });
        
        // Call callback to close modal, show success message, and refresh list
        onPersonAdded(result.data);
      } else {
        throw new Error(result.error || 'Failed to create person');
      }
    } catch (error) {
      console.error('Error creating person:', error);
      alert('Failed to create person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🔍 [AddPersonModal] Modal not open, returning null');
    return null;
  }

  console.log('🔍 [AddPersonModal] Modal is open, rendering modal content');

  return (
    <>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Add New Person</h2>
              <p className="text-sm text-muted">Create a new person contact</p>
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
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-border rounded-lg px-4 py-2 outline-none transition-colors focus:border-blue-500"
              required
            >
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CLIENT">Client</option>
              <option value="PARTNER">Partner</option>
            </select>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name *
              </label>
              <input
                ref={firstNameInputRef}
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                className="w-full border border-border rounded-lg px-4 py-2 outline-none transition-colors focus:ring-2"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="w-full border border-border rounded-lg px-4 py-2 outline-none transition-colors focus:border-blue-500"
                required
              />
            </div>
          </div>


          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="Enter job title"
              className="w-full border border-border rounded-lg px-4 py-2 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Company
            </label>
            <CompanySelector
              value={formData.company}
              onChange={(company) => {
                setFormData(prev => ({
                  ...prev,
                  company: company?.name || "",
                  companyId: company?.id || ""
                }));
              }}
              placeholder="Search or add company..."
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.firstName.trim() || !formData.lastName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : `Complete (${getCommonShortcut('SUBMIT')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
