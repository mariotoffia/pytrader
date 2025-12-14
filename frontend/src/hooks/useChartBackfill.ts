/**
 * Hook for managing automatic backfill when scrolling charts
 */

import { useRef, useState } from 'react';
import { useBackfill } from './useBackfill';
import { DataProvider, Interval, OHLCVCandle } from '../types';
import { intervalToMs } from '../utils/interval';

export interface UseChartBackfillOptions {
  gatewayUrl: string;
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  candles: OHLCVCandle[];
  onBackfillComplete?: () => void;
}

export interface UseChartBackfillResult {
  handleVisibleRangeChange: (visibleFromMs: number, visibleToMs: number) => Promise<void>;
  backfilling: boolean;
  backfillMessage: string | null;
}

/**
 * Manages automatic backfill when user scrolls to missing data
 */
export function useChartBackfill({
  gatewayUrl,
  provider,
  symbol,
  interval,
  candles,
  onBackfillComplete,
}: UseChartBackfillOptions): UseChartBackfillResult {
  const { triggerBackfill, loading: backfilling } = useBackfill({ gatewayUrl });
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const lastBackfillRef = useRef<number>(0);

  const handleVisibleRangeChange = async (visibleFromMs: number, visibleToMs: number) => {
    if (backfilling) return;
    if (!Number.isFinite(visibleFromMs) || !Number.isFinite(visibleToMs)) return;
    if (visibleToMs <= visibleFromMs) return;

    const now = Date.now();
    const timeSinceLastBackfill = now - lastBackfillRef.current;
    if (timeSinceLastBackfill <= 1500) return;

    const intervalMs = intervalToMs(interval);
    const leftBufferMs = intervalMs * 200;
    const rightBufferMs = intervalMs * 5;
    const desiredFrom = Math.max(0, visibleFromMs - leftBufferMs);
    let desiredTo = Math.min(now, visibleToMs + rightBufferMs);

    const earliest = candles.length > 0 ? candles[0].timestamp : null;
    const latest = candles.length > 0 ? candles[candles.length - 1].timestamp : null;

    // If the user is at/near the end of the currently loaded data and we're behind "now",
    // forward-fill up to now so the chart can seamlessly go forward and then receive live updates.
    if (latest && now - latest > intervalMs * 2 && visibleToMs >= latest - intervalMs * 5) {
      desiredTo = now;
    }

    let from: number | null = null;
    let to: number | null = null;

    if (!earliest || !latest) {
      from = desiredFrom;
      to = desiredTo;
    } else if (desiredFrom < earliest - intervalMs) {
      from = desiredFrom;
      to = earliest;
    } else if (desiredTo > latest + intervalMs) {
      from = latest;
      to = desiredTo;
    } else {
      // Look for gaps inside the desired range (single gap per invocation to avoid spamming)
      const startIndex = Math.max(0, candles.findIndex((c) => c.timestamp >= desiredFrom));
      if (startIndex >= 0) {
        let prevTs: number | null = null;
        for (let i = startIndex; i < candles.length; i++) {
          const ts = candles[i].timestamp;
          if (ts > desiredTo) break;
          if (prevTs != null) {
            const gap = ts - prevTs;
            if (gap > intervalMs * 2) {
              from = prevTs;
              to = ts;
              break;
            }
          }
          prevTs = ts;
        }
      }
    }

    if (from == null || to == null) return;
    if (to - from < intervalMs) return;

    lastBackfillRef.current = now;
    setBackfillMessage('Loading candles...');

    const result = await triggerBackfill(provider, symbol, interval, from, to);
    if (result && result.success) {
      setBackfillMessage(
        `Loaded ${result.candlesInserted} candles (${new Date(result.timeRange.from).toLocaleString()} - ${new Date(result.timeRange.to).toLocaleString()})`
      );
      setTimeout(() => setBackfillMessage(null), 3000);
      onBackfillComplete?.();
      return;
    }

    setBackfillMessage('Failed to load candles');
    setTimeout(() => setBackfillMessage(null), 3000);
  };

  return {
    handleVisibleRangeChange,
    backfilling,
    backfillMessage,
  };
}
