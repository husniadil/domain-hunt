interface AccessibilityAnnouncementsProps {
  isSearching: boolean;
  hasNoResults: boolean;
  searchQuery: string;
  resultsCount: number;
  selectedCount: number;
}

export function AccessibilityAnnouncements({
  isSearching,
  hasNoResults,
  searchQuery,
  resultsCount,
  selectedCount,
}: AccessibilityAnnouncementsProps) {
  return (
    <>
      {/* ARIA Live Regions for Screen Reader Announcements */}
      <div
        id="tld-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isSearching &&
          !hasNoResults &&
          `Found ${resultsCount} TLD${resultsCount === 1 ? '' : 's'} matching "${searchQuery}"`}
        {hasNoResults && 'No TLDs found matching your search.'}
        {selectedCount > 0 &&
          `${selectedCount} TLD${selectedCount === 1 ? '' : 's'} selected`}
      </div>

      {/* Skip Link for Large Categories */}
      <div className="sr-only">
        <a
          href="#tld-summary"
          className="skip-link focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to TLD selection summary
        </a>
      </div>
    </>
  );
}
