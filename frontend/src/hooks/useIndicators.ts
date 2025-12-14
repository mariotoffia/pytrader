import { useState, useEffect } from 'react';
import { Interval } from '../types';

export interface IndicatorResult {
  timestamp: number;
  [indicatorName: string]: number | undefined;
}

export interface IndicatorData {
  ema_20?: IndicatorResult[];
  ema_50?: IndicatorResult[];
  rsi_14?: IndicatorResult[];
  bb_upper?: IndicatorResult[];
  bb_middle?: IndicatorResult[];
  bb_lower?: IndicatorResult[];
}

interface UseIndicatorsOptions {
  provider: string;
  symbol: string;
  interval: Interval;
  gatewayUrl: string;
  candles: any[]; // Trigger refetch when candles change
}

export function useIndicators({ provider, symbol, interval, gatewayUrl, candles }: UseIndicatorsOptions) {
  const [indicators, setIndicators] = useState<IndicatorData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch indicators when candles change
  useEffect(() => {
    if (candles.length === 0) {
      setIndicators({});
      return;
    }

    let cancelled = false;

    const fetchIndicators = async () => {
      try {
        setLoading(true);
        setError(null);

        const from = candles[0].timestamp;
        const to = candles[candles.length - 1].timestamp;

        const response = await fetch(`${gatewayUrl}/indicators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            symbol,
            interval,
            from,
            to,
            indicators: ['ema_20', 'ema_50', 'rsi_14', 'bollinger_bands'],
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch indicators: ${response.statusText}`);
        }

        const data = await response.json();

        if (cancelled) return;

        // Group results by indicator name
        const groupedIndicators: any = {};

        if (data.results && Array.isArray(data.results)) {
          // Each result has timestamp and indicator values
          // Group them by indicator name
          data.results.forEach((result: IndicatorResult) => {
            Object.keys(result).forEach(key => {
              if (key !== 'timestamp' && result[key] !== undefined) {
                if (!groupedIndicators[key]) {
                  groupedIndicators[key] = [];
                }
                groupedIndicators[key].push(result);
              }
            });
          });
        }

        setIndicators(groupedIndicators);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to fetch indicators';
        setError(message);
        console.error('Error fetching indicators:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchIndicators();

    return () => {
      cancelled = true;
    };
  }, [symbol, interval, gatewayUrl, candles.length, candles[0]?.timestamp, candles[candles.length - 1]?.timestamp]);

  return {
    indicators,
    loading,
    error,
  };
}
