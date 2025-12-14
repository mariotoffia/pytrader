/**
 * Hook for triggering manual backfill operations
 */

import { useState, useCallback } from 'react';
import { BackfillRequest, BackfillResponse, DataProvider, Interval } from '@pytrader/shared/types';

export interface UseBackfillOptions {
  gatewayUrl: string;
}

export interface UseBackfillResult {
  triggerBackfill: (
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ) => Promise<BackfillResponse | null>;
  triggerBackfillByHours: (
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    hours: number
  ) => Promise<BackfillResponse | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for triggering manual backfill of historical candle data
 *
 * @param options - Configuration options
 * @param options.gatewayUrl - Base URL of the gateway service
 * @returns Functions to trigger backfill, loading state, and error state
 *
 * @example
 * const { triggerBackfill, loading, error } = useBackfill({
 *   gatewayUrl: 'http://localhost:4000',
 * });
 *
 * // Trigger backfill for specific time range
 * const result = await triggerBackfill('binance', 'BTC/USDT', '1m', fromTimestamp, toTimestamp);
 */
export function useBackfill({ gatewayUrl }: UseBackfillOptions): UseBackfillResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const triggerBackfill = useCallback(
    async (
      provider: DataProvider,
      symbol: string,
      interval: Interval,
      from: number,
      to: number
    ): Promise<BackfillResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const request: BackfillRequest = {
          provider,
          symbol,
          interval,
          from,
          to,
        };

        const response = await fetch(`${gatewayUrl}/market-data/backfill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Backfill failed: ${response.statusText}`);
        }

        const result = (await response.json()) as BackfillResponse;

        console.log(
          `[useBackfill] Backfill completed: ${result.candlesInserted} candles inserted ` +
            `(${result.candlesFetched} fetched) in ${result.duration}ms`
        );

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useBackfill] Error during backfill:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [gatewayUrl]
  );

  const triggerBackfillByHours = useCallback(
    async (
      provider: DataProvider,
      symbol: string,
      interval: Interval,
      hours: number
    ): Promise<BackfillResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const request: BackfillRequest = {
          provider,
          symbol,
          interval,
          hours,
        };

        const response = await fetch(`${gatewayUrl}/market-data/backfill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Backfill failed: ${response.statusText}`);
        }

        const result = (await response.json()) as BackfillResponse;

        console.log(
          `[useBackfill] Backfill completed: ${result.candlesInserted} candles inserted ` +
            `(${result.candlesFetched} fetched) in ${result.duration}ms`
        );

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useBackfill] Error during backfill:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [gatewayUrl]
  );

  return {
    triggerBackfill,
    triggerBackfillByHours,
    loading,
    error,
  };
}
