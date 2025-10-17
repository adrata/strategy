import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { InlineCompanySelector } from './InlineCompanySelector';
import { DatePicker } from '@/platform/ui/components/DatePicker';

interface InlineEditFieldProps {
  value: string | null;
  field: string;
  onSave: (field: string, value: string | any, recordId: string, recordType: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number' | 'email';
  variant?: 'text' | 'textarea' | 'company' | 'date';
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

  // If variant is date, render the InlineDateSelector
  if (variant === 'date') {
    return (
      <InlineDateSelector
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
      
      // Only close edit mode on successful save
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update. Please try again.';
      onSuccess?.(`Error: ${errorMessage}`);
      
      // Keep edit mode open on error so user can retry or cancel
      // Don't close the edit mode here
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
            className={`flex-1 px-2 py-1 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background)] text-[var(--foreground)] ${className}`}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
        ) : inputType === 'select' && options ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={`flex-1 px-2 py-1 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background)] text-[var(--foreground)] ${className}`}
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
            className={`flex-1 px-2 py-1 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background)] text-[var(--foreground)] ${className}`}
            placeholder={placeholder}
            autoFocus
          />
        )}
        <button
          onClick={handleEditSave}
          disabled={isLoading}
          className="p-1 text-[var(--success)] hover:text-[var(--success-text)] disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleEditCancel}
          disabled={isLoading}
          className="p-1 text-[var(--error)] hover:text-[var(--error-text)] disabled:opacity-50"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Get the display value - for select fields, show the label instead of the value
  const getDisplayValue = () => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return '-';
    
    if (inputType === 'select' && options) {
      const option = options.find(opt => opt['value'] === value);
      return option ? option.label : value;
    }
    
    return value;
  };

  return (
    <div className="group flex flex-1 items-center gap-2 cursor-pointer p-1 rounded hover:bg-[var(--panel-background)] transition-colors min-w-0">
      <span className={`${className} ${!value || (typeof value === 'string' && value.trim() === '') ? 'text-[var(--muted)]' : ''}`}>
        {getDisplayValue()}
      </span>
      <button
        onClick={handleEditStart}
        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-all duration-200 hover:bg-[var(--hover)] rounded"
        title="Click to edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// InlineDateSelector component for date fields
interface InlineDateSelectorProps {
  value: string | null;
  field: string;
  onSave: (field: string, value: string | any, recordId: string, recordType: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  recordId?: string;
  recordType?: string;
  onSuccess?: (message: string) => void;
}

const InlineDateSelector: React.FC<InlineDateSelectorProps> = ({
  value,
  field,
  onSave,
  className = '',
  placeholder = 'Select date',
  recordId,
  recordType,
  onSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get current date for display
  const getCurrentDate = (): string => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      handleSave(date.toISOString());
    }
  };

  const handleSave = async (dateValue: string) => {
    setIsLoading(true);
    setIsSaving(true);
    try {
      await onSave(field, dateValue, recordId || '', recordType || '');
      
      const message = `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`;
      onSuccess?.(message);
      
      // Only close edit mode on successful save
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating date field:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update. Please try again.';
      onSuccess?.(`Error: ${errorMessage}`);
      
      // Keep edit mode open on error so user can retry or cancel
      // Don't close the edit mode here
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <DatePicker
            value={value ? new Date(value) : undefined}
            onChange={handleDateChange}
            placeholder={placeholder}
            className={className}
          />
        </div>
        <button
          onClick={handleEditCancel}
          disabled={isLoading}
          className="p-1 text-[var(--error)] hover:text-[var(--error-text)] disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <span className={`${className} ${!getCurrentDate() ? 'text-[var(--muted)]' : ''}`}>
        {getCurrentDate() || '-'}
      </span>
      <button
        onClick={handleEditStart}
        className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit"
      >
        <PencilIcon className="h-3 w-3" />
      </button>
    </div>
  );
};