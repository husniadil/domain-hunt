import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TLD, TLDCategory } from '@/types/tld';

interface UseTldSearchProps {
  tlds: TLD[];
  categories: TLDCategory[] | null;
  externalQuery?: string;
  onSearchChange?: (query: string) => void;
}

interface UseTldSearchReturn {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  filteredData: {
    tlds: TLD[];
    categories: TLDCategory[] | null;
  };
  isSearching: boolean;
  hasNoResults: boolean;
  normalizedSearchQuery: string;
  getTldHighlightState: (tld: TLD) => boolean;
}

export function useTldSearch({
  tlds,
  categories,
  externalQuery = '',
  onSearchChange,
}: UseTldSearchProps): UseTldSearchReturn {
  const [internalQuery, setInternalQuery] = useState(externalQuery);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external query changes
  useEffect(() => {
    setInternalQuery(externalQuery);
  }, [externalQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced search handler
  const debouncedSearchChange = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearchChange?.(query);
      }, 300);
    },
    [onSearchChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setInternalQuery(query);
      debouncedSearchChange(query);
    },
    [debouncedSearchChange]
  );

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setInternalQuery('');
    onSearchChange?.('');
  }, [onSearchChange]);

  // Filter TLDs based on search query
  const filteredData = useMemo(() => {
    if (!internalQuery.trim()) {
      return { tlds, categories };
    }

    const query = internalQuery.toLowerCase().trim();

    // Filter TLDs that match extension, name, or category
    const matchingTlds = tlds.filter(
      tld =>
        tld.extension.toLowerCase().includes(query) ||
        tld.name.toLowerCase().includes(query) ||
        (tld.category && tld.category.toLowerCase().includes(query))
    );

    // If no categories, return filtered flat list
    if (!categories) {
      return { tlds: matchingTlds, categories: null };
    }

    // Create filtered categories containing only matching TLDs
    const matchingExtensions = matchingTlds.map(tld => tld.extension);
    const filteredCategories = categories
      .map(category => ({
        ...category,
        tlds: category.tlds.filter(tld =>
          matchingExtensions.includes(tld.extension)
        ),
      }))
      .filter(category => category.tlds.length > 0);

    return { tlds: matchingTlds, categories: filteredCategories };
  }, [internalQuery, tlds, categories]);

  const isSearching = internalQuery.trim().length > 0;
  const hasNoResults = isSearching && filteredData.tlds.length === 0;

  // Memoized search query for performance optimization
  const normalizedSearchQuery = useMemo(
    () => internalQuery.toLowerCase().trim(),
    [internalQuery]
  );

  // Memoized TLD highlight checker for performance optimization
  const getTldHighlightState = useCallback(
    (tld: TLD): boolean => {
      return !!(
        normalizedSearchQuery &&
        (tld.extension.toLowerCase().includes(normalizedSearchQuery) ||
          tld.name.toLowerCase().includes(normalizedSearchQuery))
      );
    },
    [normalizedSearchQuery]
  );

  return {
    searchQuery: internalQuery,
    handleSearchChange,
    clearSearch,
    filteredData,
    isSearching,
    hasNoResults,
    normalizedSearchQuery,
    getTldHighlightState,
  };
}
