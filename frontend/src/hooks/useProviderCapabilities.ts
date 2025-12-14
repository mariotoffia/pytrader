import { useState, useEffect, useCallback } from 'react';
import { DataProvider, Interval, ProviderStatus } from '@pytrader/shared/types';
import config from '../config';

interface ProviderCapabilities {
  supportedIntervals: Interval[];
  supportedTickers: string[];
}

interface UseProviderCapabilitiesReturn {
  capabilities: Record<DataProvider, ProviderCapabilities>;
  statuses: Record<DataProvider, ProviderStatus | null>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching provider capabilities (available symbols and intervals)
 * Also fetches current provider status
 */
export function useProviderCapabilities(): UseProviderCapabilitiesReturn {
  const [capabilities, setCapabilities] = useState<Record<DataProvider, ProviderCapabilities>>({
    binance: { supportedIntervals: [], supportedTickers: [] },
    coinbase: { supportedIntervals: [], supportedTickers: [] },
    mock: { supportedIntervals: [], supportedTickers: [] },
  });
  const [statuses, setStatuses] = useState<Record<DataProvider, ProviderStatus | null>>({
    binance: null,
    coinbase: null,
    mock: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch capabilities for a specific provider
   */
  const fetchProviderCapabilities = useCallback(async (provider: DataProvider) => {
    try {
      // Fetch intervals
      const intervalsResponse = await fetch(
        `${config.gatewayUrl}/market-data/providers/${provider}/intervals`
      );
      const intervalsData = await intervalsResponse.json();

      // Fetch tickers
      const tickersResponse = await fetch(
        `${config.gatewayUrl}/market-data/providers/${provider}/tickers`
      );
      const tickersData = await tickersResponse.json();

      return {
        supportedIntervals: intervalsData.intervals || [],
        supportedTickers: tickersData.tickers || [],
      };
    } catch (err) {
      console.error(`[useProviderCapabilities] Error fetching capabilities for ${provider}:`, err);
      return { supportedIntervals: [], supportedTickers: [] };
    }
  }, []);

  /**
   * Fetch status for a specific provider
   */
  const fetchProviderStatus = useCallback(async (provider: DataProvider) => {
    try {
      const response = await fetch(`${config.gatewayUrl}/market-data/providers/${provider}/status`);
      const data = await response.json();
      return data as ProviderStatus;
    } catch (err) {
      console.error(`[useProviderCapabilities] Error fetching status for ${provider}:`, err);
      return null;
    }
  }, []);

  /**
   * Fetch all provider capabilities and statuses
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const providers: DataProvider[] = ['binance', 'coinbase', 'mock'];

      // Fetch capabilities for all providers in parallel
      const capabilitiesPromises = providers.map((provider) =>
        fetchProviderCapabilities(provider).then((caps) => ({ provider, caps }))
      );

      // Fetch statuses for all providers in parallel
      const statusesPromises = providers.map((provider) =>
        fetchProviderStatus(provider).then((status) => ({ provider, status }))
      );

      const [capabilitiesResults, statusesResults] = await Promise.all([
        Promise.all(capabilitiesPromises),
        Promise.all(statusesPromises),
      ]);

      // Build capabilities map
      const newCapabilities: Record<DataProvider, ProviderCapabilities> = {
        binance: { supportedIntervals: [], supportedTickers: [] },
        coinbase: { supportedIntervals: [], supportedTickers: [] },
        mock: { supportedIntervals: [], supportedTickers: [] },
      };

      capabilitiesResults.forEach(({ provider, caps }) => {
        newCapabilities[provider] = caps;
      });

      setCapabilities(newCapabilities);

      // Build statuses map
      const newStatuses: Record<DataProvider, ProviderStatus | null> = {
        binance: null,
        coinbase: null,
        mock: null,
      };

      statusesResults.forEach(({ provider, status }) => {
        newStatuses[provider] = status;
      });

      setStatuses(newStatuses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useProviderCapabilities] Error fetching capabilities:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchProviderCapabilities, fetchProviderStatus]);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    capabilities,
    statuses,
    loading,
    error,
    refetch: fetchAll,
  };
}
