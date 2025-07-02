'use client';

import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TldCheckbox } from '@/components/tld-checkbox';
import { TLD } from '@/types/tld';

interface VirtualTldGridProps {
  tlds: TLD[];
  selectedTlds: string[];
  getTldHighlightState: (tld: TLD) => boolean;
  onToggle: (extension: string, checked: boolean) => void;
  containerHeight?: number;
  itemHeight?: number;
  columnsPerRow?: number;
}

// Virtual scrolling threshold - only use virtual scrolling for lists > 50 items
const VIRTUAL_SCROLL_THRESHOLD = 50;

/**
 * Virtual scrolling TLD grid component for large category lists
 * Provides optimal performance for categories with >50 TLDs
 */
export function VirtualTldGrid({
  tlds,
  selectedTlds,
  getTldHighlightState,
  onToggle,
  containerHeight = 400,
  itemHeight = 40,
  columnsPerRow = 3,
}: VirtualTldGridProps) {
  // Check if virtual scrolling is needed
  const shouldUseVirtualScrolling = tlds.length > VIRTUAL_SCROLL_THRESHOLD;

  // Group TLDs into rows for virtual scrolling
  const rowData = useMemo(() => {
    const rows: TLD[][] = [];
    for (let i = 0; i < tlds.length; i += columnsPerRow) {
      rows.push(tlds.slice(i, i + columnsPerRow));
    }
    return rows;
  }, [tlds, columnsPerRow]);

  // If below threshold, render normal grid
  if (!shouldUseVirtualScrolling) {
    return (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
        }}
      >
        {tlds.map(tld => (
          <TldCheckbox
            key={tld.extension}
            tld={tld}
            isSelected={selectedTlds.includes(tld.extension)}
            isHighlighted={getTldHighlightState(tld)}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  }

  // Create container ref for virtual scrolling
  return (
    <VirtualizedTldGrid
      rowData={rowData}
      selectedTlds={selectedTlds}
      getTldHighlightState={getTldHighlightState}
      onToggle={onToggle}
      containerHeight={containerHeight}
      itemHeight={itemHeight}
      columnsPerRow={columnsPerRow}
    />
  );
}

/**
 * Internal virtualized grid component
 */
function VirtualizedTldGrid({
  rowData,
  selectedTlds,
  getTldHighlightState,
  onToggle,
  containerHeight,
  itemHeight,
  columnsPerRow,
}: {
  rowData: TLD[][];
  selectedTlds: string[];
  getTldHighlightState: (tld: TLD) => boolean;
  onToggle: (extension: string, checked: boolean) => void;
  containerHeight: number;
  itemHeight: number;
  columnsPerRow: number;
}) {
  // Create virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
  });

  // Parent ref for scroll container
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      className="border rounded-md overflow-auto"
      style={{
        height: `${containerHeight}px`,
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const row = rowData[virtualItem.index];
          if (!row) return null;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-4"
            >
              <div
                className="grid gap-4 h-full items-center"
                style={{
                  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                }}
              >
                {row.map(tld => (
                  <TldCheckbox
                    key={tld.extension}
                    tld={tld}
                    isSelected={selectedTlds.includes(tld.extension)}
                    isHighlighted={getTldHighlightState(tld)}
                    onToggle={onToggle}
                  />
                ))}
                {/* Fill empty cells in incomplete rows */}
                {Array.from({ length: columnsPerRow - row.length }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
