import { useState, useEffect, useCallback } from 'react';
import { MultiProviderConfig } from '@pytrader/shared/types';
import config from '../config';

interface UseConfigReturn {
  config: MultiProviderConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (newConfig: MultiProviderConfig) => Promise<boolean>;
  reloadConfig: () => Promise<boolean>;
}

/**
 * Hook for managing application configuration
 * Provides methods to fetch, update, and reload config from the backend
 */
export function useConfig(): UseConfigReturn {
  const [configData, setConfigData] = useState<MultiProviderConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current configuration from backend
   */
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.gatewayUrl}/market-data/config`);

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }

      const data = await response.json();
      setConfigData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useConfig] Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update configuration on backend
   * @returns true if successful, false otherwise
   */
  const updateConfig = useCallback(async (newConfig: MultiProviderConfig): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.gatewayUrl}/market-data/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to update config: ${response.statusText}`);
      }

      const data = await response.json();
      // Backend returns { success: true, config: {...} }, extract the config
      const updatedConfig = data.config || data;
      setConfigData(updatedConfig);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useConfig] Error updating config:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload configuration from file (discards any unsaved changes)
   * @returns true if successful, false otherwise
   */
  const reloadConfig = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.gatewayUrl}/market-data/config/reload`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to reload config: ${response.statusText}`);
      }

      const data = await response.json();
      // Backend returns { success: true, config: {...} }, extract the config
      const reloadedConfig = data.config || data;
      setConfigData(reloadedConfig);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useConfig] Error reloading config:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config: configData,
    loading,
    error,
    fetchConfig,
    updateConfig,
    reloadConfig,
  };
}
