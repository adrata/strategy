"use client";

import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpportunityAdded: (opportunity: any) => void;
  section?: string;
}

const OPPORTUNITY_STAGES = [
  'Build',
  'Justify',
  'Negotiate',
  'Legal/Procurement',
  'Sign',
  'Paid'
];

export function AddOpportunityModal({ isOpen, onClose, onOpportunityAdded, section = 'opportunities' }: AddOpportunityModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  
  const [formData, setFormData] = useState({
    selectedCompany: null as any,
    opportunityAmount: "",
    opportunityProbability: "",
    opportunityStage: "Build",
    expectedCloseDate: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);

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
          target.tagName === "SELECT" ||
          target.contentEditable === "true";

        // If we're in an input field, prevent default and trigger form submission
        if (isInputField) {
          event.preventDefault();
          event.stopPropagation();
          
          if (formData.selectedCompany && !isLoading) {
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
  }, [isOpen, formData.selectedCompany, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.selectedCompany) {
        throw new Error('Please select a company');
      }

      // Calculate default close date (90 days from now) if not provided
      const closeDate = formData.expectedCloseDate 
        ? new Date(formData.expectedCloseDate).toISOString().split('T')[0]
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const opportunityData = {
        status: "OPPORTUNITY",
        opportunityAmount: formData.opportunityAmount ? parseFloat(formData.opportunityAmount) : 50000,
        opportunityProbability: formData.opportunityProbability ? parseFloat(formData.opportunityProbability) : 25,
        opportunityStage: formData.opportunityStage || "Build",
        expectedCloseDate: closeDate,
        notes: formData.notes.trim() || undefined
      };

      console.log('Creating/updating opportunity with data:', opportunityData);

      let result;
      
      // If company already exists (has id), update it; otherwise create new
      if (formData.selectedCompany.id) {
        // Update existing company to add opportunity fields
        result = await authFetch(`/api/v1/companies/${formData.selectedCompany.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(opportunityData)
        }, { success: false, error: 'Failed to update company to opportunity' });
      } else {
        // Create new company as opportunity
        result = await authFetch('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.selectedCompany.name,
            ...opportunityData
          })
        }, { success: false, error: 'Failed to create opportunity' });
      }

      console.log('Opportunity creation response:', result);
      
      // Check if the response indicates success
      if (result.success && result.data) {
        console.log('✅ [AddOpportunityModal] Opportunity created successfully');
        
        // Reset form
        setFormData({
          selectedCompany: null,
          opportunityAmount: "",
          opportunityProbability: "",
          opportunityStage: "Build",
          expectedCloseDate: "",
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
              <p className="text-sm text-muted">Create a new sales opportunity</p>
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

          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <CompanySelector
              value={formData.selectedCompany}
              onChange={(company) => {
                console.log('🏢 [AddOpportunityModal] Company selected/changed:', company);
                setFormData(prev => ({ 
                  ...prev, 
                  selectedCompany: company 
                }));
              }}
              placeholder="Search or add company..."
            />
          </div>

          {/* Opportunity Amount and Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                value={formData.opportunityAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, opportunityAmount: e.target.value }))}
                placeholder="50000"
                min="0"
                step="1000"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probability (%)
              </label>
              <input
                type="number"
                value={formData.opportunityProbability}
                onChange={(e) => setFormData(prev => ({ ...prev, opportunityProbability: e.target.value }))}
                placeholder="25"
                min="0"
                max="100"
                step="5"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Stage and Close Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage
              </label>
              <select
                value={formData.opportunityStage}
                onChange={(e) => setFormData(prev => ({ ...prev, opportunityStage: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors bg-background"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
              >
                {OPPORTUNITY_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 outline-none transition-colors"
                style={{
                  '--tw-ring-color': `${colors.primary}30`,
                  '--tw-border-color': colors.primary
                } as React.CSSProperties}
              />
            </div>
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
              disabled={isLoading || !formData.selectedCompany}
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
