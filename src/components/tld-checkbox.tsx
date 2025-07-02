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
}

// Memoized TLD checkbox component for optimal rendering performance
const TldCheckbox = memo<TldCheckboxProps>(
  ({ tld, isSelected, isHighlighted, onToggle }) => {
    const checkboxId = `tld-${tld.extension.replace('.', '-')}`;

    return (
      <div className="flex items-center space-x-3">
        <Checkbox
          id={checkboxId}
          checked={isSelected}
          onCheckedChange={checked => onToggle(tld.extension, !!checked)}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer py-1 text-left',
            isHighlighted &&
              'bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded'
          )}
          title={tld.name}
        >
          {tld.extension}
        </label>
      </div>
    );
  }
);

TldCheckbox.displayName = 'TldCheckbox';

export { TldCheckbox };
