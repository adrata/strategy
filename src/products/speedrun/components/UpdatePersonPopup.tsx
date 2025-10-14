"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SpeedrunPerson } from "../types/SpeedrunTypes";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';

interface UpdatePersonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  person: SpeedrunPerson;
  onSave: (updatedPerson: Partial<SpeedrunPerson>) => void;
}

const TABS = [
  "Overview",
  "Actions", 
  "Intelligence",
  "Career",
  "Notes",
] as const;

type TabType = (typeof TABS)[number];

export function UpdatePersonPopup({
  isOpen,
  onClose,
  person,
  onSave,
}: UpdatePersonPopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [formData, setFormData] = useState({
    name: person.name || "",
    title: person.title || "",
    email: person.email || "",
    phone: person.phone || "",
    company: typeof person.company === 'object' ? person.company?.name || "" : person.company || "",
    companyId: person.companyId || "",
    status: person.status || "Active",
    priority: person.priority || "Medium",
    nextAction: person.nextAction || "",
    relationship: person.relationship || "",
    bio: person.bio || "",
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
      companyId: person.companyId || "",
      status: person.status || "Active",
      priority: person.priority || "Medium",
      nextAction: person.nextAction || "",
      relationship: person.relationship || "",
      bio: person.bio || "",
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
      companyId: formData.companyId,
      status: formData.status,
      priority: formData.priority,
      nextAction: formData.nextAction,
      relationship: formData.relationship,
      bio: formData.bio,
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
            placeholder={getDisplayValue(person.name)}
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
            placeholder={getDisplayValue(person.title)}
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
            placeholder={getDisplayValue(person.email)}
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
            placeholder={getDisplayValue(person.phone)}
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
    <div className="space-y-6">
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
          placeholder={getDisplayValue(person.nextAction)}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white"
        />
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
          placeholder={getDisplayValue(person.relationship)}
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
          Notes
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={6}
          placeholder={getDisplayValue(person.bio)}
          className="w-full px-3 py-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] dark:text-white resize-none"
        />
      </div>
    </div>
  );

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