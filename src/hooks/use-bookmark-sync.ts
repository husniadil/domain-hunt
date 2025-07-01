import { useCallback, useEffect, useRef } from 'react';
import { UnifiedDomainResult } from '@/types/domain';
import { getAllBookmarks } from '@/services/bookmark-service';

interface UseBookmarkSyncProps {
  unifiedResult: UnifiedDomainResult | null;
  setUnifiedResult: (result: UnifiedDomainResult) => void;
}

export function useBookmarkSync({
  unifiedResult,
  setUnifiedResult,
}: UseBookmarkSyncProps) {
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
        const key = `${bookmark.domain}${bookmark.tld}`;
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
            const key = `${result.domain}${result.tld}`;
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

  return {
    syncBookmarksWithUnifiedResult,
  };
}
