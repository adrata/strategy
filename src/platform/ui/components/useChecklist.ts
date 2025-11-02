/**
 * useChecklist Hook
 * 
 * Custom hook for managing checklist items with Daily 100 preset support.
 * Handles daily resets, preset templates, and custom items.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PresetTemplateId, 
  getPresetItems, 
  getDefaultPreset,
  type PresetItem 
} from './daily100Presets';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  itemType: 'preset' | 'custom';
  presetTemplateId?: PresetTemplateId;
}

interface UseChecklistReturn {
  items: ChecklistItem[];
  presetItems: ChecklistItem[];
  customItems: ChecklistItem[];
  addItem: (text: string) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  editItem: (id: string, text: string) => void;
  isLoading: boolean;
  error: string | null;
  currentPreset: PresetTemplateId;
  lastResetDate: string | null;
}

/**
 * Generate a simple unique ID (similar to ULID but simpler)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Load preset preference from localStorage
 */
function loadPresetPreference(storageKey: string): PresetTemplateId {
  if (typeof window === 'undefined') return 'elite-seller';
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'string' && ['elite-seller', 'pipeline-builder', 'relationship-builder', 'growth-mindset', 'balanced', 'custom-only'].includes(parsed)) {
        return parsed as PresetTemplateId;
      }
    }
  } catch (error) {
    console.warn('Failed to load preset preference:', error);
  }
  
  return 'elite-seller'; // Default
}

/**
 * Save preset preference to localStorage
 */
function savePresetPreference(storageKey: string, presetId: PresetTemplateId): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(presetId));
    return true;
  } catch (error: any) {
    console.error('Failed to save preset preference:', error);
    return false;
  }
}

/**
 * Load last reset date from localStorage
 */
function loadLastResetDate(storageKey: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'string') {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load last reset date:', error);
  }
  
  return null;
}

/**
 * Save last reset date to localStorage
 */
function saveLastResetDate(storageKey: string, date: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(date));
    return true;
  } catch (error: any) {
    console.error('Failed to save last reset date:', error);
    return false;
  }
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
            completedAt: typeof item.completedAt === 'number' ? item.completedAt : undefined,
            itemType: item.itemType === 'preset' ? 'preset' : 'custom',
            presetTemplateId: item.presetTemplateId || undefined
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
 * Create checklist items from preset items
 */
