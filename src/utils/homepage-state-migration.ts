import { UnifiedDomainResult } from '@/types/domain';
import { HomepageState } from '@/services/homepage-state-service';
import {
  isValidStringArray,
  isValidNumber,
  isValidBoolean,
  isValidString,
} from './validation';

// Current schema version for migration tracking
export const SCHEMA_VERSION = 1;

// Default collapsed categories (all except popular)
export const DEFAULT_COLLAPSED_CATEGORIES = [
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

/**
 * Migration function for old format (V0) to new format (V1)
 * V0 format: { domains, selectedTlds, unifiedResult, savedAt }
 * V1 format: adds { collapsedCategories, showAllCategories, searchQuery, version }
 */
export const migrateFromV0ToV1 = (
  rawState: Record<string, unknown>
): Partial<HomepageState> => {
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

/**
 * Validates and processes current version state (V1)
 * Ensures all fields are properly typed and valid
 */
export const validateCurrentVersionState = (
  rawState: Record<string, unknown>
): Partial<HomepageState> => {
  return {
    domains: isValidStringArray(rawState.domains) ? rawState.domains : [],
    selectedTlds: isValidStringArray(rawState.selectedTlds)
      ? rawState.selectedTlds
      : [],
    unifiedResult: rawState.unifiedResult as UnifiedDomainResult | null,
    savedAt: isValidNumber(rawState.savedAt) ? rawState.savedAt : Date.now(),
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
};

/**
 * Main migration handler that determines the appropriate migration path
 * based on the detected version
 */
export const migrateHomepageState = (
  rawState: Record<string, unknown>,
  version: number
): Partial<HomepageState> | null => {
  if (version === 0) {
    // Migrate from V0 (old format) to V1 (current format)
    console.log('Migrated homepage state from V0 to V1');
    return migrateFromV0ToV1(rawState);
  } else if (version === SCHEMA_VERSION) {
    // Current version, validate and use as-is
    return validateCurrentVersionState(rawState);
  } else {
    // Unknown version, treat as corrupted
    console.warn(`Unknown homepage state version: ${version}, removing data`);
    return null;
  }
};
