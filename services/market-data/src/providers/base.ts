import { EventEmitter } from 'events';
import { RawCandle, Interval } from '@pytrader/shared/types';

/**
 * Abstract base class for market data providers
 */
export abstract class DataProvider extends EventEmitter {
  protected connected: boolean = false;
  protected subscriptions: Map<string, Set<Interval>> = new Map();

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
}
