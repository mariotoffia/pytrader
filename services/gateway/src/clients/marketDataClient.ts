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
} from '@pytrader/shared/types';

/**
 * HTTP client for Market Data Service
 */
export class MarketDataClient {
  constructor(private baseUrl: string) {}

  /**
   * Get historical candles
   */
  async getCandles(
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ): Promise<OHLCVCandle[]> {
    const params = new URLSearchParams({
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
}
