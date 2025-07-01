'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TLD,
  TLDConfig,
  TLDCategory,
  isValidTLDConfig,
  isValidTLD,
  hasCategorizedStructure,
} from '@/types/tld';
import tldData from '../../data/tlds.json';

interface TldSelectorProps {
  onTldsChange?: (tlds: string[]) => void;
  className?: string;
  initialTlds?: string[];
  // New props for category UI state
  collapsedCategories?: string[];
  showAllCategories?: boolean;
  onCollapsedCategoriesChange?: (categories: string[]) => void;
  onShowAllCategoriesChange?: (show: boolean) => void;
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
const validateTldData = (
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

  // Log successful data loading with categorization info
  if (categories) {
    console.info(
      `Loaded ${validTlds.length} TLDs across ${categories.length} categories`
    );
  } else {
    console.info(`Loaded ${validTlds.length} TLDs (legacy flat structure)`);
  }

  return { tlds: validTlds, categories };
};

const TLD_DATA = validateTldData(tldData as TLDConfig);
const TLDS: TLD[] = TLD_DATA.tlds;
const CATEGORIES: TLDCategory[] | null = TLD_DATA.categories;
const TLD_EXTENSIONS = TLDS.map(tld => tld.extension);

export function TldSelector({
  onTldsChange,
  className,
  initialTlds = [],
  collapsedCategories = [],
  showAllCategories = false,
  onCollapsedCategoriesChange,
  onShowAllCategoriesChange,
}: TldSelectorProps) {
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);

  // Sync with initialTlds changes (including when cleared)
  useEffect(() => {
    setSelectedTlds(initialTlds);
    onTldsChange?.(initialTlds);
  }, [initialTlds, onTldsChange]);

  const handleTldToggle = (tld: string, checked: boolean) => {
    const newSelectedTlds = checked
      ? [...selectedTlds, tld]
      : selectedTlds.filter(t => t !== tld);

    setSelectedTlds(newSelectedTlds);
    onTldsChange?.(newSelectedTlds);
  };

  const handleSelectAll = () => {
    setSelectedTlds([...TLD_EXTENSIONS]);
    onTldsChange?.(TLD_EXTENSIONS);
  };

  const handleDeselectAll = () => {
    setSelectedTlds([]);
    onTldsChange?.([]);
  };

  // Category management functions
  const handleCategoryToggle = (categoryId: string) => {
    const isCollapsed = collapsedCategories.includes(categoryId);
    const newCollapsed = isCollapsed
      ? collapsedCategories.filter(id => id !== categoryId)
      : [...collapsedCategories, categoryId];

    onCollapsedCategoriesChange?.(newCollapsed);
  };

  const handleShowMoreToggle = () => {
    onShowAllCategoriesChange?.(!showAllCategories);
  };

  const allSelected = selectedTlds.length === TLD_EXTENSIONS.length;
  const noneSelected = selectedTlds.length === 0;

  // Render TLD grid for a category or flat list
  const renderTldGrid = (tlds: TLD[]) => (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-3">
      {tlds.map(tld => (
        <div key={tld.extension} className="flex items-center space-x-2">
          <Checkbox
            id={`tld-${tld.extension.replace('.', '-')}`}
            checked={selectedTlds.includes(tld.extension)}
            onCheckedChange={checked =>
              handleTldToggle(tld.extension, !!checked)
            }
          />
          <label
            htmlFor={`tld-${tld.extension.replace('.', '-')}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            title={tld.name}
          >
            {tld.extension}
          </label>
        </div>
      ))}
    </div>
  );

  // Render category section
  const renderCategorySection = (category: TLDCategory) => {
    const isCollapsed = collapsedCategories.includes(category.id);
    const isPopular = category.id === 'popular';

    return (
      <div key={category.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleCategoryToggle(category.id)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary"
            disabled={isPopular} // Popular section always expanded
          >
            {!isPopular && (
              <span className="text-xs">{isCollapsed ? '▶' : '▼'}</span>
            )}
            {category.name}
            <span className="text-xs text-muted-foreground">
              ({category.tlds.length})
            </span>
          </button>
        </div>

        {(!isCollapsed || isPopular) && renderTldGrid(category.tlds)}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* TLD Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Select TLD Extensions</h3>
          {selectedTlds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({selectedTlds.length} selected)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={noneSelected}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Categorized or Flat Layout */}
      {CATEGORIES ? (
        <div className="space-y-4">
          {/* Popular Section (always visible) */}
          {CATEGORIES.find(cat => cat.id === 'popular') &&
            renderCategorySection(
              CATEGORIES.find(cat => cat.id === 'popular')!
            )}

          {/* Show More Toggle */}
          {CATEGORIES.length > 1 && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowMoreToggle}
                className="text-xs"
              >
                {showAllCategories ? 'Show Less' : 'Show More Categories'}
                <span className="ml-1">{showAllCategories ? '▲' : '▼'}</span>
              </Button>
            </div>
          )}

          {/* Collapsible Categories */}
          {showAllCategories && (
            <div className="space-y-4">
              {CATEGORIES.filter(cat => cat.id !== 'popular').map(
                renderCategorySection
              )}
            </div>
          )}
        </div>
      ) : (
        /* Fallback: Flat Grid Layout */
        renderTldGrid(TLDS)
      )}

      {/* Selected Extensions Summary */}
      {selectedTlds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected extensions: {selectedTlds.join(', ')}
        </div>
      )}
    </div>
  );
}
