'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TLD, TLDConfig } from '@/types/tld';
import tldData from '../../data/tlds.json';

interface TldSelectorProps {
  onTldsChange?: (tlds: string[]) => void;
  className?: string;
  initialTlds?: string[];
}

// Default TLD list used as fallback when JSON data is invalid
const DEFAULT_TLDS: TLD[] = [
  { extension: '.com', name: 'Commercial', popular: true },
  { extension: '.net', name: 'Network', popular: true },
  { extension: '.org', name: 'Organization', popular: true },
];

/**
 * Validates and extracts TLD data from unknown input.
 *
 * @param data - Unknown data that should conform to TLDConfig structure
 * @returns Array of valid TLD objects. Returns DEFAULT_TLDS if input is invalid.
 *
 * This function performs runtime validation to ensure the data matches the expected
 * TLDConfig structure with valid TLD entries. If validation fails at any level,
 * it falls back to a predefined set of default TLDs to ensure the component
 * always has usable data.
 */
const validateTldData = (data: unknown): TLD[] => {
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray((data as TLDConfig).tlds)
  ) {
    console.warn('Invalid TLD data structure, falling back to default TLDs');
    return DEFAULT_TLDS;
  }

  return (data as TLDConfig).tlds.filter(
    (tld: unknown): tld is TLD =>
      typeof tld === 'object' &&
      tld !== null &&
      typeof (tld as TLD).extension === 'string' &&
      typeof (tld as TLD).name === 'string' &&
      typeof (tld as TLD).popular === 'boolean'
  );
};

const TLDS: TLD[] = validateTldData(tldData as TLDConfig);
const TLD_EXTENSIONS = TLDS.map(tld => tld.extension);

export function TldSelector({
  onTldsChange,
  className,
  initialTlds = [],
}: TldSelectorProps) {
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);

  // Set initial TLDs on mount
  useEffect(() => {
    if (initialTlds.length > 0) {
      setSelectedTlds(initialTlds);
      onTldsChange?.(initialTlds);
    }
  }, [initialTlds, onTldsChange]);

  const handleTldToggle = (tld: string, checked: boolean) => {
    const newSelectedTlds = checked
      ? [...selectedTlds, tld]
      : selectedTlds.filter(t => t !== tld);

    setSelectedTlds(newSelectedTlds);
    onTldsChange?.(newSelectedTlds);
  };

  const handleSelectAll = () => {
    setSelectedTlds([...TLD_EXTENSIONS]);
    onTldsChange?.(TLD_EXTENSIONS);
  };

  const handleDeselectAll = () => {
    setSelectedTlds([]);
    onTldsChange?.([]);
  };

  const allSelected = selectedTlds.length === TLD_EXTENSIONS.length;
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
        {TLDS.map(tld => (
          <div key={tld.extension} className="flex items-center space-x-2">
            <Checkbox
              id={`tld-${tld.extension.replace('.', '-')}`}
              checked={selectedTlds.includes(tld.extension)}
              onCheckedChange={checked =>
                handleTldToggle(tld.extension, !!checked)
              }
            />
            <label
              htmlFor={`tld-${tld.extension.replace('.', '-')}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              title={tld.name}
            >
              {tld.extension}
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
