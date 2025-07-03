import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  className?: string;
}

export function SearchInput({
  searchQuery,
  onSearchChange,
  onClearSearch,
  className,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    onClearSearch();
    // Focus back to input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search TLDs by extension (.com), name (Commercial), or category..."
        value={searchQuery}
        onChange={onSearchChange}
        className={cn(
          'transition-all duration-200 ease-in-out',
          searchQuery ? 'pr-8' : 'pr-4'
        )}
        aria-describedby="search-help"
        aria-expanded={!!searchQuery}
        aria-controls="tld-results"
      />

      {/* Clear button - always positioned at the far right */}
      {searchQuery && (
        <button
          onClick={handleClearSearch}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200',
            'hover:text-foreground hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded'
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
