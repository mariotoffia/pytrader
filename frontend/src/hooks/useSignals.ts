import { useState, useEffect, useCallback } from 'react';
import { Signal, Interval } from '../types';
import { debugLog } from '../utils/debug';
import { fetchJson, HttpError } from '../utils/http';

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
  strategyId = 'ema_crossover_rsi',
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

      const payload = {
        provider,
        symbol,
        interval,
        from: oneDayAgo,
        to: now,
        strategyId,
      };

      debugLog('signals', 'fetch historical', payload);

      const { data, requestId } = await fetchJson<{ signals: Signal[] }>(
        `${gatewayUrl}/signals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        { scope: 'signals', requestName: 'signals' }
      );

      debugLog('signals', 'fetched historical', { requestId, count: data.signals?.length ?? 0 });
      setSignals(data.signals || []);
    } catch (err) {
      if (err instanceof HttpError) {
        debugLog('signals', 'fetch error', err.details);
        const message = `Failed to fetch signals: ${err.details.status ?? ''} ${err.details.statusText ?? ''} (requestId: ${err.details.requestId})`;
        setError(message);
        console.error('Error fetching signals:', err.details);
        return;
      }

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
      debugLog('signals', 'ws not ready for subscribe', { readyState: wsSocket?.readyState });
      return;
    }

    const subscribeMessage = {
      type: 'subscribe_signals',
      payload: { symbol, interval, strategyId },
    };

    debugLog('signals', 'ws subscribe_signals', subscribeMessage);
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
              const exists = prev.some((s) => s.timestamp === newSignal.timestamp);
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
        debugLog('signals', 'ws unsubscribe_signals', unsubscribeMessage);
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
