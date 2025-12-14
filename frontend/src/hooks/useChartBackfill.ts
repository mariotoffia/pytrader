/**
 * Hook for managing automatic backfill when scrolling charts
 */

import { useRef, useState } from 'react';
import { useBackfill } from './useBackfill';
import { DataProvider, Interval } from '../types';

export interface UseChartBackfillOptions {
  gatewayUrl: string;
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  earliestCandleTimestamp: number | null;
  onBackfillComplete?: () => void;
}

export interface UseChartBackfillResult {
  handleVisibleRangeChange: (visibleFrom: number) => Promise<void>;
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
  earliestCandleTimestamp,
  onBackfillComplete,
}: UseChartBackfillOptions): UseChartBackfillResult {
  const { triggerBackfill, loading: backfilling } = useBackfill({ gatewayUrl });
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const lastBackfillRef = useRef<number>(0);

  const handleVisibleRangeChange = async (visibleFrom: number) => {
    // Check if we need to backfill data
    if (earliestCandleTimestamp && !backfilling) {
      // If user scrolled before the earliest candle and enough time has passed since last backfill
      const now = Date.now();
      const timeSinceLastBackfill = now - lastBackfillRef.current;

      if (visibleFrom < earliestCandleTimestamp && timeSinceLastBackfill > 2000) {
        lastBackfillRef.current = now;
        setBackfillMessage('Loading historical data...');

        // Calculate backfill range (go back 24 hours from earliest candle)
        const to = earliestCandleTimestamp;
        const from = earliestCandleTimestamp - 24 * 60 * 60 * 1000;

        const result = await triggerBackfill(provider, symbol, interval, from, to);

        if (result && result.success) {
          setBackfillMessage(
            `Loaded ${result.candlesInserted} candles (${new Date(result.timeRange.from).toLocaleString()} - ${new Date(result.timeRange.to).toLocaleString()})`
          );
          setTimeout(() => setBackfillMessage(null), 3000);

          // Notify parent to refetch candles
          if (onBackfillComplete) {
            onBackfillComplete();
          }
        } else {
          setBackfillMessage('Failed to load historical data');
          setTimeout(() => setBackfillMessage(null), 3000);
        }
      }
    }
  };

  return {
    handleVisibleRangeChange,
    backfilling,
    backfillMessage,
  };
}
