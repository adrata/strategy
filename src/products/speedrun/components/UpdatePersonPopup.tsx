"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SpeedrunPerson } from "../types/SpeedrunTypes";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';
import { UniversalActionsTab } from '@/frontend/components/pipeline/tabs/UniversalActionsTab';

interface UpdatePersonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  person: SpeedrunPerson;
  onSave: (updatedPerson: Partial<SpeedrunPerson>) => void;
  onDelete?: (personId: string) => Promise<void>;
}

const TABS = [
  "Overview",
  "Actions", 
  "Intelligence",
  "Career",
  "Notes",
  "Delete",
] as const;

type TabType = (typeof TABS)[number];

export function UpdatePersonPopup({
  isOpen,
  onClose,
  person,
  onSave,
  onDelete,
}: UpdatePersonPopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: person.name || "",
    title: person.title || "",
    email: person.email || "",
    phone: person.phone || "",
    company: typeof person.company === 'object' ? person.company?.name || "" : person.company || "",
      companyId: typeof person.company === 'object' ? person.company?.id || "" : "",
    status: person.status || "Active",
    priority: person.priority || "Medium",
    nextAction: person.nextAction || "",
    relationship: person.relationship || "",
    bio: person.bio || "",
    linkedinNavigatorUrl: person.linkedinNavigatorUrl || "",
    linkedinConnectionDate: person.linkedinConnectionDate || "",
    notes: person.bio || "",
  });

  // Reset form when person changes
  useEffect(() => {
    setFormData({
      name: person.name || "",
      title: person.title || "",
      email: person.email || "",
      phone: person.phone || "",
      company: typeof person.company === 'object' ? person.company?.name || "" : person.company || "",
      companyId: typeof person.company === 'object' ? person.company?.id || "" : "",
      status: person.status || "Active",
      priority: person.priority || "Medium",
      nextAction: person.nextAction || "",
      relationship: person.relationship || "",
      bio: person.bio || "",
      linkedinNavigatorUrl: person.linkedinNavigatorUrl || "",
      linkedinConnectionDate: person.linkedinConnectionDate || "",
      notes: person.bio || "",
    });
  }, [person]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData: Partial<SpeedrunPerson> = {
      name: formData.name,
      title: formData.title,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      // companyId: formData.companyId, // Remove this line as it's not part of SpeedrunPerson
      status: formData.status,
      priority: formData.priority,
      nextAction: formData.nextAction,
      relationship: formData.relationship,
      bio: formData.bio,
      linkedinNavigatorUrl: formData.linkedinNavigatorUrl,
      linkedinConnectionDate: formData.linkedinConnectionDate,
    };

    onSave(updatedData);
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Command+Enter to save
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleSubmit(event as any);
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    document.addEventListener('keydown', handleKeyDown, false); // Bubble phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isOpen, handleSubmit, onClose]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getDisplayValue = (value: string | { name?: string }) => {
    if (typeof value === 'object' && value?.name) {
      return value.name;
    }
    return value || "-";
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={person.name || "-"}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder={person.title || "-"}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder={person.email || "-"}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder={person.phone || "-"}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
        />
      </div>
    </div>
  );

  const renderActionsTab = () => (
    <div className="space-y-6 max-h-[600px] overflow-y-auto">
      {/* Form Fields Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--foreground)]">Action Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Customer">Customer</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Next Action
          </label>
          <input
            type="text"
            value={formData.nextAction}
            onChange={(e) => handleChange("nextAction", e.target.value)}
            placeholder={person.nextAction || "-"}
            className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)]"></div>

      {/* Actions List Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--foreground)]">Existing Actions</h3>
        <UniversalActionsTab record={person} recordType="people" />
      </div>
    </div>
  );

  const renderIntelligenceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Relationship
        </label>
        <input
          type="text"
          value={formData.relationship}
          onChange={(e) => handleChange("relationship", e.target.value)}
          placeholder={person.relationship || "-"}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
        />
      </div>
    </div>
  );

  const renderCareerTab = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-[var(--muted)]">Career information will be available here</p>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio URL
        </label>
        <input
          type="url"
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder={person.bio || "-"}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn Navigator URL
        </label>
        <input
          type="url"
          value={formData.linkedinNavigatorUrl}
          onChange={(e) => handleChange("linkedinNavigatorUrl", e.target.value)}
          placeholder={person.linkedinNavigatorUrl || "-"}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn Connection Date
        </label>
        <input
          type="date"
          value={formData.linkedinConnectionDate}
          onChange={(e) => handleChange("linkedinConnectionDate", e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
        />
      </div>
    </div>
  );

  // Handle delete with Vercel-style confirmation
  const handleDelete = async () => {
    if (!person?.id) return;
    
    const personName = person.name || 'Unknown Person';
    
    if (deleteConfirmName !== personName) {
      alert(`Please type "${personName}" to confirm deletion.`);
      return;
    }

    try {
      setLoading(true);
      
      // Perform soft delete via new v1 deletion API
      const response = await fetch('/api/v1/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'soft_delete',
          entityType: 'people',
          entityId: person.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete person');
      }

      // Close the modal first
      onClose();
      
      // Call the onDelete callback if provided (this should handle navigation and success message)
      if (onDelete) {
        await onDelete(person.id);
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDeleteTab = () => {
    const personName = person.name || 'Unknown Person';
    
    return (
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Delete Person
          </h3>
          <p className="text-sm text-[var(--muted)] mb-6">
            This action cannot be undone. This will soft delete the person and remove them from your active lists.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Are you sure you want to delete this person?
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  To confirm, type <strong>"{personName}"</strong> in the box below:
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-2">
            Type the name to confirm deletion
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={personName}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleteConfirmName !== personName}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete Person'}
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return renderOverviewTab();
      case "Actions":
        return renderActionsTab();
      case "Intelligence":
        return renderIntelligenceTab();
      case "Career":
        return renderCareerTab();
      case "Notes":
        return renderNotesTab();
      case "Delete":
        return renderDeleteTab();
      default:
        return renderOverviewTab();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--background)] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)] dark:text-white">
            Update Contact Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)] dark:border-[var(--border)]">
          <nav className="flex space-x-8 px-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderTabContent()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 p-6 border-t border-[var(--border)] dark:border-[var(--border)] bg-[var(--background)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-[var(--hover)] dark:bg-gray-600 rounded-lg hover:bg-[var(--loading-bg)] dark:hover:bg-[var(--panel-background)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete ({getCommonShortcut('SUBMIT')})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}