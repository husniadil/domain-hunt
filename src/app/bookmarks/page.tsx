'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/bookmark-button';
import {
  getAllBookmarks,
  filterBookmarks,
  getBookmarkStats,
  updateBookmarkStatus,
} from '@/services/bookmark-service';
import { checkDomainsUnified } from '@/services/domain-checker';
import { Bookmark, BookmarkFilter } from '@/types/bookmark';
import { DomainResult } from '@/types/domain';
import { getStatusColor } from '@/lib/utils';
import { DEFAULT_ERROR_STATUS } from '@/constants/domain-status';
import { RefreshCw, Search, ChevronDown } from 'lucide-react';

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

  const handleBookmarkToggle = (isBookmarked: boolean) => {
    // Reload bookmarks when one is removed
    if (!isBookmarked) {
      loadBookmarks();
    }
  };

  const handleRecheckAll = async () => {
    if (bookmarks.length === 0) return;

    setIsChecking(true);
    try {
      // Prepare domains and TLDs for checking
      const domainsToCheck = Array.from(new Set(bookmarks.map(b => b.domain)));
      const tldsToCheck = Array.from(new Set(bookmarks.map(b => b.tld)));

      const result = await checkDomainsUnified(domainsToCheck, tldsToCheck);

      // Update bookmark statuses
      for (const [, domainResult] of result.resultsByDomain.entries()) {
        for (const domainCheck of domainResult.results) {
          updateBookmarkStatus(
            domainCheck.domain,
            domainCheck.tld,
            domainCheck.status
          );
        }
      }

      // Reload bookmarks to reflect updates
      loadBookmarks();
    } catch (error) {
      console.error('Error rechecking bookmarks:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Bookmarked Domains
          </h1>
          <p className="text-muted-foreground">
            Manage and track your favorite domain names
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-container-bg border border-container-border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-status-available-bg border border-status-available-border rounded-lg p-4">
            <div className="text-2xl font-bold text-status-available">
              {stats.available}
            </div>
            <div className="text-sm text-status-available">Available</div>
          </div>
          <div className="bg-status-taken-bg border border-status-taken-border rounded-lg p-4">
            <div className="text-2xl font-bold text-status-taken">
              {stats.taken}
            </div>
            <div className="text-sm text-status-taken">Taken</div>
          </div>
          <div className="bg-status-error-bg border border-status-error-border rounded-lg p-4">
            <div className="text-2xl font-bold text-status-error">
              {stats.errors}
            </div>
            <div className="text-sm text-status-error">Errors</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              aria-label="Search bookmarks"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filter.status || ''}
                onChange={e =>
                  setFilter({
                    ...filter,
                    status: e.target.value
                      ? (e.target.value as DomainResult['status'])
                      : undefined,
                  })
                }
                className="h-10 pl-3 pr-8 border rounded-lg appearance-none bg-background w-full"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="taken">Taken</option>
                <option value="error">Error</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <Button
              onClick={handleRecheckAll}
              disabled={isChecking || bookmarks.length === 0}
              variant="outline"
              className="h-10 px-3"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Recheck All
            </Button>
          </div>
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {bookmarks.length === 0 ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No bookmarks yet
                  </h3>
                  <p className="text-gray-500">
                    Start bookmarking domains from the search results to see
                    them here.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No matching bookmarks
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className="border border-container-border rounded-lg p-4 bg-container-bg hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-lg font-medium">
                        {bookmark.domain}
                        {bookmark.tld}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(bookmark.lastKnownStatus)}`}
                        >
                          {bookmark.lastKnownStatus || DEFAULT_ERROR_STATUS}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        Bookmarked: {formatDate(bookmark.bookmarkedAt)}
                      </span>
                      {bookmark.lastCheckedAt && (
                        <span>
                          Last checked: {formatDate(bookmark.lastCheckedAt)}
                        </span>
                      )}
                    </div>

                    {bookmark.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        {bookmark.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <BookmarkButton
                      domain={bookmark.domain}
                      tld={bookmark.tld}
                      status={bookmark.lastKnownStatus}
                      onToggle={handleBookmarkToggle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
