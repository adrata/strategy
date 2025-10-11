"use client";

/**
 * UPDATE MODAL - REFACTORED
 * 
 * Refactored version that uses the tab registry instead of large switch statements.
 * This makes the component more maintainable and easier to extend.
 */

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
import { getTabsForRecordType, getTabComponent, getTabConfig } from './config/tab-registry';

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
  timestamp?: string;
}

export function UpdateModalRefactored({ 
  isOpen, 
  onClose, 
  record, 
  recordType, 
  onUpdate, 
  onDelete, 
  initialTab = 'overview',
  context = 'main',
  sourceApp 
}: UpdateModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState(record || {});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Get available tabs for this record type
  const availableTabs = getTabsForRecordType(recordType);
  
  // Update form data when record changes
  useEffect(() => {
    if (record) {
      setFormData(record);
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
    setLoading(true);
    
    try {
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete || !record?.id) return;
    
    setLoading(true);
    try {
      await onDelete(record.id);
      onClose();
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render tab content using the registry
  const renderTabContent = () => {
    const TabComponent = getTabComponent(recordType, activeTab);
    const tabConfig = getTabConfig(recordType, activeTab);
    
    if (!TabComponent) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>Tab "{activeTab}" not found for record type "{recordType}"</p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {tabConfig?.label || activeTab}
          </h3>
          {tabConfig?.description && (
            <p className="text-sm text-gray-600 mt-1">
              {tabConfig.description}
            </p>
          )}
        </div>
        
        <TabComponent 
          record={formData}
          recordType={recordType}
          onSave={handleInputChange}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {recordType === 'people' && <UserIcon className="h-6 w-6 text-blue-600" />}
              {recordType === 'companies' && <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />}
              {recordType === 'leads' && <TagIcon className="h-6 w-6 text-blue-600" />}
              {recordType === 'prospects' && <TagIcon className="h-6 w-6 text-blue-600" />}
              {recordType === 'opportunities' && <BriefcaseIcon className="h-6 w-6 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit {recordType.slice(0, -1)}
              </h2>
              <p className="text-sm text-gray-600">
                {formData.name || formData.fullName || 'Untitled'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={`Close (${getCommonShortcut('close')})`}
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={loading}
              >
                Delete
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this {recordType.slice(0, -1)}? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type the name to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={formData.name || formData.fullName || 'Record name'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmName !== (formData.name || formData.fullName || '') || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
