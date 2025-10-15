/**
 * UPDATE MODAL V2 - Configuration-driven version
 * 
 * This version uses the tab registry instead of large switch statements
 * while preserving the exact same interface and behavior as the original.
 */

"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { 
  UserIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/solid';
import { getTabsForRecordType, getTabComponent } from './config/tab-registry';
import { CompanySelector } from './CompanySelector';
import { formatFieldValue, getCompanyName, formatDateValue, formatArrayValue } from './utils/field-formatters';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  recordType: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners';
  onUpdate: (updatedData: any, actionData?: ActionLogData) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
  initialTab?: string;
  context?: 'sprint' | 'pipeline' | 'speedrun' | 'main';
  sourceApp?: string;
}

interface ActionLogData {
  actionType: string;
  notes: string;
}

export function UpdateModalV2({
  isOpen,
  onClose,
  record,
  recordType,
  onUpdate,
  onDelete,
  initialTab = 'overview',
  context = 'main',
  sourceApp = 'pipeline'
}: UpdateModalProps) {
  
  // State management - identical to original
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState(record || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Get tabs from registry instead of switch statement
  const tabs = getTabsForRecordType(recordType, record);

  // Update form data when record changes
  useEffect(() => {
    if (record) {
      setFormData({
        // Basic info
        name: formatFieldValue(record.fullName || record.name, ''),
        firstName: formatFieldValue(record.firstName, ''),
        lastName: formatFieldValue(record.lastName, ''),
        email: formatFieldValue(record.email || record.workEmail, ''),
        phone: formatFieldValue(record.phone || record.mobilePhone || record.workPhone, ''),
        
        // Company info - handle both string and object formats
        company: record.company || record.companyName || '',
        companyId: record.companyId || '',
        companyDomain: formatFieldValue(record.companyDomain, ''),
        industry: formatFieldValue(record.industry, ''),
        vertical: formatFieldValue(record.vertical, ''),
        companySize: formatFieldValue(record.companySize, ''),
        
        // Job info
        jobTitle: formatFieldValue(record.jobTitle || record.title, ''),
        department: formatFieldValue(record.department, ''),
        
        // Contact details
        linkedinUrl: formatFieldValue(record.linkedinUrl, ''),
        linkedinNavigatorUrl: formatFieldValue(record.linkedinNavigatorUrl, ''),
        linkedinConnectionDate: formatDateValue(record.linkedinConnectionDate),
        bio: formatFieldValue(record.bio, ''),
        address: formatFieldValue(record.address, ''),
        city: formatFieldValue(record.city, ''),
        state: formatFieldValue(record.state, ''),
        country: formatFieldValue(record.country, ''),
        postalCode: formatFieldValue(record.postalCode, ''),
        
        // Status and priority
        status: record.status || 'new',
        priority: record.priority || 'medium',
        relationship: formatFieldValue(record.relationship, ''),
        
        // Opportunity fields
        estimatedValue: formatFieldValue(record.estimatedValue, ''),
        currency: record.currency || 'USD',
        expectedCloseDate: formatDateValue(record.expectedCloseDate),
        stage: formatFieldValue(record.stage || record.currentStage, ''),
        probability: formatFieldValue(record.probability, ''),
        
        // Activity fields
        nextAction: formatFieldValue(record.nextAction, ''),
        nextActionDate: formatDateValue(record.nextActionDate),
        lastActionDate: formatDateValue(record.lastActionDate),
        
        // Notes
        notes: formatFieldValue(record.notes || record.description, ''),
        tags: record.tags || []
      });
    }
  }, [record]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete || !record?.id) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await onDelete(record.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab content rendering using configuration - this replaces the large switch statement
  const renderTabContent = () => {
    // Use configuration to get the appropriate component
    const TabComponent = getTabComponent(activeTab, recordType);
    
    if (!TabComponent) {
      // Fallback to basic form rendering
      return renderBasicForm();
    }

    return (
      <TabComponent 
        record={formData} 
        recordType={recordType}
        onUpdate={handleInputChange}
      />
    );
  };

  // Basic form rendering as fallback
  const renderBasicForm = () => (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <CompanySelector
            value={formData.company}
            onChange={(company) => {
              if (company) {
                handleInputChange('company', company.name);
                handleInputChange('companyId', company.id);
                handleInputChange('companyDomain', company.domain || '');
              } else {
                handleInputChange('company', '');
                handleInputChange('companyId', '');
                handleInputChange('companyDomain', '');
              }
            }}
            placeholder="Search or add company..."
            className="w-full"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title || formData.jobTitle || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes || formData.description || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Edit {recordType.charAt(0).toUpperCase() + recordType.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[var(--border)]">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-[var(--button-background)] text-[var(--button-text)] rounded-lg hover:bg-[var(--button-hover)] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg p-3">
              <p className="text-sm text-[var(--error-text)]">{error}</p>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-[var(--overlay-bg)] bg-opacity-[var(--overlay-opacity)] flex items-center justify-center z-60">
            <div className="bg-[var(--background)] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-[var(--muted)] mb-4">
                Are you sure you want to delete this {recordType}? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export with the same name for compatibility
export const UpdateModal = UpdateModalV2;
