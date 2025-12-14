import { EventEmitter } from 'events';
import { RawCandle, Interval } from '@pytrader/shared/types';

export interface RateLimitMetadata {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  weightPerMinute?: number; // For weight-based limits like Binance
}

/**
 * Abstract base class for market data providers
 */
export abstract class DataProvider extends EventEmitter {
  protected connected: boolean = false;
  protected subscriptions: Map<string, Set<Interval>> = new Map();
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStartTime: number = Date.now();

  /**
   * Connect to the data provider
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the data provider
   */
  abstract disconnect(): Promise<void>;

  /**
   * Subscribe to real-time candle updates
   */
  abstract subscribeCandles(symbol: string, interval: Interval): Promise<void>;

  /**
   * Unsubscribe from candle updates
   */
  abstract unsubscribeCandles(symbol: string, interval: Interval): Promise<void>;

  /**
   * Fetch historical candles
   * @param symbol Trading symbol (e.g., "BTC/USDT")
   * @param interval Candle interval (e.g., "1m")
   * @param from Start timestamp in milliseconds
   * @param to End timestamp in milliseconds
   * @returns Array of raw candles
   */
  abstract getHistoricalCandles(
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ): Promise<RawCandle[]>;

  /**
   * Get rate limit metadata for the provider
   */
  abstract getRateLimitMetadata(): RateLimitMetadata;

  /**
   * Get list of supported trading symbols for this provider
   * Each provider should implement this to return symbols they support
   */
  abstract getSupportedSymbols(): Promise<string[]>;

  /**
   * Get list of supported intervals for this provider
   * Each provider should implement this to return intervals they support
   */
  abstract getSupportedIntervals(): Interval[];

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current subscriptions for a symbol
   */
  getSubscriptions(symbol: string): Set<Interval> {
    return this.subscriptions.get(symbol) || new Set();
  }

  /**
   * Track subscription
   */
  protected trackSubscription(symbol: string, interval: Interval): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(interval);
  }

  /**
   * Untrack subscription
   */
  protected untrackSubscription(symbol: string, interval: Interval): void {
    const intervals = this.subscriptions.get(symbol);
    if (intervals) {
      intervals.delete(interval);
      if (intervals.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }
  }

  /**
   * Emit candle event (called by provider implementations)
   */
  protected emitCandle(candle: RawCandle): void {
    this.emit('candle', candle);
  }

  /**
   * Emit error event
   */
  protected emitError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Throttle requests based on rate limit metadata
   */
  protected async throttle(): Promise<void> {
    const metadata = this.getRateLimitMetadata();
    const now = Date.now();

    // Reset window if needed
    if (now - this.windowStartTime >= 60000) {
      this.windowStartTime = now;
      this.requestCount = 0;
    }

    // Check requests per second
    if (metadata.requestsPerSecond) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minInterval = 1000 / metadata.requestsPerSecond;

      if (timeSinceLastRequest < minInterval) {
        const delay = minInterval - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Check requests/weight per minute
    // Note: This is a simplified implementation. For weight-based limits,
    // we would need to pass the weight of the request.
    // Assuming 1 request = 1 weight for now unless specified otherwise.
    const limitPerMinute = metadata.requestsPerMinute || metadata.weightPerMinute;
    if (limitPerMinute) {
      if (this.requestCount >= limitPerMinute) {
        const delay = 60000 - (now - this.windowStartTime);
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          // Reset after waiting
          this.windowStartTime = Date.now();
          this.requestCount = 0;
        }
      }
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}
