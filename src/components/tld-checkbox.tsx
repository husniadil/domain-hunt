'use client';

import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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
    const checkboxId = `tld-${tld.extension.replace('.', '-')}`;

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
      <div
        className={cn(
          'flex items-center space-x-3 rounded-md transition-all duration-200 ease-in-out',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'hover:bg-muted/30 p-2 -m-2',
          // Enhanced animation on selection
          isSelected && 'bg-primary/5 dark:bg-primary/10',
          // Smooth highlight animation
          isHighlighted && 'bg-yellow-100/80 dark:bg-yellow-900/40'
        )}
        data-index={dataIndex}
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
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer py-1 text-left transition-all duration-200',
            'hover:text-primary select-none',
            isHighlighted && 'font-semibold'
          )}
          title={`${tld.extension} - ${tld.name}`}
        >
          <span className="inline-flex items-center gap-1">
            {tld.extension}
            {tld.popular && (
              <span
                className="text-xs text-primary opacity-75"
                aria-label="Popular TLD"
              >
                ⭐
              </span>
            )}
          </span>
        </label>

        {/* Hidden description for screen readers */}
        <span id={`${checkboxId}-description`} className="sr-only">
          {tld.name} TLD - {isSelected ? 'Selected' : 'Not selected'}
          {tld.popular && ' - Popular choice'}
        </span>
      </div>
    );
  }
);

TldCheckbox.displayName = 'TldCheckbox';

export { TldCheckbox };
