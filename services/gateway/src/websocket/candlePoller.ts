import { MarketDataClient } from '../clients/marketDataClient.js';
import type pino from 'pino';
import { SessionManager } from './sessionManager.js';
import type { WebSocketHandler } from './handler.js';
import type { Interval, OHLCVCandle, ServerMessage } from '@pytrader/shared/types';

type CandleSubscriptionKey = string; // "symbol:interval"

function makeKey(symbol: string, interval: Interval): CandleSubscriptionKey {
  return `${symbol}:${interval}`;
}

function candleHash(candle: OHLCVCandle): string {
  return [
    candle.timestamp,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
    candle.provider ?? '',
  ].join('|');
}

/**
 * Polls Market Data Service for the latest candle per active WebSocket subscription,
 * and broadcasts `candle_update` messages when the candle changes.
 */
export class CandlePoller {
  private timer: NodeJS.Timeout | null = null;
  private lastSent = new Map<CandleSubscriptionKey, string>();

  constructor(
    private marketDataClient: MarketDataClient,
    private sessionManager: SessionManager,
    private wsHandler: WebSocketHandler,
    private logger: pino.Logger,
    private pollingIntervalMs: number = 1000
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.poll(), this.pollingIntervalMs);
    void this.poll();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async poll(): Promise<void> {
    const subs = this.sessionManager.getCandleSubscriptions();
    if (subs.length === 0) {
      if (this.lastSent.size > 0) this.lastSent.clear();
      return;
    }

    const activeKeys = new Set<CandleSubscriptionKey>();

    for (const { symbol, interval } of subs) {
      const key = makeKey(symbol, interval);
      activeKeys.add(key);

      // No clients => no need to poll/broadcast
      if (this.sessionManager.getSubscribers(symbol, interval).size === 0) continue;

      try {
        const candle = await this.marketDataClient.getLatestCandle(symbol, interval);
        if (!candle) continue;

        const hash = candleHash(candle);
        if (this.lastSent.get(key) === hash) continue;
        this.lastSent.set(key, hash);

        const message: ServerMessage = { type: 'candle_update', payload: candle };
        this.wsHandler.broadcast(symbol, interval, message);
      } catch (error) {
        this.logger.debug(
          { err: error, symbol, interval },
          'CandlePoller: failed to fetch latest candle'
        );
      }
    }

    // Cleanup lastSent entries for subscriptions that no longer exist
    for (const key of this.lastSent.keys()) {
      if (!activeKeys.has(key)) this.lastSent.delete(key);
    }
  }
}

