import { useState, useCallback, useEffect } from 'react';
import { DetailedMarketDataStats, DeleteCandlesRequest, DeleteCandlesResponse } from '../types';

export interface UseMarketDataManagementOptions {
  gatewayUrl: string;
}

export function useMarketDataManagement({ gatewayUrl }: UseMarketDataManagementOptions) {
  const [stats, setStats] = useState<DetailedMarketDataStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${gatewayUrl}/market-data/stats/detailed`);

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [gatewayUrl]);

  const deleteCandles = useCallback(async (filters: DeleteCandlesRequest): Promise<DeleteCandlesResponse> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.symbol) params.append('symbol', filters.symbol);
      if (filters.interval) params.append('interval', filters.interval);

      const response = await fetch(
        `${gatewayUrl}/market-data/candles?${params}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete candles: ${response.statusText}`);
      }

      const result = await response.json();

      // Refresh stats after deletion
      await fetchStats();

      return result;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting candles:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gatewayUrl, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    deleteCandles
  };
}
