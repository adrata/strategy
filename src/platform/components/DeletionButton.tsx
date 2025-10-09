/**
 * 🎯 DELETION BUTTON COMPONENT
 * 
 * A reusable component for deletion actions
 */

import React from 'react';
import { useDeletion } from '@/platform/hooks/useDeletion';

export interface DeletionButtonProps {
  entityType: 'companies' | 'people' | 'actions';
  entityId: string;
  action: 'soft_delete' | 'restore' | 'hard_delete';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DeletionButton({
  entityType,
  entityId,
  action,
  onSuccess,
  onError,
  children,
  className = '',
  disabled = false,
}: DeletionButtonProps) {
  const { softDelete, restore, hardDelete, loading } = useDeletion();

  const handleClick = async () => {
    const options = {
      entityType,
      entityId,
      onSuccess,
      onError,
    };

    switch (action) {
      case 'soft_delete':
        await softDelete(options);
        break;
      case 'restore':
        await restore(options);
        break;
      case 'hard_delete':
        await hardDelete(options);
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
