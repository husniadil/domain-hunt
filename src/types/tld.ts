export interface TLD {
  extension: string;
  name: string;
  popular: boolean;
  category?: string; // New optional field for backward compatibility
}

export interface TLDCategory {
  id: string;
  name: string;
  description?: string;
  tlds: TLD[];
}

export interface TLDConfig {
  categories?: TLDCategory[]; // New categorized structure
  tlds: TLD[]; // Flattened for backward compatibility
  metadata?: {
    totalTlds: number;
    totalCategories: number;
    extractedAt: string;
    version: string;
  };
}

/**
 * Type guard to check if TLD data has categorized structure
 */
export function hasCategorizedStructure(
  config: TLDConfig
): config is TLDConfig & { categories: TLDCategory[] } {
  return Array.isArray(config.categories) && config.categories.length > 0;
}

/**
 * Type guard to validate TLD object structure
 */
export function isValidTLD(tld: unknown): tld is TLD {
  return (
    typeof tld === 'object' &&
    tld !== null &&
    typeof (tld as TLD).extension === 'string' &&
    typeof (tld as TLD).name === 'string' &&
    typeof (tld as TLD).popular === 'boolean' &&
    (!(tld as TLD).category || typeof (tld as TLD).category === 'string')
  );
}

/**
 * Type guard to validate TLDCategory object structure
 */
export function isValidTLDCategory(category: unknown): category is TLDCategory {
  return (
    typeof category === 'object' &&
    category !== null &&
    typeof (category as TLDCategory).id === 'string' &&
    typeof (category as TLDCategory).name === 'string' &&
    Array.isArray((category as TLDCategory).tlds) &&
    (category as TLDCategory).tlds.every(isValidTLD)
  );
}

/**
 * Type guard to validate complete TLDConfig structure
 */
export function isValidTLDConfig(config: unknown): config is TLDConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const tldConfig = config as TLDConfig;

  // Validate required tlds array
  if (!Array.isArray(tldConfig.tlds) || !tldConfig.tlds.every(isValidTLD)) {
    return false;
  }

  // Validate optional categories array if present
  if (
    tldConfig.categories &&
    (!Array.isArray(tldConfig.categories) ||
      !tldConfig.categories.every(isValidTLDCategory))
  ) {
    return false;
  }

  return true;
}
