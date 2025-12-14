/**
 * Hook for fetching and polling provider status
 */

import { useState, useEffect, useCallback } from 'react';
import { ProviderStatus } from '@pytrader/shared/types';

export interface UseProviderStatusOptions {
  gatewayUrl: string;
  pollInterval?: number;
  enabled?: boolean;
}

export interface UseProviderStatusResult {
  providers: ProviderStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and poll provider status from the gateway
 *
 * @param options - Configuration options
 * @param options.gatewayUrl - Base URL of the gateway service
 * @param options.pollInterval - Polling interval in milliseconds (default: 5000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * @returns Provider status data, loading state, error state, and refetch function
 *
 * @example
 * const { providers, loading, error, refetch } = useProviderStatus({
 *   gatewayUrl: 'http://localhost:4000',
 *   pollInterval: 5000,
 * });
 */
export function useProviderStatus({
  gatewayUrl,
  pollInterval = 5000,
  enabled = true,
}: UseProviderStatusOptions): UseProviderStatusResult {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${gatewayUrl}/market-data/providers`);

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`);
      }

      const data = await response.json() as { providers: ProviderStatus[] };
      setProviders(data.providers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useProviderStatus] Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  }, [gatewayUrl, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchProviders();

    // Set up polling interval
    const intervalId = setInterval(fetchProviders, pollInterval);

    // Cleanup on unmount or dependency change
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchProviders, pollInterval, enabled]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}
