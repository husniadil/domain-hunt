import { Button } from '@/components/ui/button';
import { VirtualTldGrid } from '@/components/virtual-tld-grid';
import { cn } from '@/lib/utils';
import { TLD, TLDCategory } from '@/types/tld';

interface CategoryState {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isNoneSelected: boolean;
  isPartiallySelected: boolean;
}

interface CategorySectionProps {
  category: TLDCategory;
  collapsedCategories: string[];
  isSearching: boolean;
  selectedTlds: string[];
  selectionState: CategoryState;
  getTldHighlightState: (tld: TLD) => boolean;
  onCategoryToggle: (categoryId: string) => void;
  onCategoryKeyDown: (e: React.KeyboardEvent, categoryId: string) => void;
  onCategorySelectAll: (category: TLDCategory) => void;
  onCategoryDeselectAll: (category: TLDCategory) => void;
  onTldToggle: (tld: string, checked: boolean) => void;
  onBulkSelect: (extensions: string[]) => void;
}

export function CategorySection({
  category,
  collapsedCategories,
  isSearching,
  selectedTlds,
  selectionState,
  getTldHighlightState,
  onCategoryToggle,
  onCategoryKeyDown,
  onCategorySelectAll,
  onCategoryDeselectAll,
  onTldToggle,
  onBulkSelect,
}: CategorySectionProps) {
  const isCollapsed = collapsedCategories.includes(category.id);
  const isPopular = category.id === 'popular';
  const shouldExpand = isSearching || !isCollapsed || isPopular;
  const isToggleDisabled = isPopular || isSearching;

  // Visual indicator for selection state
  const getSelectionIcon = () => {
    if (selectionState.isAllSelected) {
      return '✓'; // checkmark for all selected
    } else if (selectionState.isPartiallySelected) {
      return '−'; // dash for partial selection
    } else {
      return '☐'; // empty box for none selected
    }
  };

  return (
    <div key={category.id} className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onCategoryToggle(category.id)}
          onKeyDown={e => onCategoryKeyDown(e, category.id)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium transition-all duration-200',
            !isToggleDisabled &&
              'hover:text-primary hover:bg-muted/50 rounded-md px-2 py-1 -mx-2',
            isToggleDisabled && 'cursor-default'
          )}
          disabled={isToggleDisabled}
          aria-expanded={shouldExpand}
          aria-controls={`category-content-${category.id}`}
          aria-label={`${shouldExpand ? 'Collapse' : 'Expand'} ${category.name} category`}
          title={
            isToggleDisabled
              ? undefined
              : `${shouldExpand ? 'Collapse' : 'Expand'} ${category.name} category`
          }
        >
          {!isPopular && !isSearching && (
            <span
              className={cn(
                'text-xs transition-transform duration-200 ease-in-out',
                !isCollapsed && 'rotate-90'
              )}
            >
              ▶
            </span>
          )}
          <span className="text-xs mr-1">{getSelectionIcon()}</span>
          {category.name}
          <span className="text-xs text-muted-foreground">
            ({selectionState.selectedCount}/{selectionState.totalCount}{' '}
            selected)
          </span>
          {isSearching && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              (matches)
            </span>
          )}
        </button>

        {/* Bulk Selection Controls */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onCategorySelectAll(category);
            }}
            disabled={selectionState.isAllSelected}
            className="text-xs h-6 px-2 transition-all duration-200 hover:scale-105"
            title={`Select all ${category.name} TLDs`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onCategoryDeselectAll(category);
            }}
            disabled={selectionState.isNoneSelected}
            className="text-xs h-6 px-2 transition-all duration-200 hover:scale-105"
            title={`Deselect all ${category.name} TLDs`}
          >
            None
          </Button>
        </div>
      </div>

      {/* Category Content with lazy loading and smooth animations */}
      <div
        id={`category-content-${category.id}`}
        className={cn(
          'transition-all duration-300 ease-in-out',
          shouldExpand ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
        aria-hidden={!shouldExpand}
      >
        {/* Only render TLD grid when category is expanded (lazy loading) */}
        {shouldExpand && (
          <div className="pt-1">
            <VirtualTldGrid
              tlds={category.tlds}
              selectedTlds={selectedTlds}
              getTldHighlightState={getTldHighlightState}
              onToggle={onTldToggle}
              containerHeight={category.tlds.length > 50 ? 400 : undefined}
              itemHeight={48}
              columnsPerRow={3}
              onBulkSelect={onBulkSelect}
              categoryId={category.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
