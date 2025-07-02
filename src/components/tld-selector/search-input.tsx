import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  className?: string;
}

export function SearchInput({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        placeholder="Search TLDs by extension (.com), name (Commercial), or category..."
        value={searchQuery}
        onChange={onSearchChange}
        className={cn(
          'pr-8 transition-all duration-200 ease-in-out',
          isSearching && 'ring-2 ring-blue-500/30'
        )}
        aria-describedby="search-help"
        aria-expanded={isSearching}
        aria-controls="tld-results"
      />

      {/* Search Loading Indicator */}
      {isSearching && (
        <div
          className="absolute right-8 top-1/2 -translate-y-1/2 animate-pulse"
          role="status"
          aria-label="Searching TLDs"
        >
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {searchQuery && (
        <button
          onClick={onClearSearch}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200',
            'hover:text-foreground hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded',
            isSearching ? 'right-12' : 'right-2'
          )}
          title="Clear search"
          aria-label="Clear search query"
        >
          ✕
        </button>
      )}

      {/* Hidden search help text */}
      <div id="search-help" className="sr-only">
        Search by TLD extension, name, or category. Results update automatically
        as you type.
      </div>
    </div>
  );
}
