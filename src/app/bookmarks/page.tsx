'use client';

import { useState, useEffect } from 'react';
import { BookmarkHeader } from '@/components/bookmark-header';
import { BookmarkStats } from '@/components/bookmark-stats';
import { BookmarkControls } from '@/components/bookmark-controls';
import { BookmarkList } from '@/components/bookmark-list';
import {
  getAllBookmarks,
  filterBookmarks,
  getBookmarkStats,
  updateBookmarkStatus,
} from '@/services/bookmark-service';
import { checkDomain } from '@/services/domain-checker';
import { Bookmark, BookmarkFilter } from '@/types/bookmark';
import { DomainResult } from '@/types/domain';
import { DOMAIN_STATUS } from '@/constants/domain-status';
import { toast } from 'sonner';
import { formatErrorForToast, isOffline } from '@/utils/error-handling';
import pLimit from 'p-limit';

// Configuration constants
const BOOKMARK_RECHECK_CONCURRENCY_LIMIT = 5; // Max concurrent domain checks

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<BookmarkFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    taken: 0,
    errors: 0,
  });

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Listen for bookmark changes from other components/pages
  useEffect(() => {
    const handleBookmarkChange = () => {
      loadBookmarks();
    };

    window.addEventListener('bookmarkStatsChanged', handleBookmarkChange);
    return () => {
      window.removeEventListener('bookmarkStatsChanged', handleBookmarkChange);
    };
  }, []);

  // Apply filters when bookmarks or filter changes
  useEffect(() => {
    const filtered = filterBookmarks({
      ...filter,
      searchTerm: searchTerm || undefined,
    });
    setFilteredBookmarks(filtered);
  }, [bookmarks, filter, searchTerm]);

  const loadBookmarks = () => {
    const allBookmarks = getAllBookmarks();
    setBookmarks(allBookmarks);
    setStats(getBookmarkStats());
  };

  const handleBookmarkToggle = (id: string, isBookmarked: boolean) => {
    // Reload bookmarks when one is removed
    if (!isBookmarked) {
      loadBookmarks();
    }
  };

  const handleRecheckAll = async () => {
    if (bookmarks.length === 0) {
      toast.warning('No bookmarks to recheck');
      return;
    }

    if (isOffline()) {
      toast.error('You appear to be offline', {
        description: 'Please check your internet connection and try again.',
      });
      return;
    }

    setIsChecking(true);
    try {
      // Check only the actual bookmarked domain+TLD pairs
      // Process all bookmarks with controlled concurrency to optimize performance
      // while preventing client/server overload
      const limit = pLimit(BOOKMARK_RECHECK_CONCURRENCY_LIMIT);

      const domainCheckResults = await Promise.all(
        bookmarks.map(bookmark =>
          limit(async () => {
            try {
              const domainCheckResult = await checkDomain(
                bookmark.domain,
                bookmark.tld
              );
              return {
                domain: domainCheckResult.domain,
                tld: domainCheckResult.tld,
                status: domainCheckResult.status,
              };
            } catch (error) {
              console.error(
                `Error checking ${bookmark.domain}${bookmark.tld}:`,
                error
              );
              return {
                domain: bookmark.domain,
                tld: bookmark.tld,
                status: DOMAIN_STATUS.ERROR as DomainResult['status'],
              };
            }
          })
        )
      );

      // Update bookmark statuses
      for (const result of domainCheckResults) {
        updateBookmarkStatus(result.domain, result.tld, result.status);
      }

      // Reload bookmarks to reflect updates
      loadBookmarks();

      // Show success toast with summary
      const totalChecked = domainCheckResults.length;
      const failed = domainCheckResults.filter(
        r => r.status === DOMAIN_STATUS.ERROR
      ).length;
      const successful = totalChecked - failed;

      // Guard against edge case of zero results
      if (totalChecked === 0) {
        toast.info('No domains were checked');
      } else if (failed === 0) {
        toast.success(
          `Successfully rechecked ${totalChecked} bookmarked domains`
        );
      } else if (successful > 0) {
        toast.warning(`Rechecked ${successful} domains with ${failed} errors`, {
          description:
            'Some domains could not be checked. See individual results for details.',
        });
      } else {
        toast.error('Bookmark recheck failed', {
          description:
            'Could not check any domains. Please check your connection and try again.',
        });
      }
    } catch (error) {
      console.error('Error rechecking bookmarks:', error);
      const errorFormat = formatErrorForToast(
        error instanceof Error ? error : 'Unknown error occurred'
      );
      toast.error(errorFormat.title, {
        description: errorFormat.description,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <BookmarkHeader />

        <BookmarkStats stats={stats} />

        <BookmarkControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
          onRecheckAll={handleRecheckAll}
          isChecking={isChecking}
          bookmarksCount={bookmarks.length}
        />

        <BookmarkList
          filteredBookmarks={filteredBookmarks}
          totalBookmarks={bookmarks.length}
          onBookmarkToggle={handleBookmarkToggle}
        />
      </div>
    </div>
  );
}
