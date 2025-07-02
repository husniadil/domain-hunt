import { useState, useEffect, useMemo, useCallback } from 'react';
import { TLDCategory } from '@/types/tld';

interface CategoryState {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isNoneSelected: boolean;
  isPartiallySelected: boolean;
}

interface UseTldSelectionProps {
  tldExtensions: string[];
  initialTlds?: string[];
  filteredCategories?: TLDCategory[] | null;
  onTldsChange?: (tlds: string[]) => void;
}

interface UseTldSelectionReturn {
  selectedTlds: string[];
  allSelected: boolean;
  noneSelected: boolean;
  handleTldToggle: (tld: string, checked: boolean) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleBulkSelect: (extensions: string[]) => void;
  categorySelectionStates: Map<string, CategoryState>;
  getCategorySelectionState: (category: TLDCategory) => CategoryState;
  handleCategorySelectAll: (category: TLDCategory) => void;
  handleCategoryDeselectAll: (category: TLDCategory) => void;
}

export function useTldSelection({
  tldExtensions,
  initialTlds = [],
  filteredCategories,
  onTldsChange,
}: UseTldSelectionProps): UseTldSelectionReturn {
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);

  // Sync with initialTlds changes (including when cleared)
  useEffect(() => {
    setSelectedTlds(initialTlds);
    onTldsChange?.(initialTlds);
  }, [initialTlds, onTldsChange]);

  const handleTldToggle = useCallback(
    (tld: string, checked: boolean) => {
      const newSelectedTlds = checked
        ? [...selectedTlds, tld]
        : selectedTlds.filter(t => t !== tld);

      setSelectedTlds(newSelectedTlds);
      onTldsChange?.(newSelectedTlds);
    },
    [selectedTlds, onTldsChange]
  );

  const handleSelectAll = useCallback(() => {
    setSelectedTlds([...tldExtensions]);
    onTldsChange?.(tldExtensions);
  }, [tldExtensions, onTldsChange]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTlds([]);
    onTldsChange?.([]);
  }, [onTldsChange]);

  // Enhanced bulk selection handler for keyboard shortcuts
  const handleBulkSelect = useCallback(
    (extensions: string[]) => {
      const newSelectedTlds = [...new Set([...selectedTlds, ...extensions])];
      setSelectedTlds(newSelectedTlds);
      onTldsChange?.(newSelectedTlds);
    },
    [selectedTlds, onTldsChange]
  );

  // Memoized category selection states for performance
  const categorySelectionStates = useMemo(() => {
    const states = new Map<string, CategoryState>();

    if (filteredCategories) {
      filteredCategories.forEach(category => {
        const categoryTlds = category.tlds.map(tld => tld.extension);
        const selectedInCategory = selectedTlds.filter(tld =>
          categoryTlds.includes(tld)
        );

        states.set(category.id, {
          selectedCount: selectedInCategory.length,
          totalCount: categoryTlds.length,
          isAllSelected: selectedInCategory.length === categoryTlds.length,
          isNoneSelected: selectedInCategory.length === 0,
          isPartiallySelected:
            selectedInCategory.length > 0 &&
            selectedInCategory.length < categoryTlds.length,
        });
      });
    }

    return states;
  }, [filteredCategories, selectedTlds]);

  // Optimized category selection state getter
  const getCategorySelectionState = useCallback(
    (category: TLDCategory) => {
      return (
        categorySelectionStates.get(category.id) || {
          selectedCount: 0,
          totalCount: 0,
          isAllSelected: false,
          isNoneSelected: true,
          isPartiallySelected: false,
        }
      );
    },
    [categorySelectionStates]
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

  const allSelected = selectedTlds.length === tldExtensions.length;
  const noneSelected = selectedTlds.length === 0;

  return {
    selectedTlds,
    allSelected,
    noneSelected,
    handleTldToggle,
    handleSelectAll,
    handleDeselectAll,
    handleBulkSelect,
    categorySelectionStates,
    getCategorySelectionState,
    handleCategorySelectAll,
    handleCategoryDeselectAll,
  };
}
