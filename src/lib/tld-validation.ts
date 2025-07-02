import {
  TLD,
  TLDConfig,
  TLDCategory,
  isValidTLDConfig,
  isValidTLD,
  hasCategorizedStructure,
} from '@/types/tld';

// Extend Window interface for log deduplication
declare global {
  interface Window {
    _tldValidationLogged?: Set<string>;
  }
}

// Enhanced default TLD list used as fallback when JSON data is invalid
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
    extension: '.tech',
    name: 'Technology',
    popular: true,
    category: 'Popular',
  },
  {
    extension: '.app',
    name: 'Application',
    popular: true,
    category: 'Popular',
  },
  { extension: '.dev', name: 'Developer', popular: true, category: 'Popular' },
];

/**
 * Validates and extracts TLD data from unknown input.
 *
 * @param data - Unknown data that should conform to TLDConfig structure
 * @returns Object with TLDs array and categories (if available)
 *
 * This function performs runtime validation to ensure the data matches the expected
 * TLDConfig structure with valid TLD entries. It supports both legacy flat structure
 * and new categorized structure. If validation fails at any level, it falls back
 * to a predefined set of default TLDs to ensure the component always has usable data.
 */
export const validateTldData = (
  data: unknown
): { tlds: TLD[]; categories: TLDCategory[] | null } => {
  // Use new type guard for comprehensive validation
  if (!isValidTLDConfig(data)) {
    console.warn('Invalid TLD data structure, falling back to default TLDs');
    return { tlds: DEFAULT_TLDS, categories: null };
  }

  const config = data as TLDConfig;

  // Filter TLDs using the type guard for additional safety
  const validTlds = config.tlds.filter(isValidTLD);

  if (validTlds.length === 0) {
    console.warn('No valid TLDs found in data, falling back to default TLDs');
    return { tlds: DEFAULT_TLDS, categories: null };
  }

  // Extract categories if present and valid
  const categories = hasCategorizedStructure(config) ? config.categories : null;

  // Log successful data loading with categorization info (only once)
  const logKey = `${validTlds.length}-${categories?.length || 0}`;
  if (typeof window !== 'undefined') {
    if (!window._tldValidationLogged) {
      window._tldValidationLogged = new Set();
    }

    if (!window._tldValidationLogged.has(logKey)) {
      window._tldValidationLogged.add(logKey);
      if (categories) {
        console.info(
          `Loaded ${validTlds.length} TLDs across ${categories.length} categories`
        );
      } else {
        console.info(`Loaded ${validTlds.length} TLDs (legacy flat structure)`);
      }
    }
  }

  return { tlds: validTlds, categories };
};
