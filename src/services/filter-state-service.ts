'use client';

export interface FilterToggleStates {
  available: boolean;
  taken: boolean;
  error: boolean;
}

const STORAGE_KEY = 'domain-hunt-filter-toggles';

// Default filter states - all enabled
const DEFAULT_STATES: FilterToggleStates = {
  available: true,
  taken: true,
  error: true,
};

/**
 * Load filter toggle states from localStorage
 * Returns default states if localStorage is unavailable or data is corrupted
 */
export const loadFilterStates = (): FilterToggleStates => {
  // Check if running on server
  if (typeof window === 'undefined') {
    return DEFAULT_STATES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATES;
    }

    const parsed = JSON.parse(stored) as FilterToggleStates;

    // Validate that all required properties exist and are booleans
    if (
      typeof parsed.available === 'boolean' &&
      typeof parsed.taken === 'boolean' &&
      typeof parsed.error === 'boolean'
    ) {
      return parsed;
    }

    // If validation fails, return defaults
    console.warn('Invalid filter states in localStorage, using defaults');
    return DEFAULT_STATES;
  } catch (error) {
    console.error('Failed to load filter states from localStorage:', error);
    return DEFAULT_STATES;
  }
};

/**
 * Save filter toggle states to localStorage
 */
export const saveFilterStates = (states: FilterToggleStates): void => {
  // Check if running on server
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.error('Failed to save filter states to localStorage:', error);
  }
};

/**
 * Clear filter toggle states from localStorage
 */
export const clearFilterStates = (): void => {
  // Check if running on server
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear filter states from localStorage:', error);
  }
};
