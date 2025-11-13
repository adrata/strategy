"use client";

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAvailableFields, getDefaultVisibleFields, groupFieldsByCategory, FieldOption } from './utils/availableFields';

interface FieldSelectionProps {
  section: string;
  selectedFields: string[];
  onChange: (fields: string[]) => void;
  defaultFields?: string[];
}

export function FieldSelection({
  section,
  selectedFields,
  onChange,
  defaultFields
}: FieldSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const availableFields = useMemo(() => getAvailableFields(section), [section]);
  const defaultVisibleFields = defaultFields || getDefaultVisibleFields(section);
  
  // Filter fields by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableFields;
    }
    const query = searchQuery.toLowerCase();
    return availableFields.filter(field =>
      field.label.toLowerCase().includes(query) ||
      field.value.toLowerCase().includes(query) ||
      field.category?.toLowerCase().includes(query)
    );
  }, [availableFields, searchQuery]);
  
  // Group filtered fields by category
  const groupedFields = useMemo(() => {
    return groupFieldsByCategory(filteredFields);
  }, [filteredFields]);
  
  // Initialize expanded categories
  React.useEffect(() => {
    const categories = Object.keys(groupedFields);
    const initialExpanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      initialExpanded[cat] = true; // Expand all by default
    });
    setExpandedCategories(initialExpanded);
  }, [groupedFields]);
  
  const toggleField = (fieldValue: string) => {
    if (selectedFields.includes(fieldValue)) {
      onChange(selectedFields.filter(f => f !== fieldValue));
    } else {
      onChange([...selectedFields, fieldValue]);
    }
  };
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const selectAll = () => {
    onChange(availableFields.map(f => f.value));
  };
  
  const selectNone = () => {
    onChange([]);
  };
  
  const resetToDefaults = () => {
    onChange([...defaultVisibleFields]);
  };
  
  const selectCategory = (category: string) => {
    const categoryFields = groupedFields[category] || [];
    const categoryValues = categoryFields.map(f => f.value);
    const newSelection = [...new Set([...selectedFields, ...categoryValues])];
    onChange(newSelection);
  };
  
  const deselectCategory = (category: string) => {
    const categoryFields = groupedFields[category] || [];
    const categoryValues = categoryFields.map(f => f.value);
    onChange(selectedFields.filter(f => !categoryValues.includes(f)));
  };
  
  if (availableFields.length === 0) {
    return (
      <div className="text-sm text-muted p-4">
        No fields available for this section.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fields..."
          className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={selectAll}
          className="px-3 py-1.5 text-xs bg-hover hover:bg-hover/80 text-foreground rounded-md transition-colors"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={selectNone}
          className="px-3 py-1.5 text-xs bg-hover hover:bg-hover/80 text-foreground rounded-md transition-colors"
        >
          Select None
        </button>
        <button
          type="button"
          onClick={resetToDefaults}
          className="px-3 py-1.5 text-xs bg-hover hover:bg-hover/80 text-foreground rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
      
      {/* Selected Count */}
      <div className="text-xs text-muted">
        {selectedFields.length} of {availableFields.length} fields selected
      </div>
      
      {/* Fields by Category */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(groupedFields).map(([category, fields]) => (
          <div key={category} className="border border-border rounded-md">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-3 py-2 bg-hover hover:bg-hover/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{category}</span>
                <span className="text-xs text-muted">
                  ({fields.filter(f => selectedFields.includes(f.value)).length}/{fields.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {expandedCategories[category] ? (
                  <ChevronUpIcon className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-muted" />
                )}
              </div>
            </button>
            
            {/* Category Actions */}
            {expandedCategories[category] && (
              <div className="px-3 py-1.5 border-b border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => selectCategory(category)}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  onClick={() => deselectCategory(category)}
                  className="text-xs text-primary hover:underline"
                >
                  Deselect All
                </button>
              </div>
            )}
            
            {/* Fields List */}
            {expandedCategories[category] && (
              <div className="p-2 space-y-1">
                {fields.map((field) => (
                  <label
                    key={field.value}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-hover rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.value)}
                      onChange={() => toggleField(field.value)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground flex-1">{field.label}</span>
                    {field.description && (
                      <span className="text-xs text-muted" title={field.description}>
                        ℹ️
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Validation Message */}
      {selectedFields.length === 0 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
          At least one field must be selected
        </div>
      )}
    </div>
  );
}

