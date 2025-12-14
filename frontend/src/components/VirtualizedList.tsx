import { useMemo, useState, useCallback } from 'react';
import type { CSSProperties, ReactNode, UIEvent, RefObject } from 'react';

export interface VirtualizedListScrollInfo {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

interface VirtualizedListProps {
  height: number;
  rowHeight: number;
  rowCount: number;
  overscan?: number;
  containerRef?: RefObject<HTMLDivElement>;
  onScroll?: (info: VirtualizedListScrollInfo) => void;
  renderRow: (index: number, style: CSSProperties) => ReactNode;
}

export function VirtualizedList({
  height,
  rowHeight,
  rowCount,
  overscan = 8,
  containerRef,
  onScroll,
  renderRow,
}: VirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = rowCount * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(rowCount - 1, Math.floor((scrollTop + height) / rowHeight) + overscan);

  const indices = useMemo(() => {
    if (rowCount === 0) return [];
    const items: number[] = [];
    for (let i = startIndex; i <= endIndex; i++) items.push(i);
    return items;
  }, [rowCount, startIndex, endIndex]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const nextScrollTop = e.currentTarget.scrollTop;
      setScrollTop(nextScrollTop);

      onScroll?.({
        scrollTop: nextScrollTop,
        scrollHeight: e.currentTarget.scrollHeight,
        clientHeight: e.currentTarget.clientHeight,
      });
    },
    [onScroll]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {indices.map((index) =>
          renderRow(index, {
            position: 'absolute',
            top: index * rowHeight,
            height: rowHeight,
            left: 0,
            right: 0,
          })
        )}
      </div>
    </div>
  );
}
