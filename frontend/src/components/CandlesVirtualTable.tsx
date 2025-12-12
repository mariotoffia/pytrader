import type { RefObject } from 'react';
import { OHLCVCandle } from '../types';
import { VirtualizedList, VirtualizedListScrollInfo } from './VirtualizedList';

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

interface CandlesVirtualTableProps {
  candles: OHLCVCandle[];
  height: number;
  rowHeight: number;
  statsLoading: boolean;
  loadingInitial: boolean;
  containerRef: RefObject<HTMLDivElement>;
  onScroll: (info: VirtualizedListScrollInfo) => void;
}

export function CandlesVirtualTable({
  candles,
  height,
  rowHeight,
  statsLoading,
  loadingInitial,
  containerRef,
  onScroll,
}: CandlesVirtualTableProps) {
  return (
    <div
      style={{
        background: '#1e222d',
        borderRadius: '4px',
        border: '1px solid #2b2b43',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px repeat(5, 1fr)',
          gap: '12px',
          padding: '10px 16px',
          background: '#131722',
          borderBottom: '1px solid #2b2b43',
          color: '#787b86',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <div>Timestamp</div>
        <div style={{ textAlign: 'right' }}>Open</div>
        <div style={{ textAlign: 'right' }}>High</div>
        <div style={{ textAlign: 'right' }}>Low</div>
        <div style={{ textAlign: 'right' }}>Close</div>
        <div style={{ textAlign: 'right' }}>Volume</div>
      </div>

      {candles.length === 0 && !loadingInitial ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#787b86', fontSize: '14px' }}>
          {statsLoading ? 'Loading stats…' : 'No candles loaded. Select filters and click Load.'}
        </div>
      ) : (
        <VirtualizedList
          height={height}
          rowHeight={rowHeight}
          rowCount={candles.length}
          containerRef={containerRef}
          onScroll={onScroll}
          renderRow={(index, style) => {
            const candle = candles[index];
            const isEven = index % 2 === 0;

            return (
              <div
                key={candle.timestamp}
                style={{
                  ...style,
                  display: 'grid',
                  gridTemplateColumns: '220px repeat(5, 1fr)',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '0 16px',
                  color: '#d1d4dc',
                  fontSize: '12px',
                  background: isEven ? '#1e222d' : '#151a28',
                  borderBottom: '1px solid #2b2b43',
                }}
              >
                <div style={{ color: '#787b86' }}>{formatTimestamp(candle.timestamp)}</div>
                <div style={{ textAlign: 'right' }}>{formatNumber(candle.open)}</div>
                <div style={{ textAlign: 'right' }}>{formatNumber(candle.high)}</div>
                <div style={{ textAlign: 'right' }}>{formatNumber(candle.low)}</div>
                <div style={{ textAlign: 'right' }}>{formatNumber(candle.close)}</div>
                <div style={{ textAlign: 'right' }}>{formatNumber(candle.volume)}</div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

