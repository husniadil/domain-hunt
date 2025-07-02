'use client';

import {
  TLD,
  TLDConfig,
  TLDCategory,
  isValidTLDConfig,
  hasCategorizedStructure,
} from '@/types/tld';

// Default TLD fallback used when dynamic loading fails
const DEFAULT_TLDS: TLD[] = [
  { extension: '.com', name: 'Commercial', popular: true, category: 'Popular' },
  { extension: '.co', name: 'Company', popular: true, category: 'Popular' },
  { extension: '.net', name: 'Network', popular: true, category: 'Popular' },
  {
    extension: '.org',
    name: 'Organization',
    popular: true,
    category: 'Popular',
  },
  {
    extension: '.io',
    name: 'Input/Output',
    popular: true,
    category: 'Popular',
  },
  { extension: '.xyz', name: 'Generic', popular: true, category: 'Popular' },
  { extension: '.online', name: 'Online', popular: true, category: 'Popular' },
  {
    extension: '.app',
    name: 'Application',
    popular: true,
    category: 'Popular',
  },
];

// Default fallback config
const DEFAULT_CONFIG: TLDConfig = {
  categories: [
    {
      id: 'popular',
      name: 'Popular',
      description: 'Popular TLD extensions',
      tlds: DEFAULT_TLDS,
    },
  ],
  tlds: DEFAULT_TLDS,
  metadata: {
    totalTlds: DEFAULT_TLDS.length,
    totalCategories: 1,
    extractedAt: new Date().toISOString(),
    version: 'fallback',
  },
};

export interface TldDataState {
  data: TLDConfig | null;
  loading: boolean;
  error: string | null;
}

// Cache for loaded TLD data
let cachedTldData: TLDConfig | null = null;
let loadingPromise: Promise<TLDConfig> | null = null;

/**
 * Dynamically loads TLD data with caching and error handling
 */
export async function loadTldData(): Promise<TLDConfig> {
  // Return cached data if available
  if (cachedTldData) {
    return cachedTldData;
  }

  // Return existing loading promise if in progress
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start new loading process
  loadingPromise = (async () => {
    try {
      console.log('[TLD Service] Loading TLD data dynamically...');

      // Dynamic import of TLD data
      const tldDataModule = await import('../../data/tlds.json');
      const rawTldData = tldDataModule.default;

      // Validate loaded data
      if (!isValidTLDConfig(rawTldData)) {
        console.warn(
          '[TLD Service] Invalid TLD data structure, using fallback'
        );
        cachedTldData = DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
      }

      // Cache valid data
      cachedTldData = rawTldData;
      console.log(
        `[TLD Service] Successfully loaded ${rawTldData.tlds?.length || 0} TLDs`
      );

      return rawTldData;
    } catch (error) {
      console.error('[TLD Service] Failed to load TLD data:', error);

      // Use fallback on error
      cachedTldData = DEFAULT_CONFIG;
      return DEFAULT_CONFIG;
    } finally {
      // Clear loading promise
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Get current TLD data synchronously (returns cached data or null)
 */
export function getCurrentTldData(): TLDConfig | null {
  return cachedTldData;
}

/**
 * Check if TLD data is currently loading
 */
export function isTldDataLoading(): boolean {
  return loadingPromise !== null;
}

/**
 * Get TLD extensions array for validation
 */
export function getTldExtensions(config: TLDConfig): string[] {
  if (hasCategorizedStructure(config)) {
    return config.tlds?.map(tld => tld.extension) || [];
  }
  return config.tlds?.map(tld => tld.extension) || [];
}

/**
 * Clear cached TLD data (useful for testing)
 */
export function clearTldDataCache(): void {
  cachedTldData = null;
  loadingPromise = null;
}

// Re-export types for convenience
export type { TLD, TLDConfig, TLDCategory };
