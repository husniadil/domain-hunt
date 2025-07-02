'use client';

import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { StarIcon } from '@/components/ui/star-icon';
import { cn } from '@/lib/utils';
import { TLD } from '@/types/tld';

interface TldCheckboxProps {
  tld: TLD;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggle: (extension: string, checked: boolean) => void;
  // Enhanced keyboard navigation props
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent, extension: string) => void;
  'data-index'?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
}

// Memoized TLD checkbox component for optimal rendering performance with enhanced accessibility
const TldCheckbox = memo<TldCheckboxProps>(
  ({
    tld,
    isSelected,
    isHighlighted,
    onToggle,
    tabIndex = -1,
    onKeyDown,
    'data-index': dataIndex,
    'aria-setsize': ariaSetsize,
    'aria-posinset': ariaPosinset,
  }) => {
    const checkboxId = `tld-${tld.extension.replace('.', '-')}-${dataIndex}`;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle keyboard navigation
      if (onKeyDown) {
        onKeyDown(e, tld.extension);
      }

      // Space key to toggle checkbox
      if (e.key === ' ') {
        e.preventDefault();
        onToggle(tld.extension, !isSelected);
      }
    };

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex items-center space-x-3 rounded-md transition-all duration-200 ease-in-out cursor-pointer',
          'focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1',
          'hover:bg-muted/30 p-2 -m-2',
          // Enhanced animation on selection
          isSelected && 'bg-primary/5 dark:bg-primary/10'
          // Note: Removed background highlight, keeping bold text styling for search matches
        )}
        data-index={dataIndex}
        title={`${tld.extension} - ${tld.name}`}
      >
        <Checkbox
          id={checkboxId}
          checked={isSelected}
          onCheckedChange={checked => onToggle(tld.extension, !!checked)}
          tabIndex={tabIndex}
          onKeyDown={handleKeyDown}
          aria-describedby={`${checkboxId}-description`}
          aria-setsize={ariaSetsize}
          aria-posinset={ariaPosinset}
          className="transition-all duration-200 hover:scale-105"
        />
        <span
          className={cn(
            'text-sm font-medium leading-none py-1 text-left transition-all duration-200 flex-1',
            'hover:text-primary select-none',
            isHighlighted && 'font-semibold'
          )}
        >
          <span className="inline-flex items-center gap-1">
            {tld.extension}
            {tld.popular && (
              <span
                className="text-xs text-primary opacity-90"
                aria-label="Popular TLD"
              >
                <StarIcon />
              </span>
            )}
          </span>
        </span>

        {/* Hidden description for screen readers */}
        <span id={`${checkboxId}-description`} className="sr-only">
          {tld.name} TLD - {isSelected ? 'Selected' : 'Not selected'}
          {tld.popular && ' - Popular choice'}
        </span>
      </label>
    );
  }
);

TldCheckbox.displayName = 'TldCheckbox';

export { TldCheckbox };
