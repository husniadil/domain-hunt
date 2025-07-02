interface NoResultsStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export function NoResultsState({
  searchQuery,
  onClearSearch,
}: NoResultsStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>No TLDs found matching &quot;{searchQuery}&quot;</p>
      <button
        onClick={onClearSearch}
        className="mt-2 text-sm text-primary hover:underline"
      >
        Clear search to see all TLDs
      </button>
    </div>
  );
}
