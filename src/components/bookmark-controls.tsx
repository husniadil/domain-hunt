import { Button } from '@/components/ui/button';
import { BookmarkFilter } from '@/types/bookmark';
import { DomainResult } from '@/types/domain';
import { RefreshCw, Search, ChevronDown } from 'lucide-react';

interface BookmarkControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filter: BookmarkFilter;
  onFilterChange: (filter: BookmarkFilter) => void;
  onRecheckAll: () => void;
  isChecking: boolean;
  bookmarksCount: number;
}

export function BookmarkControls({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  onRecheckAll,
  isChecking,
  bookmarksCount,
}: BookmarkControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search bookmarks..."
          aria-label="Search bookmarks"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <select
            value={filter.status || ''}
            onChange={e =>
              onFilterChange({
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
          onClick={onRecheckAll}
          disabled={isChecking || bookmarksCount === 0}
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
  );
}
