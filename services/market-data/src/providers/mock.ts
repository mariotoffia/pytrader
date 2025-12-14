import { DataProvider } from './base.js';
import { RawCandle, Interval } from '@pytrader/shared/types';

/**
 * Mock data provider that generates synthetic candlestick data
 * Useful for testing and development
 */
export class MockProvider extends DataProvider {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private basePrice: Map<string, number> = new Map();
  private readonly updateIntervalMs = 1000; // Update every second

  /**
   * Initialize base prices for common symbols
   */
  constructor() {
    super();
    this.basePrice.set('BTC/USDT', 50000);
    this.basePrice.set('ETH/USDT', 3000);
    this.basePrice.set('BNB/USDT', 500);
    this.basePrice.set('SOL/USDT', 100);
    this.basePrice.set('ADA/USDT', 0.5);
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    // Stop all update intervals
    for (const [, interval] of this.intervals.entries()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.connected = false;
    this.emit('disconnected');
  }

  async subscribeCandles(symbol: string, interval: Interval): Promise<void> {
    if (!this.connected) {
      throw new Error('Provider not connected');
    }

    this.trackSubscription(symbol, interval);
    const key = `${symbol}:${interval}`;

    // Don't create duplicate intervals
    if (this.intervals.has(key)) {
      return;
    }

    // Initialize base price if not exists
    if (!this.basePrice.has(symbol)) {
      this.basePrice.set(symbol, 100);
    }

    // Start generating candles
    const intervalId = setInterval(() => {
      const candle = this.generateCandle(symbol, interval);
      this.emitCandle(candle);
    }, this.updateIntervalMs);

    this.intervals.set(key, intervalId);
  }

  async unsubscribeCandles(symbol: string, interval: Interval): Promise<void> {
    this.untrackSubscription(symbol, interval);
    const key = `${symbol}:${interval}`;
    const intervalId = this.intervals.get(key);

    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  async getHistoricalCandles(
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ): Promise<RawCandle[]> {
    if (!this.connected) {
      throw new Error('Provider not connected');
    }

    // Initialize base price if not exists
    if (!this.basePrice.has(symbol)) {
      this.basePrice.set(symbol, 100);
    }

    const candles: RawCandle[] = [];
    const intervalMs = this.getIntervalMs(interval);

    // Align timestamps to interval boundaries
    const alignedFrom = Math.floor(from / intervalMs) * intervalMs;
    const alignedTo = Math.floor(to / intervalMs) * intervalMs;

    for (let ts = alignedFrom; ts <= alignedTo; ts += intervalMs) {
      candles.push(this.generateCandle(symbol, interval, ts));
    }

    return candles;
  }

  /**
   * Generate a synthetic candle
   */
  private generateCandle(symbol: string, interval: Interval, timestamp?: number): RawCandle {
    const base = this.basePrice.get(symbol) || 100;
    const ts = timestamp || this.getAlignedTimestamp(interval);

    // Generate random price movement (+/- 2%)
    const volatility = base * 0.02;
    const priceChange = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = base + priceChange;

    // Generate OHLC with some variance
    const open = base;
    const close = newPrice;
    const variance = Math.abs(priceChange) * 0.5;
    const high = Math.max(open, close) + Math.random() * variance;
    const low = Math.min(open, close) - Math.random() * variance;
    const volume = Math.random() * 100 + 50; // Random volume between 50-150

    // Update base price for next candle
    this.basePrice.set(symbol, newPrice);

    return {
      symbol,
      interval,
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume,
      provider: 'mock',
    };
  }

  /**
   * Get interval duration in milliseconds
   */
  private getIntervalMs(interval: Interval): number {
    const map: Record<Interval, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return map[interval];
  }

  /**
   * Get current timestamp aligned to interval boundary
   */
  private getAlignedTimestamp(interval: Interval): number {
    const now = Date.now();
    const intervalMs = this.getIntervalMs(interval);
    return Math.floor(now / intervalMs) * intervalMs;
  }
  /**
   * Get rate limit metadata for the provider
   */
  getRateLimitMetadata(): import('./base').RateLimitMetadata {
    return {
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
    };
  }

  /**
   * Get list of supported symbols for mock provider
   */
  async getSupportedSymbols(): Promise<string[]> {
    // Mock provider supports common crypto pairs
    return ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
  }

  /**
   * Get list of supported intervals for mock provider
   */
  getSupportedIntervals(): Interval[] {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  }
}
