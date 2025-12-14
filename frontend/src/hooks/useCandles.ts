import { useState, useEffect, useCallback } from 'react';
import { OHLCVCandle, Interval, CandleUpdateMessage, DataProvider } from '../types';
import { useWebSocket } from './useWebSocket';
import { debugLog } from '../utils/debug';
import { fetchJson, HttpError } from '../utils/http';

interface UseCandlesOptions {
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  gatewayUrl: string;
  wsUrl: string;
}

export function useCandles({ provider, symbol, interval, gatewayUrl, wsUrl }: UseCandlesOptions) {
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      if (message.type === 'candle_update') {
        const candleMessage = message as CandleUpdateMessage;
        const newCandle = candleMessage.payload;

        // Only process candles for our current symbol/interval
        if (newCandle.symbol === symbol && newCandle.interval === interval) {
          setCandles((prev) => {
            // Check if candle already exists (update) or is new (append)
            const existingIndex = prev.findIndex((c) => c.timestamp === newCandle.timestamp);

            if (existingIndex >= 0) {
              // Update existing candle
              const updated = [...prev];
              updated[existingIndex] = newCandle;
              return updated;
            } else {
              // Append new candle and keep sorted
              return [...prev, newCandle].sort((a, b) => a.timestamp - b.timestamp);
            }
          });
        }
      }
    },
    [symbol, interval]
  );

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    debugLabel: 'candles',
  });

  // Fetch historical candles
  const fetchHistoricalCandles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const params = new URLSearchParams({
        provider,
        symbol,
        interval,
        from: oneDayAgo.toString(),
        to: now.toString(),
      });

      const url = `${gatewayUrl}/candles?${params}`;
      debugLog('candles', 'fetch historical', { provider, symbol, interval, url });

      const { data, requestId } = await fetchJson<{ candles: OHLCVCandle[] }>(
        url,
        { method: 'GET' },
        { scope: 'candles', requestName: 'candles' }
      );

      debugLog('candles', 'fetched historical', { requestId, count: data.candles?.length ?? 0 });
      setCandles(data.candles || []);
    } catch (err) {
      if (err instanceof HttpError) {
        debugLog('candles', 'fetch error', err.details);
        const message = `Failed to fetch candles: ${err.details.status ?? ''} ${err.details.statusText ?? ''} (requestId: ${err.details.requestId})`;
        setError(message);
        console.error('Error fetching candles:', err.details);
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to fetch candles';
      setError(message);
      console.error('Error fetching candles:', err);
    } finally {
      setLoading(false);
    }
  }, [provider, symbol, interval, gatewayUrl]);

  // Fetch historical data on mount and when symbol/interval changes
  useEffect(() => {
    fetchHistoricalCandles();
  }, [fetchHistoricalCandles]);

  // Subscribe to real-time updates when connected
  useEffect(() => {
    if (isConnected) {
      subscribe(symbol, interval);
      return () => {
        unsubscribe(symbol, interval);
      };
    }
  }, [isConnected, symbol, interval, subscribe, unsubscribe]);

  return {
    candles,
    loading,
    error,
    isConnected,
    refetch: fetchHistoricalCandles,
  };
}
