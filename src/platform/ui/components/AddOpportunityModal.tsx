"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpportunityAdded: (opportunity: any) => void;
  section?: string;
}

export function AddOpportunityModal({ isOpen, onClose, onOpportunityAdded, section = 'opportunities' }: AddOpportunityModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    company: "",
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
          
          if (formData.firstName.trim() && formData.lastName.trim() && !isLoading) {
            const form = document.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }
          return;
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
      
      const opportunityData = {
        ...formData,
        fullName,
        status: "OPPORTUNITY", // Lock in as OPPORTUNITY
        source: "Manual Entry"
      };

      console.log('Creating opportunity with data:', opportunityData);

      // Call the v1 API to create the opportunity
      const result = await authFetch('/api/v1/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData)
      }, { success: false, error: 'Failed to create opportunity' }); // fallback

      console.log('Opportunity creation response:', result);
      
      // Check if the response indicates success
      if (result.success && result.data) {
        console.log('✅ [AddOpportunityModal] Opportunity created successfully');
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          jobTitle: "",
          company: "",
          notes: ""
        });
        
        // Call callback immediately to close modal and refresh list
        onOpportunityAdded(result.data);
      } else {
        throw new Error(result.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      // Show a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create opportunity. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🔍 [AddOpportunityModal] Modal not open, returning null');
    return null;
  }

  console.log('🔍 [AddOpportunityModal] Modal is open, rendering modal content');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.bg }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Add New Opportunity</h2>
              <p className="text-sm text-muted">Create a new opportunity contact</p>
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
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
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
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
            />
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
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Enter company name"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes"
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors resize-none"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
            />
          </div>

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
              disabled={isLoading || !formData.firstName || !formData.lastName}
              className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.primary,
                '--tw-bg-opacity': '1'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.dark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
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
