'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  // Search state props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
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
  searchQuery = '',
  onSearchChange,
}: TldSelectorProps) {
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  // Sync with initialTlds changes (including when cleared)
  useEffect(() => {
    setSelectedTlds(initialTlds);
    onTldsChange?.(initialTlds);
  }, [initialTlds, onTldsChange]);

  // Sync with external search query changes
  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search handler
  const debouncedSearchChange = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        onSearchChange?.(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [onSearchChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setInternalSearchQuery(query);
      debouncedSearchChange(query);
    },
    [debouncedSearchChange]
  );

  const clearSearch = useCallback(() => {
    setInternalSearchQuery('');
    onSearchChange?.('');
  }, [onSearchChange]);

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

  // Filter TLDs based on search query
  const filteredData = useMemo(() => {
    if (!internalSearchQuery.trim()) {
      return { tlds: TLDS, categories: CATEGORIES };
    }

    const query = internalSearchQuery.toLowerCase().trim();

    // Filter TLDs that match extension, name, or category
    const matchingTlds = TLDS.filter(
      tld =>
        tld.extension.toLowerCase().includes(query) ||
        tld.name.toLowerCase().includes(query) ||
        (tld.category && tld.category.toLowerCase().includes(query))
    );

    // If no categories, return filtered flat list
    if (!CATEGORIES) {
      return { tlds: matchingTlds, categories: null };
    }

    // Create filtered categories containing only matching TLDs
    const filteredCategories = CATEGORIES.map(category => ({
      ...category,
      tlds: category.tlds.filter(tld => matchingTlds.includes(tld)),
    })).filter(category => category.tlds.length > 0);

    return { tlds: matchingTlds, categories: filteredCategories };
  }, [internalSearchQuery]);

  // Category selection state calculations
  const getCategorySelectionState = useCallback(
    (category: TLDCategory) => {
      const categoryTlds = category.tlds.map(tld => tld.extension);
      const selectedInCategory = selectedTlds.filter(tld =>
        categoryTlds.includes(tld)
      );

      return {
        selectedCount: selectedInCategory.length,
        totalCount: categoryTlds.length,
        isAllSelected: selectedInCategory.length === categoryTlds.length,
        isNoneSelected: selectedInCategory.length === 0,
        isPartiallySelected:
          selectedInCategory.length > 0 &&
          selectedInCategory.length < categoryTlds.length,
      };
    },
    [selectedTlds]
  );

  // Category bulk selection handlers
  const handleCategorySelectAll = useCallback(
    (category: TLDCategory) => {
      const categoryTlds = category.tlds.map(tld => tld.extension);
      const newSelectedTlds = [...new Set([...selectedTlds, ...categoryTlds])];
      setSelectedTlds(newSelectedTlds);
      onTldsChange?.(newSelectedTlds);
    },
    [selectedTlds, onTldsChange]
  );

  const handleCategoryDeselectAll = useCallback(
    (category: TLDCategory) => {
      const categoryTlds = category.tlds.map(tld => tld.extension);
      const newSelectedTlds = selectedTlds.filter(
        tld => !categoryTlds.includes(tld)
      );
      setSelectedTlds(newSelectedTlds);
      onTldsChange?.(newSelectedTlds);
    },
    [selectedTlds, onTldsChange]
  );

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

  // Cache popular category lookup from filtered data
  const popularCategory = filteredData.categories?.find(
    cat => cat.id === 'popular'
  );

  // Check if search is active and has no results
  const isSearching = internalSearchQuery.trim().length > 0;
  const hasNoResults = isSearching && filteredData.tlds.length === 0;

  // Render TLD grid for a category or flat list with optional search highlighting
  const renderTldGrid = (tlds: TLD[]) => (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-3">
      {tlds.map(tld => {
        const query = internalSearchQuery.toLowerCase().trim();
        const isHighlighted =
          query &&
          (tld.extension.toLowerCase().includes(query) ||
            tld.name.toLowerCase().includes(query));

        return (
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
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer',
                isHighlighted &&
                  'bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded'
              )}
              title={tld.name}
            >
              {tld.extension}
            </label>
          </div>
        );
      })}
    </div>
  );

  // Enhanced keyboard handler for category toggle
  const handleCategoryKeyDown = (
    e: React.KeyboardEvent,
    categoryId: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategoryToggle(categoryId);
    }
  };

  // Render category section with smooth animations and enhanced interactions
  const renderCategorySection = (category: TLDCategory) => {
    const isCollapsed = collapsedCategories.includes(category.id);
    const isPopular = category.id === 'popular';
    const shouldExpand = isSearching || !isCollapsed || isPopular;
    const selectionState = getCategorySelectionState(category);
    const isToggleDisabled = isPopular || isSearching;

    // Visual indicator for selection state
    const getSelectionIcon = () => {
      if (selectionState.isAllSelected) {
        return '✓'; // checkmark for all selected
      } else if (selectionState.isPartiallySelected) {
        return '−'; // dash for partial selection
      } else {
        return '☐'; // empty box for none selected
      }
    };

    return (
      <div key={category.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleCategoryToggle(category.id)}
            onKeyDown={e => handleCategoryKeyDown(e, category.id)}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-all duration-200',
              !isToggleDisabled &&
                'hover:text-primary hover:bg-muted/50 rounded-md px-2 py-1 -mx-2',
              isToggleDisabled && 'cursor-default'
            )}
            disabled={isToggleDisabled}
            aria-expanded={shouldExpand}
            aria-controls={`category-content-${category.id}`}
            aria-label={`${shouldExpand ? 'Collapse' : 'Expand'} ${category.name} category`}
            title={
              isToggleDisabled
                ? undefined
                : `${shouldExpand ? 'Collapse' : 'Expand'} ${category.name} category`
            }
          >
            {!isPopular && !isSearching && (
              <span
                className={cn(
                  'text-xs transition-transform duration-200 ease-in-out',
                  !isCollapsed && 'rotate-90'
                )}
              >
                ▶
              </span>
            )}
            <span className="text-xs mr-1">{getSelectionIcon()}</span>
            {category.name}
            <span className="text-xs text-muted-foreground">
              ({selectionState.selectedCount}/{selectionState.totalCount}{' '}
              selected)
            </span>
            {isSearching && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                (matches)
              </span>
            )}
          </button>

          {/* Bulk Selection Controls */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                handleCategorySelectAll(category);
              }}
              disabled={selectionState.isAllSelected}
              className="text-xs h-6 px-2 transition-all duration-200 hover:scale-105"
              title={`Select all ${category.name} TLDs`}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                handleCategoryDeselectAll(category);
              }}
              disabled={selectionState.isNoneSelected}
              className="text-xs h-6 px-2 transition-all duration-200 hover:scale-105"
              title={`Deselect all ${category.name} TLDs`}
            >
              None
            </Button>
          </div>
        </div>

        {/* Category Content with smooth animations */}
        <div
          id={`category-content-${category.id}`}
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            shouldExpand ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
          aria-hidden={!shouldExpand}
        >
          <div className="pt-1">{renderTldGrid(category.tlds)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search TLDs by extension (.com), name (Commercial), or category..."
          value={internalSearchQuery}
          onChange={handleSearchChange}
          className="pr-8"
        />
        {internalSearchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Info */}
      {isSearching && (
        <div className="text-sm text-muted-foreground">
          {hasNoResults
            ? 'No TLDs found matching your search.'
            : `Found ${filteredData.tlds.length} TLD${filteredData.tlds.length === 1 ? '' : 's'} matching "${internalSearchQuery}"`}
        </div>
      )}

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

      {/* No Results State */}
      {hasNoResults ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No TLDs found matching &quot;{internalSearchQuery}&quot;</p>
          <button
            onClick={clearSearch}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Clear search to see all TLDs
          </button>
        </div>
      ) : /* Categorized or Flat Layout */
      filteredData.categories ? (
        <div className="space-y-4">
          {/* Popular Section (always visible) */}
          {popularCategory && renderCategorySection(popularCategory)}

          {/* Enhanced Show More Toggle - hidden during search */}
          {!isSearching &&
            filteredData.categories.length > 1 &&
            (() => {
              const hiddenCategories = filteredData.categories.filter(
                cat => cat.id !== 'popular'
              );
              const hiddenCategoriesCount = hiddenCategories.length;
              const hiddenTldsCount = hiddenCategories.reduce(
                (sum, cat) => sum + cat.tlds.length,
                0
              );

              return (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowMoreToggle}
                    className="text-xs hover:bg-muted transition-colors duration-200 group"
                  >
                    <span className="flex items-center gap-2">
                      {showAllCategories ? (
                        <>
                          Show Less
                          <span className="text-xs opacity-75">
                            (Hide {hiddenCategoriesCount} categories)
                          </span>
                        </>
                      ) : (
                        <>
                          Show More Categories
                          <span className="text-xs opacity-75">
                            ({hiddenCategoriesCount} more with {hiddenTldsCount}{' '}
                            TLDs)
                          </span>
                        </>
                      )}
                      <span className="ml-1 transition-transform duration-200 group-hover:scale-110">
                        {showAllCategories ? '▲' : '▼'}
                      </span>
                    </span>
                  </Button>
                </div>
              );
            })()}

          {/* Collapsible Categories - auto-expanded during search with smooth transitions */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showAllCategories || isSearching
                ? 'max-h-[2000px] opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-4 pt-4">
              {filteredData.categories
                .filter(cat => cat.id !== 'popular')
                .map(renderCategorySection)}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback: Flat Grid Layout */
        renderTldGrid(filteredData.tlds)
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
