/**
 * Global filter state hook with localStorage persistence
 * Ensures filters persist across all pages and navigation
 */

import { useState, useEffect, useCallback } from 'react';
import type { FilterState } from '@/components/dashboard/filter-panel';

const FILTER_STORAGE_KEY = 'qos-et-filters';

/**
 * Load filters from localStorage
 */
function loadFiltersFromStorage(): FilterState {
  if (typeof window === 'undefined') {
    return {
      selectedPlants: [],
      selectedComplaintTypes: [],
      selectedNotificationTypes: [],
      dateFrom: null,
      dateTo: null,
    };
  }

  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : null,
        dateTo: parsed.dateTo ? new Date(parsed.dateTo) : null,
      };
    }
  } catch (e) {
    console.error('Failed to parse stored filters:', e);
  }

  return {
    selectedPlants: [],
    selectedComplaintTypes: [],
    selectedNotificationTypes: [],
    dateFrom: null,
    dateTo: null,
  };
}

/**
 * Save filters to localStorage
 */
function saveFiltersToStorage(filters: FilterState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    // Dispatch event so other components can listen for filter changes
    window.dispatchEvent(new CustomEvent('qos-et-filters-updated', { detail: filters }));
  } catch (e) {
    console.error('Failed to save filters:', e);
  }
}

/**
 * Global filter state hook
 * Provides persistent filter state across all pages
 */
export function useGlobalFilters() {
  const [filters, setFiltersState] = useState<FilterState>(loadFiltersFromStorage);

  // Load filters from storage on mount
  useEffect(() => {
    const loaded = loadFiltersFromStorage();
    setFiltersState(loaded);
  }, []);

  // Listen for filter updates from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FILTER_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFiltersState({
            ...parsed,
            dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : null,
            dateTo: parsed.dateTo ? new Date(parsed.dateTo) : null,
          });
        } catch (err) {
          console.error('Failed to parse filters from storage event:', err);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<FilterState>;
      if (customEvent.detail) {
        setFiltersState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('qos-et-filters-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('qos-et-filters-updated', handleCustomEvent);
    };
  }, []);

  // Update filters and persist to localStorage
  const setFilters = useCallback((newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersState((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      saveFiltersToStorage(updated);
      return updated;
    });
  }, []);

  return [filters, setFilters] as const;
}
