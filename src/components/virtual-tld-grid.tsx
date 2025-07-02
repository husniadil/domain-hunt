'use client';

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
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
  // Enhanced keyboard navigation props
  onBulkSelect?: (extensions: string[]) => void;
  categoryId?: string;
}

// Virtual scrolling threshold - only use virtual scrolling for lists > 50 items
const VIRTUAL_SCROLL_THRESHOLD = 50;

// Shared screen reader help text component
function ScreenReaderHelp({
  categoryId,
  isVirtual = false,
}: {
  categoryId: string;
  isVirtual?: boolean;
}) {
  return (
    <div
      id={`${categoryId}-${isVirtual ? 'virtual-' : ''}help`}
      className="sr-only"
    >
      {isVirtual ? 'Virtual scrolling grid. ' : ''}
      Use arrow keys to navigate, Space to select, Ctrl+A to select all, Escape
      to return to category controls, Shift+Tab for reverse navigation
    </div>
  );
}

/**
 * Virtual scrolling TLD grid component with enhanced keyboard navigation
 * Provides optimal performance for categories with >50 TLDs and full accessibility
 */
export function VirtualTldGrid({
  tlds,
  selectedTlds,
  getTldHighlightState,
  onToggle,
  containerHeight = 400,
  itemHeight = 40,
  columnsPerRow = 3,
  onBulkSelect,
  categoryId = 'default',
}: VirtualTldGridProps) {
  // Check if virtual scrolling is needed
  const shouldUseVirtualScrolling = tlds.length > VIRTUAL_SCROLL_THRESHOLD;

  // Enhanced keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Cache element references for performance
  const checkboxRefsMap = useRef<Map<string, HTMLElement | null>>(new Map());

  // Group TLDs into rows for virtual scrolling
  const rowData = useMemo(() => {
    const rows: TLD[][] = [];
    for (let i = 0; i < tlds.length; i += columnsPerRow) {
      rows.push(tlds.slice(i, i + columnsPerRow));
    }
    return rows;
  }, [tlds, columnsPerRow]);

  // Enhanced keyboard navigation handler with optimized performance
  const handleKeyDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e: React.KeyboardEvent, _extension: string) => {
      // Performance optimization: use data-index attribute from closest parent with data-index
      const targetElement = e.currentTarget as HTMLElement;
      const wrapperElement = targetElement.closest(
        '[data-index]'
      ) as HTMLElement;
      const currentIndexStr = wrapperElement?.getAttribute('data-index');
      const currentIndex = currentIndexStr ? parseInt(currentIndexStr, 10) : -1;

      if (currentIndex === -1 || currentIndex >= tlds.length) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(currentIndex + 1, tlds.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(currentIndex + columnsPerRow, tlds.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(currentIndex - columnsPerRow, 0);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tlds.length - 1;
          break;
        // Enhanced bulk selection with keyboard
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onBulkSelect?.(tlds.map(tld => tld.extension));
            return;
          }
          break;
        // Escape to clear focus
        case 'Escape':
          e.preventDefault();
          if (gridRef.current) {
            gridRef.current.focus();
          }
          return;
        case 'Tab':
          // Handle Shift+Tab for reverse navigation
          if (e.shiftKey) {
            e.preventDefault();
            if (currentIndex === 0) {
              // Focus back to grid container
              if (gridRef.current) {
                gridRef.current.focus();
              }
            } else {
              newIndex = Math.max(currentIndex - 1, 0);
            }
          } else {
            // Regular Tab - let it bubble up
            return;
          }
          break;
      }

      if (newIndex !== currentIndex) {
        setFocusedIndex(newIndex);

        // Auto-focus the new checkbox using cached refs
        const newTld = tlds[newIndex];
        if (newTld) {
          const checkboxId = `tld-${newTld.extension.replace('.', '-')}`;
          let checkboxElement = checkboxRefsMap.current.get(checkboxId);

          // Fallback to DOM query if not cached
          if (!checkboxElement) {
            checkboxElement = document.getElementById(checkboxId);
            checkboxRefsMap.current.set(checkboxId, checkboxElement);
          }

          if (checkboxElement) {
            checkboxElement.focus();
          }
        }
      }
    },
    [tlds, columnsPerRow, onBulkSelect]
  );

  // Focus management effect with cached refs
  useEffect(() => {
    const focusedTld = tlds[focusedIndex];
    if (focusedTld) {
      const checkboxId = `tld-${focusedTld.extension.replace('.', '-')}`;
      let checkboxElement = checkboxRefsMap.current.get(checkboxId);

      // Fallback to DOM query if not cached
      if (!checkboxElement) {
        checkboxElement = document.getElementById(checkboxId);
        checkboxRefsMap.current.set(checkboxId, checkboxElement);
      }

      // Only focus if current focus is not on a search input to prevent focus jumping
      const activeElement = document.activeElement;
      const isSearchInputFocused =
        activeElement &&
        ((activeElement.tagName === 'INPUT' &&
          activeElement.getAttribute('type') === 'text') ||
          activeElement.getAttribute('role') === 'searchbox');

      if (
        checkboxElement &&
        document.activeElement !== checkboxElement &&
        !isSearchInputFocused
      ) {
        checkboxElement.focus();
      }
    }
  }, [focusedIndex, tlds]);

  // If below threshold, render enhanced normal grid with keyboard navigation
  if (!shouldUseVirtualScrolling) {
    return (
      <div
        ref={gridRef}
        role="grid"
        aria-label={`TLD selection grid for ${categoryId} category`}
        aria-describedby={`${categoryId}-help`}
        className="grid gap-4 focus:outline-none rounded-md p-1"
        style={{
          gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
        }}
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Tab' && !e.shiftKey) {
            // Focus first checkbox on Tab
            const firstTld = tlds[0];
            if (firstTld) {
              e.preventDefault();
              const checkboxId = `tld-${firstTld.extension.replace('.', '-')}`;
              let firstCheckbox = checkboxRefsMap.current.get(checkboxId);

              if (!firstCheckbox) {
                firstCheckbox = document.getElementById(checkboxId);
                checkboxRefsMap.current.set(checkboxId, firstCheckbox);
              }

              if (firstCheckbox) {
                firstCheckbox.focus();
                setFocusedIndex(0);
              }
            }
          }
        }}
      >
        {tlds.map((tld, index) => (
          <div key={tld.extension} role="gridcell">
            <TldCheckbox
              tld={tld}
              isSelected={selectedTlds.includes(tld.extension)}
              isHighlighted={getTldHighlightState(tld)}
              onToggle={onToggle}
              tabIndex={index === focusedIndex ? 0 : -1}
              onKeyDown={handleKeyDown}
              data-index={index}
              aria-setsize={tlds.length}
              aria-posinset={index + 1}
            />
          </div>
        ))}

        <ScreenReaderHelp categoryId={categoryId} />
      </div>
    );
  }

  // Create container ref for virtual scrolling with enhanced accessibility
  return (
    <VirtualizedTldGrid
      rowData={rowData}
      selectedTlds={selectedTlds}
      getTldHighlightState={getTldHighlightState}
      onToggle={onToggle}
      containerHeight={containerHeight}
      itemHeight={itemHeight}
      columnsPerRow={columnsPerRow}
      focusedIndex={focusedIndex}
      handleKeyDown={handleKeyDown}
      categoryId={categoryId}
      tlds={tlds}
    />
  );
}

