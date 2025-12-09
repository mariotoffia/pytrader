import {
  GetCandlesRequest,
  GetCandlesResponse,
  OHLCVCandle,
  Interval,
  Symbol,
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
}
