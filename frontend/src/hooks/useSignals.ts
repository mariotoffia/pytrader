import { useState, useEffect, useCallback } from 'react';
import { Signal, Interval } from '../types';

interface UseSignalsOptions {
  provider: string;
  symbol: string;
  interval: Interval;
  gatewayUrl: string;
  wsSocket: WebSocket | null;
  strategyId?: string;
}

export function useSignals({
  provider,
  symbol,
  interval,
  gatewayUrl,
  wsSocket,
  strategyId = 'ema_crossover_rsi'
}: UseSignalsOptions) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical signals
  const fetchHistoricalSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const response = await fetch(`${gatewayUrl}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          symbol,
          interval,
          from: oneDayAgo,
          to: now,
          strategyId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch signals: ${response.statusText}`);
      }

      const data = await response.json();
      setSignals(data.signals || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch signals';
      setError(message);
      console.error('Error fetching signals:', err);
    } finally {
      setLoading(false);
    }
  }, [provider, symbol, interval, gatewayUrl, strategyId]);

  // Fetch historical signals on mount and when symbol/interval changes
  useEffect(() => {
    fetchHistoricalSignals();
  }, [fetchHistoricalSignals]);

  // Subscribe to real-time signal updates via WebSocket
  useEffect(() => {
    if (!wsSocket || wsSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscribeMessage = {
      type: 'subscribe_signals',
      payload: { symbol, interval, strategyId },
    };

    wsSocket.send(JSON.stringify(subscribeMessage));

    // Handle incoming signal updates
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'signal_update') {
          const newSignal = message.payload as Signal;

          // Only add signals for our current symbol/interval
          if (newSignal.symbol === symbol && newSignal.strategyId === strategyId) {
            setSignals((prev) => {
              // Check if signal already exists
              const exists = prev.some(s => s.timestamp === newSignal.timestamp);
              if (exists) {
                return prev;
              }
              // Add new signal and keep sorted
              return [...prev, newSignal].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
      } catch (err) {
        console.error('Error parsing signal update:', err);
      }
    };

    wsSocket.addEventListener('message', handleMessage);

    // Cleanup: unsubscribe on unmount or when dependencies change
    return () => {
      wsSocket.removeEventListener('message', handleMessage);

      if (wsSocket.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
          type: 'unsubscribe_signals',
          payload: { symbol, interval, strategyId },
        };
        wsSocket.send(JSON.stringify(unsubscribeMessage));
      }
    };
  }, [wsSocket, symbol, interval, strategyId]);

  return {
    signals,
    loading,
    error,
    refetch: fetchHistoricalSignals,
  };
}
