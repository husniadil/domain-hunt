import { FilterToggleButton } from '@/components/filter-toggle-button';

interface FilterCounts {
  showing: number;
  available: number;
  taken: number;
  error: number;
}

interface FilterToggleStates {
  available: boolean;
  taken: boolean;
  error: boolean;
}

interface FilterStatsProps {
  counts: FilterCounts;
  toggleStates: FilterToggleStates;
  onToggle: (type: 'available' | 'taken' | 'error') => void;
}

export function FilterStats({
  counts,
  toggleStates,
  onToggle,
}: FilterStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
      <div className="flex justify-between p-2 bg-container-bg border border-container-border rounded">
        <span>Showing:</span>
        <span>{counts.showing}</span>
      </div>
      <FilterToggleButton
        type="available"
        label="Available"
        count={counts.available}
        isActive={toggleStates.available}
        onClick={() => onToggle('available')}
      />
      <FilterToggleButton
        type="taken"
        label="Taken"
        count={counts.taken}
        isActive={toggleStates.taken}
        onClick={() => onToggle('taken')}
      />
      <FilterToggleButton
        type="error"
        label="Errors"
        count={counts.error}
        isActive={toggleStates.error}
        onClick={() => onToggle('error')}
      />
    </div>
  );
}
