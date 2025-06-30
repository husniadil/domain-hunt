'use client';

import { useState, useMemo } from 'react';
import { DomainResult, UnifiedDomainResult } from '@/types/domain';
import { isBookmarked } from '@/services/bookmark-service';

export type StatusToggle = 'available' | 'taken' | 'error';

export interface FilterCounts {
  available: number;
  taken: number;
  error: number;
  bookmarked: number;
  showing: number;
}

export interface ToggleStates {
  available: boolean;
  taken: boolean;
  error: boolean;
}

export function useResultFilters(unifiedResult: UnifiedDomainResult | null) {
  const [toggleStates, setToggleStates] = useState<ToggleStates>({
    available: true,
    taken: true,
    error: true,
  });

  const { filteredResults, counts, isEmpty } = useMemo(() => {
    if (!unifiedResult) {
      return {
        filteredResults: null,
        counts: {
          available: 0,
          taken: 0,
          error: 0,
          bookmarked: 0,
          showing: 0,
        },
        isEmpty: true,
      };
    }

    // Collect all domain results from all domains
    const allResults: DomainResult[] = [];
    Array.from(unifiedResult.resultsByDomain.values()).forEach(domainResult => {
      allResults.push(...domainResult.results);
    });

    // Calculate counts for each status type
    const counts: FilterCounts = {
      available: allResults.filter(r => r.status === 'available').length,
      taken: allResults.filter(r => r.status === 'taken').length,
      error: allResults.filter(r => r.status === 'error').length,
      bookmarked: allResults.filter(r => isBookmarked(r.domain, r.tld)).length,
      showing: 0, // Will be calculated after filtering
    };

    // Filter results based on toggle states
    const filterFunction = (result: DomainResult): boolean => {
      return toggleStates[result.status as StatusToggle] === true;
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

    // Update showing count
    counts.showing = totalFilteredResults;

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
  }, [unifiedResult, toggleStates]);

  const handleToggle = (status: StatusToggle) => {
    setToggleStates(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return {
    filteredResults,
    toggleStates,
    counts,
    isEmpty,
    onToggle: handleToggle,
  };
}
