'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type FilterType = 'all' | 'available' | 'taken' | 'error' | 'bookmarked';

export interface FilterCounts {
  all: number;
  available: number;
  taken: number;
  error: number;
  bookmarked: number;
}

interface FilterControlsProps {
  activeFilter: FilterType;
  counts: FilterCounts;
  onFilterChange: (filter: FilterType) => void;
  showBookmarked?: boolean;
}

const filterLabels: Record<FilterType, string> = {
  all: 'All',
  available: 'Available',
  taken: 'Taken',
  error: 'Error',
  bookmarked: 'Bookmarked',
};

const filterColors: Record<FilterType, string> = {
  all: 'bg-gray-100 text-gray-800 border-gray-200',
  available: 'bg-green-100 text-green-800 border-green-200',
  taken: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  bookmarked: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function FilterControls({
  activeFilter,
  counts,
  onFilterChange,
  showBookmarked = true,
}: FilterControlsProps) {
  const filters: FilterType[] = showBookmarked
    ? ['all', 'available', 'taken', 'error', 'bookmarked']
    : ['all', 'available', 'taken', 'error'];

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
      <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
      {filters.map(filter => {
        const isActive = activeFilter === filter;
        const count = counts[filter];

        return (
          <Button
            key={filter}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(filter)}
            className="flex items-center justify-center gap-1.5 h-8 min-w-fit"
          >
            <span className="whitespace-nowrap">{filterLabels[filter]}</span>
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0.5 min-w-[1.75rem] text-center ${
                isActive
                  ? 'bg-white/20 text-white border-white/30'
                  : filterColors[filter]
              }`}
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
