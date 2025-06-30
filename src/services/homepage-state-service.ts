import { UnifiedDomainResult } from '@/types/domain';

// Constants for localStorage keys
const HOMEPAGE_STATE_KEY = 'domain-hunt-homepage-state';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

// Types for persisted state
export interface HomepageState {
  domains: string[];
  selectedTlds: string[];
  unifiedResult: UnifiedDomainResult | null;
  savedAt: number;
}

// Helper functions for state persistence
export const saveHomepageState = (state: Omit<HomepageState, 'savedAt'>) => {
  if (typeof window === 'undefined') return;

  try {
    // Convert Map to serializable format
    const serializableState = {
      ...state,
      unifiedResult: state.unifiedResult
        ? {
            ...state.unifiedResult,
            // Convert Map to array of [key, value] pairs for serialization
            resultsByDomain: Array.from(
              state.unifiedResult.resultsByDomain.entries()
            ),
          }
        : null,
      savedAt: Date.now(),
    };
    localStorage.setItem(HOMEPAGE_STATE_KEY, JSON.stringify(serializableState));
  } catch (error) {
    console.error('Failed to save homepage state:', error);
  }
};

export const loadHomepageState = (): Partial<HomepageState> | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(HOMEPAGE_STATE_KEY);
    if (!saved) return null;

    const rawState = JSON.parse(saved);

    // Check if state is expired
    const hoursElapsed = (Date.now() - rawState.savedAt) / (1000 * 60 * 60);
    if (hoursElapsed > STATE_EXPIRY_HOURS) {
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Convert serialized state back to proper format
    const state: Partial<HomepageState> = {
      domains: rawState.domains,
      selectedTlds: rawState.selectedTlds,
      unifiedResult: rawState.unifiedResult
        ? {
            ...rawState.unifiedResult,
            // Convert array back to Map
            resultsByDomain: new Map(rawState.unifiedResult.resultsByDomain),
          }
        : null,
      savedAt: rawState.savedAt,
    };

    return state;
  } catch (error) {
    console.error('Failed to load homepage state:', error);
    localStorage.removeItem(HOMEPAGE_STATE_KEY);
    return null;
  }
};

export const clearHomepageState = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(HOMEPAGE_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear homepage state:', error);
  }
};
