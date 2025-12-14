import {
  GetCandlesResponse,
  OHLCVCandle,
  Interval,
  MarketDataStatistics,
  DetailedMarketDataStats,
  DeleteCandlesRequest,
  DeleteCandlesResponse,
  CandlePageDirection,
  DataProvider,
  PageCandlesResponse,
  MultiProviderConfig,
  ProviderStatus,
  BackfillRequest,
  BackfillResponse,
} from '@pytrader/shared/types';

/**
 * HTTP client for Market Data Service
 */
export class MarketDataClient {
  constructor(private baseUrl: string) {}

  /**
   * Get historical candles for a specific provider
   */
  async getCandles(
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ): Promise<OHLCVCandle[]> {
    const params = new URLSearchParams({
      provider,
      symbol,
      interval,
      from: from.toString(),
      to: to.toString(),
    });

    const url = `${this.baseUrl}/internal/candles?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    const data = (await response.json()) as GetCandlesResponse;
    return data.candles;
  }

  /**
   * Get latest candle for a symbol/interval
   */
  async getLatestCandle(symbol: string, interval: Interval): Promise<OHLCVCandle | null> {
    const params = new URLSearchParams({ symbol, interval });
    const url = `${this.baseUrl}/internal/latest-candle?${params}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    const data = (await response.json()) as { candle: OHLCVCandle };
    return data.candle;
  }

  /**
   * Get paged candles for browsing (cursor-based)
   */
  async getCandlesPage(
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    cursor: number,
    direction?: CandlePageDirection,
    limit?: number
  ): Promise<PageCandlesResponse> {
    const params = new URLSearchParams({
      provider,
      symbol,
      interval,
      cursor: cursor.toString(),
    });
    if (direction) params.append('direction', direction);
    if (limit) params.append('limit', limit.toString());

    const url = `${this.baseUrl}/internal/candles/page?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as PageCandlesResponse;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get overall market data statistics
   */
  async getStatistics(): Promise<MarketDataStatistics> {
    const url = `${this.baseUrl}/internal/candles/stats`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as MarketDataStatistics;
  }

  /**
   * Get detailed statistics breakdown by provider/symbol/interval
   */
  async getDetailedStats(): Promise<{ stats: DetailedMarketDataStats[] }> {
    const url = `${this.baseUrl}/internal/candles/stats/detailed`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { stats: DetailedMarketDataStats[] };
  }

  /**
   * Delete candles with flexible filtering
   */
  async deleteCandles(filters: DeleteCandlesRequest): Promise<DeleteCandlesResponse> {
    const params = new URLSearchParams();
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.symbol) params.append('symbol', filters.symbol);
    if (filters.interval) params.append('interval', filters.interval);

    const url = `${this.baseUrl}/internal/candles?${params}`;
    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as DeleteCandlesResponse;
  }

  /**
   * Get current multi-provider configuration
   */
  async getConfig(): Promise<MultiProviderConfig> {
    const url = `${this.baseUrl}/internal/config`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as MultiProviderConfig;
  }

  /**
   * Update multi-provider configuration
   */
  async updateConfig(config: MultiProviderConfig): Promise<{ success: boolean; config: MultiProviderConfig }> {
    const url = `${this.baseUrl}/internal/config`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { success: boolean; config: MultiProviderConfig };
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<{ success: boolean; config: MultiProviderConfig }> {
    const url = `${this.baseUrl}/internal/config/reload`;
    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { success: boolean; config: MultiProviderConfig };
  }

  /**
   * Get all provider statuses
   */
  async getProviders(): Promise<{ providers: ProviderStatus[] }> {
    const url = `${this.baseUrl}/internal/providers`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { providers: ProviderStatus[] };
  }

  /**
   * Get supported tickers for a provider
   */
  async getProviderTickers(provider: DataProvider): Promise<{ provider: string; tickers: string[] }> {
    const url = `${this.baseUrl}/internal/providers/${provider}/tickers`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { provider: string; tickers: string[] };
  }

  /**
   * Get supported intervals for a provider
   */
  async getProviderIntervals(provider: DataProvider): Promise<{ provider: string; intervals: Interval[] }> {
    const url = `${this.baseUrl}/internal/providers/${provider}/intervals`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as { provider: string; intervals: Interval[] };
  }

  /**
   * Get specific provider status
   */
  async getProviderStatus(provider: DataProvider): Promise<ProviderStatus> {
    const url = `${this.baseUrl}/internal/providers/${provider}/status`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as ProviderStatus;
  }

  /**
   * Trigger manual backfill for specific provider/symbol/interval
   */
  async backfill(request: BackfillRequest): Promise<BackfillResponse> {
    const url = `${this.baseUrl}/internal/backfill`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Market Data Service error: ${response.statusText}`);
    }

    return (await response.json()) as BackfillResponse;
  }
}
