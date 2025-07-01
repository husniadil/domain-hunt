'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DomainInput } from '@/components/domain-input';
import { TldSelector } from '@/components/tld-selector';
import { Badge } from '@/components/ui/badge';
import {
  checkDomainsUnified,
  retryDomainCheck,
} from '@/services/domain-checker';
import { UnifiedLookupProgress, UnifiedDomainResult } from '@/types/domain';
import { useHomepageState } from '@/hooks/use-homepage-state';
import { useResultFilters } from '@/hooks/use-result-filters';
import { ErrorBoundary } from '@/components/error-boundary';
import { HomepageHeader } from '@/components/homepage-header';
import { ProgressDisplay } from '@/components/progress-display';
import { FilterStats } from '@/components/filter-stats';
import { ActionButtons } from '@/components/action-buttons';
import { DomainResults } from '@/components/domain-results';
import { toast } from 'sonner';
import { formatErrorForToast, isOffline } from '@/utils/error-handling';
import {
  updateBookmarkStatus,
  isBookmarked,
  getAllBookmarks,
} from '@/services/bookmark-service';

export default function Home() {
  const {
    domains,
    selectedTlds,
    unifiedResult,
    setDomains,
    setSelectedTlds,
    setUnifiedResult,
    clearState,
  } = useHomepageState();
  const [progress, setProgress] = useState<UnifiedLookupProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [retryingDomains, setRetryingDomains] = useState<Set<string>>(
    new Set()
  );

  const { filteredResults, toggleStates, counts, isEmpty, onToggle } =
    useResultFilters(unifiedResult);

  // Track if we've already synced this unifiedResult to avoid infinite loops
  const syncedResultRef = useRef<string | null>(null);

  // Helper function to sync bookmarks with unified result
  const syncBookmarksWithUnifiedResult = useCallback(
    (
      unifiedResult: UnifiedDomainResult,
      setUnifiedResult: (result: UnifiedDomainResult) => void,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      syncedResultRef?: React.MutableRefObject<string | null>
    ) => {
      if (!unifiedResult) return;

      // Get current bookmarks to sync status
      const bookmarks = getAllBookmarks();
      const bookmarkMap = new Map();
      bookmarks.forEach(bookmark => {
        const key = `${bookmark.domain}.${bookmark.tld}`;
        bookmarkMap.set(key, bookmark.lastKnownStatus);
      });

      // Update unifiedResult with latest bookmark statuses
      let hasChanges = false;
      const updatedResultsByDomain = new Map();

      Array.from(unifiedResult.resultsByDomain.entries()).forEach(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => {
          const [domain, domainResult] = entry;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updatedResults = domainResult.results.map((result: any) => {
            const key = `${result.domain}.${result.tld}`;
            const bookmarkStatus = bookmarkMap.get(key);

            // If this domain is bookmarked and status is different, update it
            if (bookmarkStatus && bookmarkStatus !== result.status) {
              hasChanges = true;
              return { ...result, status: bookmarkStatus };
            }
            return result;
          });

          updatedResultsByDomain.set(domain, {
            ...domainResult,
            results: updatedResults,
          });
        }
      );

      // Update state if there were changes
      if (hasChanges) {
        setUnifiedResult({
          ...unifiedResult,
          resultsByDomain: updatedResultsByDomain,
        });
      }
    },
    []
  );

  // Sync homepage results with bookmark changes when unifiedResult loads
  useEffect(() => {
    if (!unifiedResult) return;

    // Create a simple hash of the result to track if we've already synced it
    const resultHash = `${unifiedResult.overallProgress?.total}-${unifiedResult.overallProgress?.completed}`;
    if (syncedResultRef.current === resultHash) return;

    syncBookmarksWithUnifiedResult(
      unifiedResult,
      setUnifiedResult,
      syncedResultRef
    );

    // Mark this result as synced
    syncedResultRef.current = resultHash;
  }, [unifiedResult, setUnifiedResult, syncBookmarksWithUnifiedResult]);

  // Listen for bookmark changes and sync with homepage results
  useEffect(() => {
    const handleBookmarkChange = () => {
      if (!unifiedResult) return;
      syncBookmarksWithUnifiedResult(unifiedResult, setUnifiedResult);
    };

    // Listen for both custom events and storage events for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookmarkChangeSignal') {
        handleBookmarkChange();
      }
    };

    window.addEventListener('bookmarkStatsChanged', handleBookmarkChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('bookmarkStatsChanged', handleBookmarkChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [unifiedResult, setUnifiedResult, syncBookmarksWithUnifiedResult]);

  const handleCheckDomains = async () => {
    if (domains.length === 0 || selectedTlds.length === 0) {
      toast.warning(
        'Please enter at least one domain and select at least one TLD'
      );
      return;
    }

    // Check for offline status
    if (isOffline()) {
      toast.error('You appear to be offline', {
        description: 'Please check your internet connection and try again.',
      });
      return;
    }

    // Create new abort controller for cancellation support
    const controller = new AbortController();
    setAbortController(controller);
    setIsChecking(true);
    setUnifiedResult(null);
    setProgress(null);

    try {
      const result = await checkDomainsUnified(domains, selectedTlds, {
        progressCallback: progressUpdate => {
          setProgress(progressUpdate);
        },
        abortSignal: controller.signal,
      });

      setUnifiedResult(result);

      // Show success toast with summary
      const totalChecked = result.overallProgress.completed;
      const failed = result.overallProgress.failed;

      if (failed === 0) {
        toast.success(`Successfully checked ${totalChecked} domains`);
      } else if (failed < totalChecked) {
        toast.warning(`Checked ${totalChecked} domains with ${failed} errors`, {
          description:
            'Some domains could not be checked. See individual results for details.',
        });
      } else {
        toast.error('Domain check failed', {
          description:
            'Could not check any domains. Please check your connection and try again.',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation cancelled') {
        toast.info('Domain check cancelled');
      } else {
        console.error('Error checking domains:', error);
        const errorFormat = formatErrorForToast(
          error instanceof Error ? error : 'Unknown error occurred'
        );
        toast.error(errorFormat.title, {
          description: errorFormat.description,
        });
      }
    } finally {
      setIsChecking(false);
      setAbortController(null);
    }
  };

  const handleCancelCheck = () => {
    if (abortController) {
      abortController.abort();
      setIsChecking(false);
      setAbortController(null);
    }
  };

  const handleClearResults = () => {
    clearState();
    setProgress(null);
  };

  const handleRetryDomain = async (domain: string, tld: string) => {
    const domainKey = `${domain}.${tld}`;

    // Check if already retrying
    if (retryingDomains.has(domainKey)) {
      return;
    }

    // Check for offline status
    if (isOffline()) {
      toast.error('You appear to be offline', {
        description: 'Please check your internet connection and try again.',
      });
      return;
    }

    setRetryingDomains(prev => new Set(prev).add(domainKey));

    try {
      const result = await retryDomainCheck(domain, tld);

      // Update the result in unifiedResult
      if (unifiedResult) {
        const updatedResultsByDomain = new Map(unifiedResult.resultsByDomain);
        const domainResult = updatedResultsByDomain.get(domain);

        if (domainResult) {
          // Find and update the specific result
          const updatedResults = domainResult.results.map(r =>
            r.domain === domain && r.tld === tld ? result : r
          );

          // Update successful/failed arrays
          const successful = updatedResults.filter(r => r.status !== 'error');
          const failed = updatedResults.filter(r => r.status === 'error');

          updatedResultsByDomain.set(domain, {
            ...domainResult,
            results: updatedResults,
            successful,
            failed,
          });

          setUnifiedResult({
            ...unifiedResult,
            resultsByDomain: updatedResultsByDomain,
          });
        }
      }

      // Update bookmark status if domain is bookmarked
      if (result.status !== 'error' && isBookmarked(domain, tld)) {
        updateBookmarkStatus(domain, tld, result.status);
      }

      // Show success/error toast
      if (result.status === 'error') {
        const errorFormat = formatErrorForToast(result.error || 'Retry failed');
        toast.error(`Retry failed for ${domain}.${tld}`, {
          description: errorFormat.description,
        });
      } else {
        toast.success(`Successfully retried ${domain}.${tld}`, {
          description: `Domain is ${result.status}`,
        });
      }
    } catch (error) {
      console.error('Error retrying domain:', error);
      const errorFormat = formatErrorForToast(
        error instanceof Error ? error : 'Unknown error occurred'
      );
      toast.error(`Failed to retry ${domain}.${tld}`, {
        description: errorFormat.description,
      });
    } finally {
      setRetryingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainKey);
        return newSet;
      });
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center min-h-[calc(100vh-8rem)]">
          <HomepageHeader />

          <div className="w-full max-w-md space-y-6">
            <DomainInput
              onDomainsChange={setDomains}
              className="text-center"
              initialDomains={domains}
            />

            <TldSelector
              onTldsChange={setSelectedTlds}
              initialTlds={selectedTlds}
            />

            <ActionButtons
              domains={domains}
              selectedTlds={selectedTlds}
              unifiedResult={unifiedResult}
              isChecking={isChecking}
              onCheckDomains={handleCheckDomains}
              onCancelCheck={handleCancelCheck}
              onClearResults={handleClearResults}
            />

            {/* Progress Display */}
            <ProgressDisplay progress={progress} />

            {/* Unified Results Section */}
            {unifiedResult && (
              <div className="w-full space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Domain Check Results
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {unifiedResult.totalDuration}ms
                    </Badge>
                    {unifiedResult.cancelled && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-yellow-100 text-yellow-800"
                      >
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Toggleable Filter Stats */}
                <FilterStats
                  counts={counts}
                  toggleStates={toggleStates}
                  onToggle={onToggle}
                />

                {/* Results by Domain */}
                <DomainResults
                  filteredResults={filteredResults}
                  isEmpty={isEmpty}
                  retryingDomains={retryingDomains}
                  onRetryDomain={handleRetryDomain}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
