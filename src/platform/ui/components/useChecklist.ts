/**
 * useChecklist Hook
 * 
 * Custom hook for managing checklist items with localStorage persistence.
 * Follows the same pattern as useTablePreferences for consistency.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface UseChecklistReturn {
  items: ChecklistItem[];
  addItem: (text: string) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  editItem: (id: string, text: string) => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generate a simple unique ID (similar to ULID but simpler)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load checklist items from localStorage
 */
function loadChecklistItems(storageKey: string): ChecklistItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that it's an array
      if (Array.isArray(parsed)) {
        // Filter out any invalid items and ensure all required fields exist
        return parsed
          .filter((item: any) => 
            item && 
            typeof item === 'object' && 
            typeof item.id === 'string' && 
            typeof item.text === 'string' &&
            typeof item.completed === 'boolean' &&
            typeof item.createdAt === 'number'
          )
          .map((item: any) => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            createdAt: item.createdAt,
            completedAt: typeof item.completedAt === 'number' ? item.completedAt : undefined
          }));
      }
    }
  } catch (error) {
    console.warn('Failed to load checklist items from localStorage:', error);
    // If corrupted, remove it and return empty array
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore errors removing corrupted data
    }
  }
  
  return [];
}

/**
 * Save checklist items to localStorage with error handling
 */
function saveChecklistItems(storageKey: string, items: ChecklistItem[]): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch (error: any) {
    // Handle quota exceeded or other errors
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('localStorage quota exceeded. Cannot save checklist items.');
      return false;
    }
    console.error('Failed to save checklist items to localStorage:', error);
    return false;
  }
}

/**
 * Hook for managing checklist items with localStorage persistence
 */
export function useChecklist(
  userId: string | undefined,
  workspaceId: string | undefined
): UseChecklistReturn {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate storage key based on userId and workspaceId
  const storageKey = userId && workspaceId 
    ? `checklist-${userId}-${workspaceId}` 
    : null;

  // Load items from localStorage on mount
  useEffect(() => {
    if (!storageKey) {
      setIsLoading(false);
      setError(userId && workspaceId ? null : 'User or workspace not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const loadedItems = loadChecklistItems(storageKey);
      setItems(loadedItems);
    } catch (err) {
      console.error('Error loading checklist items:', err);
      setError('Failed to load checklist items');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, userId, workspaceId]);

  // Save items to localStorage (debounced)
  const saveItems = useCallback((newItems: ChecklistItem[]) => {
    if (!storageKey) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveChecklistItems(storageKey, newItems);
      if (!success) {
        setError('Failed to save checklist items. Storage may be full.');
      } else {
        setError(null);
      }
    }, 100);
  }, [storageKey]);

  // Add new item
  const addItem = useCallback((text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't add empty items
    
    const newItem: ChecklistItem = {
      id: generateId(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now()
    };
    
    setItems(prev => {
      const newItems = [...prev, newItem];
      saveItems(newItems);
      return newItems;
    });
  }, [saveItems]);

  // Delete item
  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      saveItems(newItems);
      return newItems;
    });
  }, [saveItems]);

  // Toggle item completion
  const toggleItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          const isCompleting = !item.completed;
          return {
            ...item,
            completed: isCompleting,
            completedAt: isCompleting ? Date.now() : undefined
          };
        }
        return item;
      });
      saveItems(newItems);
      return newItems;
    });
  }, [saveItems]);

  // Edit item text
  const editItem = useCallback((id: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't allow empty items
    
    setItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            text: trimmedText
          };
        }
        return item;
      });
      saveItems(newItems);
      return newItems;
    });
  }, [saveItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    items,
    addItem,
    deleteItem,
    toggleItem,
    editItem,
    isLoading,
    error
  };
}

