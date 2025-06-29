'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TldSelectorProps {
  onTldsChange?: (tlds: string[]) => void;
  className?: string;
}

const STATIC_TLDS = ['.com', '.net', '.org'];

export function TldSelector({ onTldsChange, className }: TldSelectorProps) {
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);

  const handleTldToggle = (tld: string, checked: boolean) => {
    const newSelectedTlds = checked
      ? [...selectedTlds, tld]
      : selectedTlds.filter(t => t !== tld);

    setSelectedTlds(newSelectedTlds);
    onTldsChange?.(newSelectedTlds);
  };

  const handleSelectAll = () => {
    setSelectedTlds([...STATIC_TLDS]);
    onTldsChange?.(STATIC_TLDS);
  };

  const handleDeselectAll = () => {
    setSelectedTlds([]);
    onTldsChange?.([]);
  };

  const allSelected = selectedTlds.length === STATIC_TLDS.length;
  const noneSelected = selectedTlds.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Select TLD Extensions</h3>
          {selectedTlds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({selectedTlds.length} selected)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={noneSelected}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-3">
        {STATIC_TLDS.map(tld => (
          <div key={tld} className="flex items-center space-x-2">
            <Checkbox
              id={`tld-${tld}`}
              checked={selectedTlds.includes(tld)}
              onCheckedChange={checked => handleTldToggle(tld, !!checked)}
            />
            <label
              htmlFor={`tld-${tld}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {tld}
            </label>
          </div>
        ))}
      </div>

      {selectedTlds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected extensions: {selectedTlds.join(', ')}
        </div>
      )}
    </div>
  );
}
