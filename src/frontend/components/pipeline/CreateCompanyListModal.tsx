"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCompanyLists, CompanyList } from "@/platform/hooks/useCompanyLists";

interface CreateCompanyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingList?: CompanyList | null;
  currentFilters?: {
    searchQuery?: string;
    statusFilter?: string;
    priorityFilter?: string;
    verticalFilter?: string;
    revenueFilter?: string;
    lastContactedFilter?: string;
    timezoneFilter?: string;
    companySizeFilter?: string;
    locationFilter?: string;
    technologyFilter?: string;
    sortField?: string;
    sortDirection?: string;
  };
  useCurrentFilters?: boolean;
}

export function CreateCompanyListModal({
  isOpen,
  onClose,
  onSave,
  editingList,
  currentFilters,
  useCurrentFilters = false
}: CreateCompanyListModalProps) {
  const { createList, updateList } = useCompanyLists();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCurrentFilters, setSaveCurrentFilters] = useState(useCurrentFilters);

  const isEditMode = !!editingList;

  // Initialize form when modal opens or editingList changes
  useEffect(() => {
    if (isOpen) {
      if (editingList) {
        setName(editingList.name);
        setDescription(editingList.description || "");
        // Default to saving current filters when editing (especially when opened via "Update List")
        setSaveCurrentFilters(useCurrentFilters || true);
      } else {
        setName("");
        setDescription("");
        setSaveCurrentFilters(useCurrentFilters);
      }
      setError(null);
    }
  }, [isOpen, editingList, useCurrentFilters]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("List name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const listData: any = {
        name: name.trim(),
        description: description.trim() || undefined
      };

      // If saving current filters, include them (for both create and edit)
      if ((saveCurrentFilters || isEditMode) && currentFilters) {
        listData.filters = {
          statusFilter: currentFilters.statusFilter || 'all',
          priorityFilter: currentFilters.priorityFilter || 'all',
          verticalFilter: currentFilters.verticalFilter || 'all',
          revenueFilter: currentFilters.revenueFilter || 'all',
          lastContactedFilter: currentFilters.lastContactedFilter || 'all',
          timezoneFilter: currentFilters.timezoneFilter || 'all',
          companySizeFilter: currentFilters.companySizeFilter || 'all',
          locationFilter: currentFilters.locationFilter || 'all',
          technologyFilter: currentFilters.technologyFilter || 'all'
        };
        listData.sortField = currentFilters.sortField || null;
        listData.sortDirection = currentFilters.sortDirection || null;
        listData.searchQuery = currentFilters.searchQuery || null;
      } else if (editingList && !saveCurrentFilters) {
        // When editing without saving current filters, preserve existing filters
        listData.filters = editingList.filters;
        listData.sortField = editingList.sortField;
        listData.sortDirection = editingList.sortDirection;
        listData.searchQuery = editingList.searchQuery;
      }

      if (isEditMode && editingList) {
        await updateList(editingList.id, listData);
      } else {
        await createList(listData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save list:", err);
      setError(err instanceof Error ? err.message : "Failed to save list. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl border border-border w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditMode ? "Edit List" : "Create New List"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              List Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Priority Companies"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this list..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Save Current Filters Option */}
          {currentFilters && (
            <div className="flex items-start gap-3 p-4 bg-hover rounded-md border border-border">
              <input
                type="checkbox"
                id="saveCurrentFilters"
                checked={saveCurrentFilters}
                onChange={(e) => setSaveCurrentFilters(e.target.checked)}
                className="mt-1 rounded border-border text-primary focus:ring-primary"
                disabled={isSaving}
              />
              <label htmlFor="saveCurrentFilters" className="flex-1 text-sm text-foreground cursor-pointer">
                <div className="font-medium mb-1">
                  {isEditMode ? 'Update with current filters and sort' : 'Save current filters and sort'}
                </div>
                <div className="text-xs text-muted">
                  {isEditMode 
                    ? 'This will update the list with your current search, filters, and sort settings.'
                    : 'This will save your current search, filters, and sort settings to this list.'}
                </div>
              </label>
            </div>
          )}

          {/* Show current filters when editing */}
          {isEditMode && editingList && (
            <div className="p-4 bg-hover rounded-md border border-border">
              <div className="text-sm font-medium text-foreground mb-2">Current List Settings</div>
              <div className="text-xs text-muted space-y-1">
                {editingList.filters && (
                  <div>Filters: {Object.keys(editingList.filters).length} active</div>
                )}
                {editingList.sortField && (
                  <div>Sort: {editingList.sortField} ({editingList.sortDirection || 'asc'})</div>
                )}
                {editingList.searchQuery && (
                  <div>Search: "{editingList.searchQuery}"</div>
                )}
                {!editingList.filters && !editingList.sortField && !editingList.searchQuery && (
                  <div>No filters or sort settings saved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground hover:bg-hover rounded-md transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : isEditMode ? "Update List" : "Create List"}
          </button>
        </div>
      </div>
    </div>
  );
}