function createPresetChecklistItems(presetItems: PresetItem[], presetId: PresetTemplateId): ChecklistItem[] {
  return presetItems.map(item => ({
    id: item.id,
    text: item.text,
    completed: false,
    createdAt: Date.now(),
    itemType: 'preset' as const,
    presetTemplateId: presetId
  }));
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
 * Hook for managing checklist items with Daily 100 preset support
 */
export function useChecklist(
  userId: string | undefined,
  workspaceId: string | undefined
): UseChecklistReturn {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [currentPreset, setCurrentPreset] = useState<PresetTemplateId>('elite-seller');
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate storage keys based on userId and workspaceId
  const checklistStorageKey = userId && workspaceId 
    ? `checklist-${userId}-${workspaceId}` 
    : null;
  const presetStorageKey = userId && workspaceId
    ? `daily100-preset-${userId}-${workspaceId}`
    : null;
  const resetDateStorageKey = userId && workspaceId
    ? `daily100-lastReset-${userId}-${workspaceId}`
    : null;

  // Check if daily reset is needed
  const checkDailyReset = useCallback((loadedItems: ChecklistItem[], presetId: PresetTemplateId, savedResetDate: string | null): ChecklistItem[] => {
    const today = getTodayDateString();
    
    // If no reset date saved, this is first time - initialize preset items
    if (!savedResetDate) {
      const presetItems = getPresetItems(presetId);
      if (presetItems.length > 0) {
        const presetChecklistItems = createPresetChecklistItems(presetItems, presetId);
        const customItems = loadedItems.filter(item => item.itemType === 'custom');
        return [...presetChecklistItems, ...customItems];
      }
      return loadedItems;
    }
    
    // If reset date is not today, reset preset items
    if (savedResetDate !== today) {
      const presetItems = getPresetItems(presetId);
      const presetChecklistItems = createPresetChecklistItems(presetItems, presetId);
      const customItems = loadedItems.filter(item => item.itemType === 'custom');
      
      // Update last reset date
      if (resetDateStorageKey) {
        saveLastResetDate(resetDateStorageKey, today);
        setLastResetDate(today);
      }
      
      return [...presetChecklistItems, ...customItems];
    }
    
    return loadedItems;
  }, [resetDateStorageKey]);

  // Load items from localStorage on mount and check for daily reset
  useEffect(() => {
    if (!checklistStorageKey || !presetStorageKey || !resetDateStorageKey) {
      setIsLoading(false);
      setError(userId && workspaceId ? null : 'User or workspace not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Load preset preference
      const loadedPreset = loadPresetPreference(presetStorageKey);
      setCurrentPreset(loadedPreset);
      
      // Load last reset date
      const savedResetDate = loadLastResetDate(resetDateStorageKey);
      setLastResetDate(savedResetDate);
      
      // Load checklist items
      const loadedItems = loadChecklistItems(checklistStorageKey);
      
      // Check if daily reset is needed and apply it
      const itemsAfterReset = checkDailyReset(loadedItems, loadedPreset, savedResetDate);
      
      // If preset changed or items were reset, we may need to sync preset items
      const presetItems = getPresetItems(loadedPreset);
      const existingPresetIds = new Set(itemsAfterReset.filter(item => item.itemType === 'preset').map(item => item.id));
      const expectedPresetIds = new Set(presetItems.map(item => item.id));
      
      // If preset items don't match current preset, replace them
      if (loadedPreset !== 'custom-only' && presetItems.length > 0) {
        const presetItemsMatch = presetItems.every(item => existingPresetIds.has(item.id));
        
        if (!presetItemsMatch) {
          // Replace preset items with current preset
          const customItems = itemsAfterReset.filter(item => item.itemType === 'custom');
          const newPresetItems = createPresetChecklistItems(presetItems, loadedPreset);
          setItems([...newPresetItems, ...customItems]);
          
          // Save updated items
          if (checklistStorageKey) {
            saveChecklistItems(checklistStorageKey, [...newPresetItems, ...customItems]);
          }
        } else {
          setItems(itemsAfterReset);
        }
      } else {
        setItems(itemsAfterReset);
      }
    } catch (err) {
      console.error('Error loading checklist items:', err);
      setError('Failed to load checklist items');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [checklistStorageKey, presetStorageKey, resetDateStorageKey, userId, workspaceId, checkDailyReset]);

  // Save items to localStorage (debounced)
  const saveItems = useCallback((newItems: ChecklistItem[]) => {
    if (!checklistStorageKey) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveChecklistItems(checklistStorageKey, newItems);
      if (!success) {
        setError('Failed to save checklist items. Storage may be full.');
      } else {
        setError(null);
      }
    }, 100);
  }, [checklistStorageKey]);

  // Add new item (always custom)
  const addItem = useCallback((text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't add empty items
    
    const newItem: ChecklistItem = {
      id: generateId(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now(),
      itemType: 'custom'
    };
    
    setItems(prev => {
      const newItems = [...prev, newItem];
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

  // Edit item text (only for custom items)
  const editItem = useCallback((id: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't allow empty items
    
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      // Don't allow editing preset items
      if (item && item.itemType === 'preset') {
        return prev;
      }
      
      const newItems = prev.map(item => {
        if (item.id === id && item.itemType === 'custom') {
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

  // Delete item (only custom items can be deleted)
  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      // Don't allow deleting preset items
      if (item && item.itemType === 'preset') {
        return prev;
      }
      
      const newItems = prev.filter(item => item.id !== id);
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

  // Separate preset and custom items
  const presetItems = items.filter(item => item.itemType === 'preset');
  const customItems = items.filter(item => item.itemType === 'custom');

  return {
    items,
    presetItems,
    customItems,
    addItem,
    deleteItem,
    toggleItem,
    editItem,
    isLoading,
    error,
    currentPreset,
    lastResetDate
  };
}

