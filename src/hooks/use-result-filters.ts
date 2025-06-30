'use client';

import { useState, useMemo } from 'react';
import { DomainResult, UnifiedDomainResult } from '@/types/domain';
import { isBookmarked } from '@/services/bookmark-service';
import { FilterType, FilterCounts } from '@/components/filter-controls';

export interface FilteredResults {
  filteredResults: UnifiedDomainResult | null;
  activeFilter: FilterType;
  counts: FilterCounts;
  isEmpty: boolean;
}

export function useResultFilters(unifiedResult: UnifiedDomainResult | null) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const { filteredResults, counts, isEmpty } = useMemo(() => {
    if (!unifiedResult) {
      return {
        filteredResults: null,
        counts: {
          all: 0,
          available: 0,
          taken: 0,
          error: 0,
          bookmarked: 0,
        },
        isEmpty: true,
      };
    }

    // Collect all domain results from all domains
    const allResults: DomainResult[] = [];
    Array.from(unifiedResult.resultsByDomain.values()).forEach(domainResult => {
      allResults.push(...domainResult.results);
    });

    // Calculate counts for each filter type
    const counts: FilterCounts = {
      all: allResults.length,
      available: allResults.filter(r => r.status === 'available').length,
      taken: allResults.filter(r => r.status === 'taken').length,
      error: allResults.filter(r => r.status === 'error').length,
      bookmarked: allResults.filter(r => isBookmarked(r.domain, r.tld)).length,
    };

    // Apply filter if not 'all'
    if (activeFilter === 'all') {
      return {
        filteredResults: unifiedResult,
        counts,
        isEmpty: allResults.length === 0,
      };
    }

    // Filter results based on active filter
    const filterFunction = (result: DomainResult): boolean => {
      switch (activeFilter) {
        case 'available':
          return result.status === 'available';
        case 'taken':
          return result.status === 'taken';
        case 'error':
          return result.status === 'error';
        case 'bookmarked':
          return isBookmarked(result.domain, result.tld);
        default:
          return true;
      }
    };

    // Create filtered version of unified result
    const filteredResultsByDomain = new Map();
    let totalFilteredResults = 0;

    Array.from(unifiedResult.resultsByDomain.entries()).forEach(
      ([domain, domainResult]) => {
        const filteredDomainResults =
          domainResult.results.filter(filterFunction);

        if (filteredDomainResults.length > 0) {
          // Create filtered domain result
          const filteredDomainResult = {
            ...domainResult,
            results: filteredDomainResults,
          };
          filteredResultsByDomain.set(domain, filteredDomainResult);
          totalFilteredResults += filteredDomainResults.length;
        }
      }
    );

    // Update overall progress to reflect filtered results
    const filteredOverallProgress = {
      ...unifiedResult.overallProgress,
      total: totalFilteredResults,
      completed: totalFilteredResults, // All filtered results are completed
    };

    const filteredUnifiedResult: UnifiedDomainResult = {
      ...unifiedResult,
      resultsByDomain: filteredResultsByDomain,
      overallProgress: filteredOverallProgress,
    };

    return {
      filteredResults: filteredUnifiedResult,
      counts,
      isEmpty: totalFilteredResults === 0,
    };
  }, [unifiedResult, activeFilter]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  return {
    filteredResults,
    activeFilter,
    counts,
    isEmpty,
    onFilterChange: handleFilterChange,
  };
}
