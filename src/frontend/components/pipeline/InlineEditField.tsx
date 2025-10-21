import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon, ArrowTopRightOnSquareIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { InlineCompanySelector } from './InlineCompanySelector';
import { DatePicker } from '@/platform/ui/components/DatePicker';
import { formatUrlForDisplay, getUrlDisplayName } from '@/platform/utils/urlFormatter';

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
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync editValue with value prop when it changes, but not while saving
  useEffect(() => {
    if (!isSaving) {
      setEditValue(value ?? '');
    }
  }, [value, isSaving]);

  const handleEditStart = () => {
    // Clear dash placeholder when starting edit
    const initialValue = value === '-' ? '' : (value ?? '');
    setEditValue(initialValue);
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
      // Clean up the value before saving
      let cleanedValue = editValue;
      
      // Handle empty values and placeholders
      if (!cleanedValue || cleanedValue.trim() === '' || cleanedValue === '-') {
        cleanedValue = null;
      } else {
        // Trim whitespace but keep the value if it's not empty
        cleanedValue = cleanedValue.trim();
      }
      
      // Pass all required parameters to onSave
      await onSave(field, cleanedValue, recordId || '', recordType || '');
      
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

  // Helper function to check if field is copyable
  const isCopyableField = () => {
    const copyableFields = [
      'email', 'workEmail', 'personalEmail', 'secondaryEmail',
      'phone', 'mobilePhone', 'workPhone'
    ];
    // Don't show copy icon for URL fields - users can click the URL directly
    return copyableFields.includes(field) || inputType === 'email' || inputType === 'tel';
  };

  // Copy to clipboard function
  const handleCopy = async () => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      // Reset the success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
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

  // Helper function to check if field is a URL field
  const isUrlField = () => {
    const urlFields = ['linkedinUrl', 'linkedinNavigatorUrl', 'twitterUrl', 'facebookUrl', 'instagramUrl', 'youtubeUrl', 'githubUrl', 'website'];
    return urlFields.includes(field) || inputType === 'url';
  };

  // Helper function to validate if a string is a valid URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Get the display value - for select fields, show the label instead of the value
  const getDisplayValue = () => {
    if (!value || (typeof value === 'string' && (value.trim() === '' || value === '-')) || value === null) return '-';
    
    if (inputType === 'select' && options) {
      const option = options.find(opt => opt['value'] === value);
      return option ? option.label : value;
    }
    
    // For URL fields, format for display
    if (isUrlField() && value && typeof value === 'string' && value.trim() !== '' && value !== '-') {
      return formatUrlForDisplay(value, { maxLength: 60, preserveEnding: 20 });
    }
    
    return value;
  };

  // Render URL as clickable link if it's a URL field and has a valid URL
  const renderUrlContent = () => {
    if (isUrlField() && value && typeof value === 'string' && value.trim() !== '' && value !== '-' && isValidUrl(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} text-blue-600 hover:text-blue-700 hover:underline transition-colors`}
          onClick={(e) => e.stopPropagation()} // Prevent triggering edit mode when clicking link
          title={value} // Show full URL on hover
        >
          {getDisplayValue()}
        </a>
      );
    }
    return (
      <span className={`${className} ${!value || (typeof value === 'string' && (value.trim() === '' || value === '-')) ? 'text-[var(--muted)]' : ''}`}>
        {getDisplayValue()}
      </span>
    );
  };

  return (
    <div className="group flex flex-1 items-center gap-2 cursor-pointer p-1 rounded hover:bg-[var(--panel-background)] transition-colors min-w-0">
      {renderUrlContent()}
      <button
        onClick={handleEditStart}
        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-all duration-200 hover:bg-[var(--hover)] rounded"
        title="Click to edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      {isCopyableField() && value && typeof value === 'string' && value.trim() !== '' && value !== '-' && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-all duration-200 hover:bg-[var(--hover)] rounded"
          title={copySuccess ? "Copied!" : "Copy to clipboard"}
        >
          {copySuccess ? (
            <CheckIcon className="w-4 h-4 text-green-600" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
        </button>
      )}
      {isUrlField() && value && typeof value === 'string' && value.trim() !== '' && value !== '-' && isValidUrl(value) && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-all duration-200 hover:bg-[var(--hover)] rounded"
          title="Open in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </a>
      )}
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

  const handleQuickDate = (dateType: 'today' | 'yesterday') => {
    const today = new Date();
    let targetDate: Date;
    
    if (dateType === 'today') {
      targetDate = new Date(today);
    } else {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
    }
    
    handleSave(targetDate.toISOString());
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        {/* Quick action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickDate('today')}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Today
          </button>
          <button
            onClick={() => handleQuickDate('yesterday')}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Yesterday
          </button>
        </div>
        
        {/* Date picker */}
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