/**
 * Internal virtualized grid component with enhanced accessibility
 */
function VirtualizedTldGrid({
  rowData,
  selectedTlds,
  getTldHighlightState,
  onToggle,
  containerHeight,
  itemHeight,
  columnsPerRow,
  focusedIndex,
  handleKeyDown,
  categoryId,
  tlds,
}: {
  rowData: TLD[][];
  selectedTlds: string[];
  getTldHighlightState: (tld: TLD) => boolean;
  onToggle: (extension: string, checked: boolean) => void;
  containerHeight: number;
  itemHeight: number;
  columnsPerRow: number;
  focusedIndex: number;
  handleKeyDown: (e: React.KeyboardEvent, extension: string) => void;
  categoryId: string;
  tlds: TLD[];
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
      role="grid"
      aria-label={`Virtual TLD selection grid for ${categoryId} category`}
      aria-describedby={`${categoryId}-virtual-help`}
      className="border rounded-md overflow-auto focus:outline-none"
      style={{
        height: `${containerHeight}px`,
      }}
      tabIndex={-1}
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

          const startIndex = virtualItem.index * columnsPerRow;

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
              role="row"
            >
              <div
                className="grid gap-4 h-full items-center"
                style={{
                  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                }}
              >
                {row.map((tld, colIndex) => {
                  const index = startIndex + colIndex;
                  return (
                    <div key={tld.extension} role="gridcell">
                      <TldCheckbox
                        tld={tld}
                        isSelected={selectedTlds.includes(tld.extension)}
                        isHighlighted={getTldHighlightState(tld)}
                        onToggle={onToggle}
                        tabIndex={index === focusedIndex ? 0 : -1}
                        onKeyDown={handleKeyDown}
                        data-index={index}
                        aria-setsize={tlds.length}
                        aria-posinset={index + 1}
                      />
                    </div>
                  );
                })}
                {/* Fill empty cells in incomplete rows */}
                {Array.from({ length: columnsPerRow - row.length }).map(
                  (_, i) => (
                    <div
                      key={`empty-${i}`}
                      role="gridcell"
                      aria-hidden="true"
                    />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ScreenReaderHelp categoryId={categoryId} isVirtual />
    </div>
  );
}
