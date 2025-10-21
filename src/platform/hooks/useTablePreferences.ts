import { useState, useEffect, useCallback, useMemo } from 'react';

export interface TablePreferences {
  // Filter states
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  verticalFilter: string;
  revenueFilter: string;
  lastContactedFilter: string;
  timezoneFilter: string;
  companySizeFilter: string;
  locationFilter: string;
  technologyFilter: string;
  
  // Sort state
  sortField: string;
  sortDirection: 'asc' | 'desc';
  
  // Column configuration
  visibleColumns: string[];
}

export interface UseTablePreferencesReturn {
  preferences: TablePreferences;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setPriorityFilter: (filter: string) => void;
  setVerticalFilter: (filter: string) => void;
  setRevenueFilter: (filter: string) => void;
  setLastContactedFilter: (filter: string) => void;
  setTimezoneFilter: (filter: string) => void;
  setCompanySizeFilter: (filter: string) => void;
  setLocationFilter: (filter: string) => void;
  setTechnologyFilter: (filter: string) => void;
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setVisibleColumns: (columns: string[]) => void;
  resetPreferences: () => void;
  activeFilterCount: number;
  hasNonDefaultSort: boolean;
  hasNonDefaultColumns: boolean;
}

const DEFAULT_PREFERENCES: TablePreferences = {
  searchQuery: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  verticalFilter: 'all',
  revenueFilter: 'all',
  lastContactedFilter: 'all',
  timezoneFilter: 'all',
  companySizeFilter: 'all',
  locationFilter: 'all',
  technologyFilter: 'all',
  sortField: 'rank',
  sortDirection: 'asc',
  visibleColumns: []
};

export function useTablePreferences(
  workspaceId: string,
  section: string,
  defaultColumns: string[],
  defaultSortField: string = 'rank',
  defaultSortDirection: 'asc' | 'desc' = 'asc'
): UseTablePreferencesReturn {
  const storageKey = `table-prefs-${workspaceId}-${section}`;
  
  // Initialize with defaults
  const [preferences, setPreferences] = useState<TablePreferences>(() => {
    const defaultPrefs = {
      ...DEFAULT_PREFERENCES,
      sortField: defaultSortField,
      sortDirection: defaultSortDirection,
      visibleColumns: defaultColumns
    };
    
    // Load from localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with defaults to handle new fields
          return { ...defaultPrefs, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to parse saved table preferences:', error);
        localStorage.removeItem(storageKey);
      }
    }
    
    return defaultPrefs;
  });

  // Debounced save to localStorage
  const savePreferences = useCallback(
    (newPreferences: TablePreferences) => {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPreferences));
        console.log(`💾 [TablePreferences] Saved preferences for ${workspaceId}-${section}:`, {
          activeFilters: Object.entries(newPreferences)
            .filter(([key, value]) => key.includes('Filter') && value !== 'all')
            .map(([key, value]) => `${key}:${value}`),
          sort: `${newPreferences.sortField}:${newPreferences.sortDirection}`,
          columns: newPreferences.visibleColumns.length
        });
      } catch (error) {
        console.error('Failed to save table preferences:', error);
      }
    },
    [storageKey, workspaceId, section]
  );

  // Update preferences and save
  const updatePreferences = useCallback(
    (updates: Partial<TablePreferences>) => {
      setPreferences(prev => {
        const newPrefs = { ...prev, ...updates };
        // Debounce the save operation
        setTimeout(() => savePreferences(newPrefs), 100);
        return newPrefs;
      });
    },
    [savePreferences]
  );

  // Individual setters
  const setSearchQuery = useCallback((query: string) => {
    updatePreferences({ searchQuery: query });
  }, [updatePreferences]);

  const setStatusFilter = useCallback((filter: string) => {
    updatePreferences({ statusFilter: filter });
  }, [updatePreferences]);

  const setPriorityFilter = useCallback((filter: string) => {
    updatePreferences({ priorityFilter: filter });
  }, [updatePreferences]);

  const setVerticalFilter = useCallback((filter: string) => {
    updatePreferences({ verticalFilter: filter });
  }, [updatePreferences]);

  const setRevenueFilter = useCallback((filter: string) => {
    updatePreferences({ revenueFilter: filter });
  }, [updatePreferences]);

  const setLastContactedFilter = useCallback((filter: string) => {
    updatePreferences({ lastContactedFilter: filter });
  }, [updatePreferences]);

  const setTimezoneFilter = useCallback((filter: string) => {
    updatePreferences({ timezoneFilter: filter });
  }, [updatePreferences]);

  const setCompanySizeFilter = useCallback((filter: string) => {
    updatePreferences({ companySizeFilter: filter });
  }, [updatePreferences]);

  const setLocationFilter = useCallback((filter: string) => {
    updatePreferences({ locationFilter: filter });
  }, [updatePreferences]);

  const setTechnologyFilter = useCallback((filter: string) => {
    updatePreferences({ technologyFilter: filter });
  }, [updatePreferences]);

  const setSortField = useCallback((field: string) => {
    updatePreferences({ sortField: field });
  }, [updatePreferences]);

  const setSortDirection = useCallback((direction: 'asc' | 'desc') => {
    updatePreferences({ sortDirection: direction });
  }, [updatePreferences]);

  const setVisibleColumns = useCallback((columns: string[]) => {
    updatePreferences({ visibleColumns: columns });
  }, [updatePreferences]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      ...DEFAULT_PREFERENCES,
      sortField: defaultSortField,
      sortDirection: defaultSortDirection,
      visibleColumns: defaultColumns
    };
    setPreferences(defaultPrefs);
    savePreferences(defaultPrefs);
  }, [defaultSortField, defaultSortDirection, defaultColumns, savePreferences]);

  // Calculate active filter count (excluding search query)
  const activeFilterCount = useMemo(() => {
    const filterFields = [
      'statusFilter',
      'priorityFilter', 
      'verticalFilter',
      'revenueFilter',
      'lastContactedFilter',
      'timezoneFilter',
      'companySizeFilter',
      'locationFilter',
      'technologyFilter'
    ];
    
    return filterFields.reduce((count, field) => {
      const value = preferences[field as keyof TablePreferences];
      return value !== 'all' ? count + 1 : count;
    }, 0);
  }, [preferences]);

  // Check if sort is non-default
  const hasNonDefaultSort = useMemo(() => {
    return preferences.sortField !== defaultSortField || 
           preferences.sortDirection !== defaultSortDirection;
  }, [preferences.sortField, preferences.sortDirection, defaultSortField, defaultSortDirection]);

  // Check if columns differ from default
  const hasNonDefaultColumns = useMemo(() => {
    if (preferences.visibleColumns.length !== defaultColumns.length) {
      return true;
    }
    
    // Check if all default columns are present (order-independent)
    const currentSet = new Set(preferences.visibleColumns);
    const defaultSet = new Set(defaultColumns);
    
    return !(
      defaultColumns.every(col => currentSet.has(col)) &&
      preferences.visibleColumns.every(col => defaultSet.has(col))
    );
  }, [preferences.visibleColumns, defaultColumns]);

  return {
    preferences,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setVerticalFilter,
    setRevenueFilter,
    setLastContactedFilter,
    setTimezoneFilter,
    setCompanySizeFilter,
    setLocationFilter,
    setTechnologyFilter,
    setSortField,
    setSortDirection,
    setVisibleColumns,
    resetPreferences,
    activeFilterCount,
    hasNonDefaultSort,
    hasNonDefaultColumns
  };
}
