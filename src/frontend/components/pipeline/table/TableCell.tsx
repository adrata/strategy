/**
 * Editable Table Cell Component
 * Handles inline editing for table cells
 */

import React, { useState, useRef, useEffect } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = () => {
    console.log('🖱️ TableCell clicked:', { field, isFieldEditable, isEditing });
    if (isFieldEditable && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleDoubleClick = () => {
    if (isFieldEditable) {
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

  if (!isFieldEditable) {
    return (
      <td className={`px-6 py-3 whitespace-nowrap text-sm ${className}`}>
        <span className="text-[var(--foreground)]">{value || '-'}</span>
      </td>
    );
  }

  if (isEditing) {
    return (
      <td className={`px-6 py-3 whitespace-nowrap text-sm ${className}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type={field === 'rank' || field === 'globalRank' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            disabled={isLoading}
            min={field === 'rank' || field === 'globalRank' ? 1 : undefined}
            max={field === 'rank' || field === 'globalRank' ? 999 : undefined}
            placeholder={field === 'rank' || field === 'globalRank' ? 'Enter rank (1-999)' : ''}
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </td>
    );
  }

  return (
    <td
      className={`px-6 py-3 whitespace-nowrap text-sm cursor-pointer hover:bg-[var(--hover)] transition-colors ${className}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Click to edit"
    >
      <span className="text-[var(--foreground)]">{value || '-'}</span>
    </td>
  );
}