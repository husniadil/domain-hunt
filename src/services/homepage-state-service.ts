import { UnifiedDomainResult } from '@/types/domain';
import { isValidNumber } from '@/utils/validation';
import {
  migrateHomepageState,
  SCHEMA_VERSION,
} from '@/utils/homepage-state-migration';

// Constants for localStorage keys
const HOMEPAGE_STATE_KEY = 'domain-hunt-homepage-state';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

// Types for persisted state
export interface HomepageState {
  // Existing fields (maintain compatibility)
  domains: string[];
  selectedTlds: string[];
  unifiedResult: UnifiedDomainResult | null;
  savedAt: number;

  // New fields for categorized TLD UI
  collapsedCategories: string[]; // IDs of collapsed categories
  showAllCategories: boolean; // "Show More" toggle state
  searchQuery?: string; // Search state persistence (optional)

  // Migration tracking
  version: number; // Schema version for future migrations
}

// Helper functions for state persistence
export const saveHomepageState = (
  state: Omit<HomepageState, 'savedAt' | 'version'>
) => {
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
      version: SCHEMA_VERSION, // Always save with current version
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

    let rawState: Record<string, unknown>;
    try {
      rawState = JSON.parse(saved);
    } catch (parseError) {
      console.warn(
        'Failed to parse homepage state, removing corrupted data:',
        parseError
      );
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Validate basic structure
    if (!rawState || typeof rawState !== 'object') {
      console.warn('Invalid homepage state structure, removing corrupted data');
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Check if state is expired
    const savedAt = isValidNumber(rawState.savedAt) ? rawState.savedAt : 0;
    const hoursElapsed = (Date.now() - savedAt) / (1000 * 60 * 60);
    if (hoursElapsed > STATE_EXPIRY_HOURS) {
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Determine version and migrate if necessary
    const version = isValidNumber(rawState.version) ? rawState.version : 0; // Default to 0 for old format
    const migratedState = migrateHomepageState(rawState, version);

    if (!migratedState) {
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Convert serialized unifiedResult back to proper format if it exists
    if (
      migratedState.unifiedResult &&
      migratedState.unifiedResult.resultsByDomain
    ) {
      try {
        migratedState.unifiedResult = {
          ...migratedState.unifiedResult,
          // Convert array back to Map (handles both old and new formats)
          resultsByDomain: new Map(migratedState.unifiedResult.resultsByDomain),
        };
      } catch (mapError) {
        console.warn(
          'Failed to convert resultsByDomain to Map, clearing results:',
          mapError
        );
        migratedState.unifiedResult = null;
      }
    }

    return migratedState;
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
