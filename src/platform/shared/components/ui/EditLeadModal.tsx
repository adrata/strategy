import React, { useState, useEffect } from "react";
import type { Lead } from "@/platform/data-service";
import { AIStatusService } from "@/platform/ai/services/aiStatusService";
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { 
  UserIcon, 
  BriefcaseIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/solid';

interface EditLeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiStatusSuggestion, setAiStatusSuggestion] = useState<{
    status: string;
    confidence: number;
    reasoning: string[];
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "",
    title: lead.title || "",
    status: lead.status || "New",
    currentStage: lead.currentStage || "Generate",
    source: lead.source || "",
    notes: lead.notes || "",
    buyerGroupRole: lead.buyerGroupRole || "",
    relationship: lead.relationship || "",
    nextAction: lead.nextAction || "",
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "persona", label: "Persona" },
    { id: "notes", label: "Notes" },
    { id: "career", label: "Career" },
    { id: "workplace", label: "Workplace" },
    { id: "timeline", label: "Timeline" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updatedLead: Lead = {
      ...lead,
      ...formData,
    };
    onSave(updatedLead);
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
        handleSave();
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
  }, [isOpen, handleSave, onClose]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmName('');
  };

  const handleDeleteConfirm = async () => {
    const recordName = lead.name || 'this lead';
    
    if (deleteConfirmName !== recordName) {
      alert(`Please type "${recordName}" to confirm deletion.`);
      return;
    }

    try {
      setIsDeleting(true);
      
      // Perform soft delete via API
      const response = await fetch(`/api/data/unified?type=${encodeURIComponent('leads')}&id=${encodeURIComponent(lead.id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      // Close the modal first
      onClose();
      
      // Call the onDelete callback if provided (this should handle navigation and success message)
      if (onDelete) {
        await onDelete(lead.id);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Calculate AI status when modal opens or lead data changes
  useEffect(() => {
    if (isOpen && lead) {
      const statusResult = AIStatusService.getLeadStatus(lead);
      setAiStatusSuggestion(statusResult);
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Edit Lead: {lead.name}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleInputChange("source", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source...</option>
                  <option value="Web">Web</option>
                  <option value="Referral">Referral</option>
                  <option value="Event">Event</option>
                  <option value="Ad">Ad</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <select
                  value={formData.currentStage}
                  onChange={(e) =>
                    handleInputChange("currentStage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Generate">Generate</option>
                  <option value="Initiate">Initiate</option>
                  <option value="Educate">Educate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buyer Group Role
                </label>
                <select
                  value={formData.buyerGroupRole}
                  onChange={(e) =>
                    handleInputChange("buyerGroupRole", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role...</option>
                  <option value="Champion">Champion</option>
                  <option value="Decision Maker">Decision Maker</option>
                  <option value="Stakeholder">Stakeholder</option>
                  <option value="Influencer">Influencer</option>
                  <option value="Blocker">Blocker</option>
                  <option value="Opener">Opener</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) =>
                    handleInputChange("relationship", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                  <option value="New">New</option>
                </select>

                {/* AI Status Suggestion */}
                {aiStatusSuggestion && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        🤖 AI Recommendation:{" "}
                        <strong>{aiStatusSuggestion.status}</strong>
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {aiStatusSuggestion.confidence}% confidence
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mb-2">
                      Based on:{" "}
                      {aiStatusSuggestion.reasoning.slice(0, 2).join(", ")}
                      {aiStatusSuggestion.reasoning.length > 2 && "..."}
                    </div>
                    {formData.relationship !== aiStatusSuggestion['status'] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            "relationship",
                            aiStatusSuggestion.status,
                          )
                        }
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Accept AI Suggestion
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-[var(--muted)] mt-1">
                  AI-powered status based on engagement data
                </p>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this lead..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) =>
                    handleInputChange("nextAction", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's the next step for this lead?"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between">
          <div>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-[var(--background)] border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Lead
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-md hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Complete ({getCommonShortcut('SUBMIT')})
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-medium text-[var(--foreground)]">Delete Lead</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[var(--muted)] mb-4">
                This action cannot be undone. This will soft delete the record and remove it from your active lists.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this lead? To confirm, type "{lead.name}" in the box below:
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={`Type "${lead.name}" to confirm`}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-md hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || deleteConfirmName !== lead.name}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
