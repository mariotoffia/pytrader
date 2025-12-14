/**
 * Hook for fetching supported symbols/tickers for a specific provider
 */

import { useState, useEffect } from 'react';
import { DataProvider } from '../types';

export interface UseProviderSymbolsOptions {
  gatewayUrl: string;
  provider: DataProvider;
}

export interface UseProviderSymbolsResult {
  symbols: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetch supported symbols for a specific provider
 *
 * @param options - Configuration options
 * @param options.gatewayUrl - Base URL of the gateway service
 * @param options.provider - Data provider to fetch symbols for
 * @returns Symbols array, loading state, and error state
 */
export function useProviderSymbols({
  gatewayUrl,
  provider,
}: UseProviderSymbolsOptions): UseProviderSymbolsResult {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch only configured symbols (not all available from exchange)
        const response = await fetch(
          `${gatewayUrl}/market-data/providers/${provider}/tickers?configuredOnly=true`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch symbols: ${response.statusText}`);
        }

        const data = (await response.json()) as { provider: string; tickers: string[] };
        setSymbols(data.tickers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useProviderSymbols] Error fetching symbols:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSymbols();
  }, [gatewayUrl, provider]);

  return {
    symbols,
    loading,
    error,
  };
}
