'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { VirtualTldGrid } from '@/components/virtual-tld-grid';
import { TLD, TLDConfig, TLDCategory } from '@/types/tld';
import { validateTldData } from '@/lib/tld-validation';
import { useTldSearch } from '@/hooks/use-tld-search';
import { useTldSelection } from '@/hooks/use-tld-selection';
import { useTldCategories } from '@/hooks/use-tld-categories';
import { AccessibilityAnnouncements } from '@/components/tld-selector/accessibility-announcements';
import { SearchInput } from '@/components/tld-selector/search-input';
import { SearchResultsInfo } from '@/components/tld-selector/search-results-info';
import { TldSummary } from '@/components/tld-selector/tld-summary';
import { CategorySection } from '@/components/tld-selector/category-section';
import { ShowMoreToggle } from '@/components/tld-selector/show-more-toggle';
import { NoResultsState } from '@/components/tld-selector/no-results-state';

interface TldSelectorProps {
  // TLD data prop (replaces static import)
  tldData: TLDConfig;
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

export function TldSelector({
  tldData,
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
  // Process TLD data with validation
  const processedTldData = useMemo(() => validateTldData(tldData), [tldData]);
  const TLDS: TLD[] = processedTldData.tlds;
  const CATEGORIES: TLDCategory[] | null = processedTldData.categories;
  const TLD_EXTENSIONS = useMemo(() => TLDS.map(tld => tld.extension), [TLDS]);

  // Custom hooks for managing component state
  const {
    searchQuery: internalSearchQuery,
    handleSearchChange,
    clearSearch,
    filteredData,
    isSearching,
    hasNoResults,
    getTldHighlightState,
  } = useTldSearch({
    tlds: TLDS,
    categories: CATEGORIES,
    externalQuery: searchQuery,
    onSearchChange,
  });

  const {
    selectedTlds,
    allSelected,
    noneSelected,
    handleTldToggle,
    handleSelectAll,
    handleDeselectAll,
    handleBulkSelect,
    getCategorySelectionState,
    handleCategorySelectAll,
    handleCategoryDeselectAll,
  } = useTldSelection({
    tldExtensions: TLD_EXTENSIONS,
    initialTlds,
    filteredCategories: filteredData.categories,
    onTldsChange,
  });

  const { handleCategoryToggle, handleShowMoreToggle, handleCategoryKeyDown } =
    useTldCategories({
      collapsedCategories,
      showAllCategories,
      onCollapsedCategoriesChange,
      onShowAllCategoriesChange,
    });

  // Optimized TLD grid renderer
  const renderTldGrid = useCallback(
    (tlds: TLD[], categoryId: string = 'default') => (
      <VirtualTldGrid
        tlds={tlds}
        selectedTlds={selectedTlds}
        getTldHighlightState={getTldHighlightState}
        onToggle={handleTldToggle}
        containerHeight={tlds.length > 50 ? 400 : undefined}
        itemHeight={40}
        columnsPerRow={3}
        onBulkSelect={handleBulkSelect}
        categoryId={categoryId}
      />
    ),
    [selectedTlds, getTldHighlightState, handleTldToggle, handleBulkSelect]
  );

  // Cache popular category lookup from filtered data
  const popularCategory = filteredData.categories?.find(
    cat => cat.id === 'popular'
  );

  return (
    <div className={cn('space-y-4', className)}>
      <AccessibilityAnnouncements
        isSearching={isSearching}
        hasNoResults={hasNoResults}
        searchQuery={internalSearchQuery}
        resultsCount={filteredData.tlds.length}
        selectedCount={selectedTlds.length}
      />

      <SearchInput
        searchQuery={internalSearchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
      />

      <SearchResultsInfo
        isSearching={isSearching}
        hasNoResults={hasNoResults}
        searchQuery={internalSearchQuery}
        resultsCount={filteredData.tlds.length}
      />

      <TldSummary
        selectedCount={selectedTlds.length}
        totalCount={TLD_EXTENSIONS.length}
        allSelected={allSelected}
        noneSelected={noneSelected}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* No Results State */}
      {hasNoResults ? (
        <NoResultsState
          searchQuery={internalSearchQuery}
          onClearSearch={clearSearch}
        />
      ) : /* Categorized or Flat Layout */
      filteredData.categories ? (
        <div className="space-y-4">
          {/* Popular Section (always visible) */}
          {popularCategory && (
            <CategorySection
              category={popularCategory}
              collapsedCategories={collapsedCategories}
              isSearching={isSearching}
              selectedTlds={selectedTlds}
              selectionState={getCategorySelectionState(popularCategory)}
              getTldHighlightState={getTldHighlightState}
              onCategoryToggle={handleCategoryToggle}
              onCategoryKeyDown={handleCategoryKeyDown}
              onCategorySelectAll={handleCategorySelectAll}
              onCategoryDeselectAll={handleCategoryDeselectAll}
              onTldToggle={handleTldToggle}
              onBulkSelect={handleBulkSelect}
            />
          )}

          {/* Enhanced Show More Toggle - hidden during search */}
          {!isSearching && (
            <ShowMoreToggle
              categories={filteredData.categories}
              showAllCategories={showAllCategories}
              onToggle={handleShowMoreToggle}
            />
          )}

          {/* Collapsible Categories - conditional rendering to prevent scrollbar issues */}
          {(showAllCategories || isSearching) && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-4 pt-4">
                {filteredData.categories
                  .filter(cat => cat.id !== 'popular')
                  .map(category => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      collapsedCategories={collapsedCategories}
                      isSearching={isSearching}
                      selectedTlds={selectedTlds}
                      selectionState={getCategorySelectionState(category)}
                      getTldHighlightState={getTldHighlightState}
                      onCategoryToggle={handleCategoryToggle}
                      onCategoryKeyDown={handleCategoryKeyDown}
                      onCategorySelectAll={handleCategorySelectAll}
                      onCategoryDeselectAll={handleCategoryDeselectAll}
                      onTldToggle={handleTldToggle}
                      onBulkSelect={handleBulkSelect}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Fallback: Flat Grid Layout */
        renderTldGrid(filteredData.tlds, 'all-tlds')
      )}
    </div>
  );
}
