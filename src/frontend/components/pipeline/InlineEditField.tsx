import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { InlineCompanySelector } from './InlineCompanySelector';

interface InlineEditFieldProps {
  value: string | null;
  field: string;
  onSave: (field: string, value: string | any, recordId: string, recordType: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number' | 'email';
  variant?: 'text' | 'textarea' | 'company';
  recordId?: string;
  recordType?: string;
  inputType?: string;
  options?: Array<{ value: string; label: string }>; // Added for select fields
  successMessage?: string;
  onSuccess?: (message: string) => void;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  field,
  onSave,
  className = '',
  placeholder = '',
  type = 'text',
  variant,
  recordId,
  recordType,
  inputType,
  options,
  successMessage,
  onSuccess,
}) => {
  // If variant is company, render the InlineCompanySelector
  if (variant === 'company') {
    return (
      <InlineCompanySelector
        value={value}
        field={field}
        onSave={onSave}
        className={className}
        placeholder={placeholder}
        recordId={recordId}
        recordType={recordType}
        onSuccess={onSuccess}
      />
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync editValue with value prop when it changes, but not while saving
  useEffect(() => {
    if (!isSaving) {
      setEditValue(value ?? '');
    }
  }, [value, isSaving]);

  const handleEditStart = () => {
    setEditValue(value ?? '');
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setIsSaving(true);
    try {
      // Pass all required parameters to onSave
      await onSave(field, editValue, recordId || '', recordType || '');
      
      // Show success message
      const message = successMessage || `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`;
      onSuccess?.(message);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating field:', error);
      onSuccess?.('Failed to update. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditValue(value ?? '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e['key'] === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e['key'] === 'Escape') {
      handleEditCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {type === 'textarea' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
        ) : inputType === 'select' && options ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={`flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType || type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            placeholder={placeholder}
            autoFocus
          />
        )}
        <button
          onClick={handleEditSave}
          disabled={isLoading}
          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleEditCancel}
          disabled={isLoading}
          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Get the display value - for select fields, show the label instead of the value
  const getDisplayValue = () => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return 'No data available';
    
    if (inputType === 'select' && options) {
      const option = options.find(opt => opt['value'] === value);
      return option ? option.label : value;
    }
    
    return value;
  };

  return (
    <div className="group flex flex-1 items-center gap-2 cursor-pointer p-1 rounded hover:bg-[var(--panel-background)] transition-colors min-w-0">
      <span className={`${className} ${!value || (typeof value === 'string' && value.trim() === '') ? 'text-[var(--muted)] italic' : ''}`}>
        {getDisplayValue()}
      </span>
      <button
        onClick={handleEditStart}
        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-blue-600 transition-all duration-200 hover:bg-blue-50 rounded"
        title="Click to edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    </div>
  );
};