"use client";

import React, { useState, useEffect, useRef } from "react";
import { createButtonTextWithShortcut } from '@/platform/utils/keyboard-shortcut-display';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { authFetch } from '@/platform/api-fetch';
import { getCategoryColors } from '@/platform/config/color-palette';
import { useUnifiedAuth } from '@/platform/auth';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyAdded: (company: any) => void;
  section?: string;
}

export function AddCompanyModal({ isOpen, onClose, onCompanyAdded, section = 'companies' }: AddCompanyModalProps) {
  // Get section-specific colors
  const colors = getCategoryColors(section);
  const { user } = useUnifiedAuth();

  // Debug: Log modal lifecycle
  useEffect(() => {
    console.log(`🏗️ [AddCompanyModal] Modal ${isOpen ? 'OPENED' : 'CLOSED'} for section: ${section}`);
    if (isOpen) {
      console.log(`👤 [AddCompanyModal] User context:`, {
        userId: user?.id,
        userEmail: user?.email,
        hasUser: !!user
      });
    }
  }, [isOpen, section, user?.id, user?.email]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form and state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Reset when closing
      console.log('🔄 [AddCompanyModal] Resetting state on modal close');
      setIsSubmitting(false);
      setSelectedCompany(null);
      setShowCreateForm(false);
      setFormData({
        name: "",
        website: "",
        notes: ""
      });
      setErrorMessage('');
    } else {
      // Clear any previous error when opening
      console.log('🔄 [AddCompanyModal] Clearing error state on modal open');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Debug: Log form state changes
  useEffect(() => {
    if (isOpen) {
      console.log('📝 [AddCompanyModal] Form data changed:', {
        name: formData.name,
        website: formData.website,
        notes: formData.notes,
        isSubmitting,
        hasError: !!errorMessage
      });
    }
  }, [formData, isSubmitting, errorMessage, isOpen]);

  // Auto-focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcut for Cmd+Enter (⌘⏎)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        
        if (!isSubmitting && formData.name.trim()) {
          handleSubmit(event as any);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isSubmitting, formData.name]);

  // Handle company selection from search
  const handleCompanySelect = (company: any) => {
    console.log('✅ [AddCompanyModal] Company selected from search:', company);
    setSelectedCompany(company);
    // Don't immediately call the callback - wait for user to click Save
  };

  // Handle saving the selected company
  const handleSaveSelectedCompany = () => {
    if (selectedCompany) {
      console.log('💾 [AddCompanyModal] Saving selected company:', selectedCompany);
      onCompanyAdded(selectedCompany);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMessage('Company name is required');
      return;
    }

    console.log('🚀 [AddCompanyModal] Starting company creation:', {
      name: formData.name,
      website: formData.website,
      notes: formData.notes,
      userId: user?.id,
      userEmail: user?.email
    });

    setIsSubmitting(true);
    setErrorMessage(''); // Clear any previous error
    
    try {
      const result = await authFetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          website: formData.website?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          ...(user?.id && { mainSellerId: user.id }) // Only include if user exists
        }),
        timeout: 30000 // Increase timeout to 30 seconds
      }); // Removed fallback to get actual API errors

      console.log('📡 [AddCompanyModal] Company creation response:', result);
      
      // Check if the response indicates success
      if (result && result.success && result.data) {
        const isExisting = result.isExisting || false;
        console.log('✅ [AddCompanyModal] Company operation successful:', {
          isExisting,
          companyId: result.data.id,
          companyName: result.data.name,
          mainSellerId: result.data.mainSellerId,
          message: result.meta?.message
        });
        
        // Reset form
        setFormData({
          name: "",
          website: "",
          notes: ""
        });
        
        // Note: Cache invalidation is handled by the parent component
        // The company creation will trigger a refresh in the parent context
        
        // Call callback to close modal, show success message, and refresh list
        onCompanyAdded(result.data);
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to create company';
        console.error('❌ [AddCompanyModal] Company creation failed:', {
          result,
          requestData: {
            name: formData.name,
            website: formData.website,
            notes: formData.notes,
            mainSellerId: user?.id
          }
        });
        setErrorMessage(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ [AddCompanyModal] Error creating company:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        requestData: {
          name: formData.name,
          website: formData.website,
          notes: formData.notes,
          mainSellerId: user?.id
        },
        userId: user?.id,
        userEmail: user?.email
      });
      
      // Set user-friendly error message
      const errorMsg = error instanceof Error ? error.message : 'Failed to create company. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [AddCompanyModal] Close requested:', {
      isSubmitting,
      hasFormData: !!formData.name,
      hasError: !!errorMessage
    });
    
    if (!isSubmitting) {
      console.log('✅ [AddCompanyModal] Closing modal');
      onClose();
    } else {
      console.log('⏸️ [AddCompanyModal] Cannot close - submission in progress');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.bg }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: colors.primary }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Add Company</h2>
              <p className="text-sm text-[var(--muted)]">Search or add a new company</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Company Search */}
          {!showCreateForm && !selectedCompany && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Search for Company
              </label>
              <CompanySelector
                value={null}
                onChange={handleCompanySelect}
                placeholder="Search or add company"
              />
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Or create a new company →
              </button>
            </div>
          )}

          {/* Selected Company Preview */}
          {!showCreateForm && selectedCompany && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Selected Company
              </label>
              <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--panel-background)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[var(--foreground)]">{selectedCompany.name}</h4>
                    {selectedCompany.website && (
                      <p className="text-sm text-[var(--muted)]">{selectedCompany.website}</p>
                    )}
                    {selectedCompany.industry && (
                      <p className="text-sm text-[var(--muted)]">{selectedCompany.industry}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
              
              {/* Action Buttons for Selected Company */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSelectedCompany}
                  className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm"
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
                  Save Company
                </button>
              </div>
            </div>
          )}

          {/* Create New Company Form */}
          {showCreateForm && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--foreground)]">Create New Company</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  Back to search
                </button>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Company Name *
                </label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                // Clear error when user starts typing
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Enter company name"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                '--tw-ring-color': `${colors.primary}30`,
                '--tw-border-color': colors.primary
              } as React.CSSProperties}
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Website
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="example.com or https://example.com"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
            />
          </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this company"
                  rows={3}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          {showCreateForm && (
            <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              {isSubmitting ? 'Adding...' : `Complete (${getCommonShortcut('SUBMIT')})`}
            </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
