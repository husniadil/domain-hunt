interface SearchResultsInfoProps {
  isSearching: boolean;
  hasNoResults: boolean;
  searchQuery: string;
  resultsCount: number;
}

export function SearchResultsInfo({
  isSearching,
  hasNoResults,
  searchQuery,
  resultsCount,
}: SearchResultsInfoProps) {
  if (!isSearching) return null;

  return (
    <div
      id="tld-results"
      className="text-sm text-muted-foreground animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      {hasNoResults ? (
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <span>⚠️</span>
          No TLDs found matching your search. Try adjusting your search terms.
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <span>✓</span>
          Found {resultsCount} TLD{resultsCount === 1 ? '' : 's'} matching
          &ldquo;
          {searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
}
