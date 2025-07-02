import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TldSummaryProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  noneSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function TldSummary({
  selectedCount,
  totalCount,
  allSelected,
  noneSelected,
  onSelectAll,
  onDeselectAll,
}: TldSummaryProps) {
  return (
    <div
      id="tld-summary"
      className="flex items-center justify-between scroll-mt-4"
    >
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Select TLD Extensions</h3>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={allSelected}
          className={cn(
            'transition-all duration-200 hover:scale-105 active:scale-95',
            allSelected && 'opacity-50'
          )}
          aria-describedby="select-all-help"
          title={`Select all ${totalCount} TLD extensions`}
        >
          <span className="flex items-center gap-1">
            ✓ Select All
            {allSelected && <span className="text-xs">({totalCount})</span>}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeselectAll}
          disabled={noneSelected}
          className={cn(
            'transition-all duration-200 hover:scale-105 active:scale-95',
            noneSelected && 'opacity-50'
          )}
          aria-describedby="clear-help"
          title="Clear all selected TLD extensions"
        >
          <span className="flex items-center gap-1">
            ✕ Clear
            {!noneSelected && (
              <span className="text-xs">({selectedCount})</span>
            )}
          </span>
        </Button>

        {/* Hidden help text for screen readers */}
        <div id="select-all-help" className="sr-only">
          Select all available TLD extensions. Use Ctrl+A while focused on any
          checkbox for keyboard access.
        </div>
        <div id="clear-help" className="sr-only">
          Clear all currently selected TLD extensions.
        </div>
      </div>
    </div>
  );
}
