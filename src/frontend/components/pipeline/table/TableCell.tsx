/**
 * Editable Table Cell Component
 * Handles inline editing for table cells with hover edit/copy icons
 */

import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, ClipboardIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BUYER_GROUP_ROLES, getRoleLabel, getRoleValue } from '@/platform/constants/buyer-group-roles';

interface TableCellProps {
  value: string | number;
  field: string;
  recordId: string;
  recordType: string;
  isEditable?: boolean;
  className?: string;
  onUpdate: (recordId: string, field: string, value: string) => Promise<boolean>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function TableCell({
  value,
  field,
  recordId,
  recordType,
  isEditable = true,
  className = '',
  onUpdate,
  onSuccess,
  onError,
}: TableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue with value prop when it changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value || ''));
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Don't make certain fields editable
  const readOnlyFields = ['id', 'createdAt', 'updatedAt', 'lastActionTime', 'nextActionTime'];
  const isFieldEditable = isEditable && !readOnlyFields.includes(field);
  
  // Check if this is a role field that should use a dropdown
  const isRoleField = field === 'role' || field === 'buyerGroupRole';

  // Helper function to check if field is copyable
  const isCopyableField = () => {
    const copyableFields = [
      'email', 'workEmail', 'personalEmail', 'secondaryEmail',
      'phone', 'mobilePhone', 'workPhone', 'phoneNumber'
    ];
    return copyableFields.includes(field.toLowerCase());
  };

  // Copy to clipboard function
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit mode
    const valueToCopy = String(value || '');
    if (!valueToCopy || valueToCopy.trim() === '' || valueToCopy === '-') return;
    
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopySuccess(true);
      // Reset the success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = valueToCopy;
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

  const handleEditStart = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent row click when clicking edit icon
    }
    if (isFieldEditable && !isEditing) {
      let initialValue = value === '-' ? '' : String(value || '');
      // For role fields, ensure we use the database value
      if (isRoleField && initialValue) {
        initialValue = getRoleValue(initialValue);
      }
      setEditValue(initialValue);
      setIsEditing(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click on double-click
    if (isFieldEditable) {
      let initialValue = value === '-' ? '' : String(value || '');
      // For role fields, ensure we use the database value
      if (isRoleField && initialValue) {
        initialValue = getRoleValue(initialValue);
      }
      setEditValue(initialValue);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (editValue === String(value)) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await onUpdate(recordId, field, editValue);
      if (success) {
        setIsEditing(false);
        onSuccess?.(`${field} updated successfully`);
      } else {
        setEditValue(String(value)); // Revert on failure
        onError?.(`Failed to update ${field}`);
      }
    } catch (error) {
      setEditValue(String(value)); // Revert on error
      onError?.(`Failed to update ${field}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  // Get display value
  let displayValue = String(value || '-');
  // For role fields, show the human-readable label
  if (isRoleField && value && displayValue !== '-') {
    displayValue = getRoleLabel(displayValue);
  }
  const hasValue = value && displayValue !== '-';

  if (!isFieldEditable) {
    return (
      <td className={`px-6 py-3 whitespace-nowrap text-sm ${className}`}>
        <span className="text-foreground">{displayValue}</span>
      </td>
    );
  }

  if (isEditing) {
    return (
      <td className={`px-6 py-3 whitespace-nowrap text-sm ${className}`}>
        <div className="relative">
          {isRoleField ? (
            // Dropdown for role selection
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none pr-8"
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()} // Prevent row click
            >
              {BUYER_GROUP_ROLES.map(role => (
                <option key={role.value} value={role.value} title={role.description}>
                  {role.label}
                </option>
              ))}
            </select>
          ) : (
            // Regular input for other fields
            <input
              ref={inputRef}
              type={field === 'rank' || field === 'globalRank' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
              min={field === 'rank' || field === 'globalRank' ? 1 : undefined}
              max={field === 'rank' || field === 'globalRank' ? 999 : undefined}
              placeholder={field === 'rank' || field === 'globalRank' ? 'Enter rank (1-999)' : ''}
              onClick={(e) => e.stopPropagation()} // Prevent row click
            />
          )}
          {isRoleField && !isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-muted" />
            </div>
          )}
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </td>
    );
  }

  const canCopy = isCopyableField() && hasValue;

  return (
    <td
      className={`px-6 py-3 whitespace-nowrap text-sm ${className}`}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        // Only trigger edit on cell click if not clicking on icons or buttons
        // Don't stop propagation - let row click handle navigation
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('svg')) {
          // Single click on cell text doesn't edit - use double-click or edit icon
          // This allows row click to work for navigation
        }
      }}
    >
      <div className="group flex items-center gap-2 min-w-0">
        <span className="text-foreground flex-1 truncate">{displayValue}</span>
        {isRoleField && isFieldEditable && (
          <ChevronDownIcon className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isFieldEditable && (
            <button
              onClick={handleEditStart}
              className="p-1 text-muted hover:text-primary transition-colors hover:bg-hover rounded"
              title={isRoleField ? "Change role" : "Edit"}
              type="button"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {canCopy && (
            <button
              onClick={handleCopy}
              className="p-1 text-muted hover:text-primary transition-colors hover:bg-hover rounded"
              title={copySuccess ? "Copied!" : "Copy to clipboard"}
              type="button"
            >
              {copySuccess ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ClipboardIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </td>
  );
}