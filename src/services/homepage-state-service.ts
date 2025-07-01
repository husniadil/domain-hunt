import { UnifiedDomainResult } from '@/types/domain';

// Constants for localStorage keys
const HOMEPAGE_STATE_KEY = 'domain-hunt-homepage-state';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

// Current schema version for migration tracking
const SCHEMA_VERSION = 1;

// Default collapsed categories (all except popular)
const DEFAULT_COLLAPSED_CATEGORIES = [
  'international',
  'academic---education',
  'finance',
  'professional',
  'businesses',
  'audio---video',
  'arts---culture',
  'adult',
  'marketing',
  'technology',
  'real-estate',
  'short',
  'politics',
  'organizations',
  'shopping-and-sales',
  'media-and-music',
  'fun',
  'sports-and-hobbies',
  'products',
  'transport',
  'personal',
  'social---lifestyle',
  '-2-or-less',
  'food---drink',
  'services',
  'beauty',
  'cities',
  'travel',
  'health-and-fitness',
  'colors',
  'trades---construction',
  'non-english',
  'religion',
  'miscellaneous',
];

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

// Validation helpers
const isValidStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');
const isValidBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';
const isValidNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);
const isValidString = (value: unknown): value is string =>
  typeof value === 'string';

// Migration function for old format to new format
const migrateFromV0ToV1 = (
  rawState: Record<string, unknown>
): Partial<HomepageState> => {
  // V0 format: { domains, selectedTlds, unifiedResult, savedAt }
  // V1 format: adds { collapsedCategories, showAllCategories, searchQuery, version }

  return {
    // Preserve existing fields exactly as they are
    domains: isValidStringArray(rawState.domains) ? rawState.domains : [],
    selectedTlds: isValidStringArray(rawState.selectedTlds)
      ? rawState.selectedTlds
      : [],
    unifiedResult: rawState.unifiedResult as UnifiedDomainResult | null,
    savedAt: isValidNumber(rawState.savedAt) ? rawState.savedAt : Date.now(),

    // Set intelligent defaults for new fields
    collapsedCategories: DEFAULT_COLLAPSED_CATEGORIES,
    showAllCategories: false,
    searchQuery: undefined,
    version: SCHEMA_VERSION,
  };
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
    const version = rawState.version || 0; // Default to 0 for old format
    let migratedState: Partial<HomepageState>;

    if (version === 0) {
      // Migrate from V0 (old format) to V1 (current format)
      migratedState = migrateFromV0ToV1(rawState);
      console.log('Migrated homepage state from V0 to V1');
    } else if (version === SCHEMA_VERSION) {
      // Current version, validate and use as-is
      migratedState = {
        domains: isValidStringArray(rawState.domains) ? rawState.domains : [],
        selectedTlds: isValidStringArray(rawState.selectedTlds)
          ? rawState.selectedTlds
          : [],
        unifiedResult: rawState.unifiedResult as UnifiedDomainResult | null,
        savedAt: isValidNumber(rawState.savedAt)
          ? rawState.savedAt
          : Date.now(),
        collapsedCategories: isValidStringArray(rawState.collapsedCategories)
          ? rawState.collapsedCategories
          : DEFAULT_COLLAPSED_CATEGORIES,
        showAllCategories: isValidBoolean(rawState.showAllCategories)
          ? rawState.showAllCategories
          : false,
        searchQuery: isValidString(rawState.searchQuery)
          ? rawState.searchQuery
          : undefined,
        version: SCHEMA_VERSION,
      };
    } else {
      // Unknown version, treat as corrupted
      console.warn(`Unknown homepage state version: ${version}, removing data`);
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
