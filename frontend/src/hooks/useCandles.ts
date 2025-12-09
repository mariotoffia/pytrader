import { useState, useEffect, useCallback } from 'react';
import { OHLCVCandle, Interval, CandleUpdateMessage } from '../types';
import { useWebSocket } from './useWebSocket';

interface UseCandlesOptions {
  symbol: string;
  interval: Interval;
  gatewayUrl: string;
  wsUrl: string;
}

export function useCandles({ symbol, interval, gatewayUrl, wsUrl }: UseCandlesOptions) {
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
  });

  // Fetch historical candles
  const fetchHistoricalCandles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const params = new URLSearchParams({
        symbol,
        interval,
        from: oneDayAgo.toString(),
        to: now.toString(),
      });

      const response = await fetch(`${gatewayUrl}/candles?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch candles: ${response.statusText}`);
      }

      const data = await response.json();
      setCandles(data.candles || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candles';
      setError(message);
      console.error('Error fetching candles:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, gatewayUrl]);

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
