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
import { UpstreamServiceError } from './upstreamServiceError.js';

/**
 * HTTP client for Market Data Service
 */
export class MarketDataClient {
  constructor(private baseUrl: string) {}

  private async requestJson<T>(
    path: string,
    init?: RequestInit,
    options?: { requestId?: string }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
        },
      });
    } catch (error) {
      const body = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw new UpstreamServiceError(
        'Market Data Service request failed',
        { url, status: 0, statusText: 'FETCH_FAILED', body },
        options?.requestId
      );
    }

    if (!response.ok) {
      let upstreamBody: string | undefined;
      try {
        upstreamBody = await response.text();
      } catch {
        // ignore
      }
      throw new UpstreamServiceError(
        `Market Data Service error: ${response.status} ${response.statusText}`,
        { url, status: response.status, statusText: response.statusText, body: upstreamBody },
        options?.requestId
      );
    }

    return (await response.json()) as T;
  }

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

    const data = await this.requestJson<GetCandlesResponse>(`/internal/candles?${params}`);
    return data.candles;
  }

  /**
   * Get latest candle for a symbol/interval
   */
  async getLatestCandle(symbol: string, interval: Interval): Promise<OHLCVCandle | null> {
    const params = new URLSearchParams({ symbol, interval });
    const url = `${this.baseUrl}/internal/latest-candle?${params}`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      const body = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw new UpstreamServiceError('Market Data Service request failed', {
        url,
        status: 0,
        statusText: 'FETCH_FAILED',
        body,
      });
    }

    if (response.status === 404) return null;

    if (!response.ok) {
      let upstreamBody: string | undefined;
      try {
        upstreamBody = await response.text();
      } catch {
        // ignore
      }
      throw new UpstreamServiceError(`Market Data Service error: ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        statusText: response.statusText,
        body: upstreamBody,
      });
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

    return await this.requestJson<PageCandlesResponse>(`/internal/candles/page?${params}`);
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
    return await this.requestJson<MarketDataStatistics>('/internal/candles/stats');
  }

  /**
   * Get detailed statistics breakdown by provider/symbol/interval
   */
  async getDetailedStats(): Promise<{ stats: DetailedMarketDataStats[] }> {
    return await this.requestJson<{ stats: DetailedMarketDataStats[] }>(
      '/internal/candles/stats/detailed'
    );
  }

  /**
   * Delete candles with flexible filtering
   */
  async deleteCandles(filters: DeleteCandlesRequest): Promise<DeleteCandlesResponse> {
    const params = new URLSearchParams();
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.symbol) params.append('symbol', filters.symbol);
    if (filters.interval) params.append('interval', filters.interval);

    return await this.requestJson<DeleteCandlesResponse>(`/internal/candles?${params}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get current multi-provider configuration
   */
  async getConfig(): Promise<MultiProviderConfig> {
    return await this.requestJson<MultiProviderConfig>('/internal/config');
  }

  /**
   * Update multi-provider configuration
   */
  async updateConfig(
    config: MultiProviderConfig
  ): Promise<{ success: boolean; config: MultiProviderConfig }> {
    return await this.requestJson<{ success: boolean; config: MultiProviderConfig }>(
      '/internal/config',
      {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      }
    );
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<{ success: boolean; config: MultiProviderConfig }> {
    return await this.requestJson<{ success: boolean; config: MultiProviderConfig }>(
      '/internal/config/reload',
      { method: 'POST' }
    );
  }

  /**
   * Get all provider statuses
   */
  async getProviders(): Promise<{ providers: ProviderStatus[] }> {
    return await this.requestJson<{ providers: ProviderStatus[] }>('/internal/providers');
  }

  /**
   * Get supported tickers for a provider
   */
  async getProviderTickers(
    provider: DataProvider
  ): Promise<{ provider: string; tickers: string[] }> {
    return await this.requestJson<{ provider: string; tickers: string[] }>(
      `/internal/providers/${provider}/tickers`
    );
  }

  /**
   * Get supported intervals for a provider
   */
  async getProviderIntervals(
    provider: DataProvider
  ): Promise<{ provider: string; intervals: Interval[] }> {
    return await this.requestJson<{ provider: string; intervals: Interval[] }>(
      `/internal/providers/${provider}/intervals`
    );
  }

  /**
   * Get specific provider status
   */
  async getProviderStatus(provider: DataProvider): Promise<ProviderStatus> {
    return await this.requestJson<ProviderStatus>(`/internal/providers/${provider}/status`);
  }

  /**
   * Trigger manual backfill for specific provider/symbol/interval
   */
  async backfill(request: BackfillRequest): Promise<BackfillResponse> {
    return await this.requestJson<BackfillResponse>('/internal/backfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }
}
