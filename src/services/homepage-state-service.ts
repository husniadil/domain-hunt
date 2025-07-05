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
  collapsedCategories: string[]; // IDs of collapsed categories
  showAllCategories: boolean; // "Show More" toggle state
  searchQuery?: string; // Search state persistence (optional)
  scrollPosition?: {
    currentSection: 'header' | 'input' | 'results';
  }; // Scroll state for navigation overlay
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
    const savedAt = typeof rawState.savedAt === 'number' ? rawState.savedAt : 0;
    const hoursElapsed = (Date.now() - savedAt) / (1000 * 60 * 60);
    if (hoursElapsed > STATE_EXPIRY_HOURS) {
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Convert serialized unifiedResult back to proper format if it exists
    if (
      rawState.unifiedResult &&
      typeof rawState.unifiedResult === 'object' &&
      'resultsByDomain' in rawState.unifiedResult &&
      rawState.unifiedResult.resultsByDomain
    ) {
      try {
        rawState.unifiedResult = {
          ...rawState.unifiedResult,
          // Convert array back to Map
          resultsByDomain: new Map(
            rawState.unifiedResult.resultsByDomain as [string, unknown][]
          ),
        };
      } catch (mapError) {
        console.warn(
          'Failed to convert resultsByDomain to Map, clearing results:',
          mapError
        );
        rawState.unifiedResult = null;
      }
    }

    return rawState as Partial<HomepageState>;
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
