import type { WebSocket } from 'ws';
import { AnalyticsClient } from '../clients/analyticsClient.js';
import { Interval, Signal, ServerMessage, DataProvider } from '@pytrader/shared/types';
import pino from 'pino';

/**
 * Subscription key format: "symbol:interval:strategyId"
 */
type SignalSubscriptionKey = string;

/**
 * Subscription details
 */
interface SignalSubscription {
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  strategyId: string;
  subscribers: Set<WebSocket>;
  lastCheckTimestamp: number;
}

/**
 * Polls analytics service for new signals and broadcasts them to subscribed clients
 */
export class SignalPoller {
  private interval: NodeJS.Timeout | null = null;
  private subscriptions = new Map<SignalSubscriptionKey, SignalSubscription>();
  private pollingIntervalMs: number;
  private lookbackMs: number;

  constructor(
    private analyticsClient: AnalyticsClient,
    private logger: pino.Logger,
    pollingIntervalSeconds: number = 30,
    lookbackSeconds: number = 60
  ) {
    this.pollingIntervalMs = pollingIntervalSeconds * 1000;
    this.lookbackMs = lookbackSeconds * 1000;
  }

  /**
   * Start polling for signals
   */
  start(): void {
    if (this.interval) {
      this.logger.warn('SignalPoller already started');
      return;
    }

    this.logger.info(`Starting signal polling (interval: ${this.pollingIntervalMs}ms)`);
    this.interval = setInterval(() => this.pollSignals(), this.pollingIntervalMs);

    // Do an initial poll immediately
    this.pollSignals();
  }

  /**
   * Stop polling for signals
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.info('Signal polling stopped');
    }
  }

  /**
   * Subscribe a client to signals for a symbol/interval/strategy
   */
  subscribe(
    socket: WebSocket,
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    strategyId: string
  ): void {
    const key = this.makeKey(symbol, interval, strategyId);

    let subscription = this.subscriptions.get(key);
    if (!subscription) {
      subscription = {
        provider,
        symbol,
        interval,
        strategyId,
        subscribers: new Set(),
        lastCheckTimestamp: Date.now() - this.lookbackMs, // Look back one polling interval
      };
      this.subscriptions.set(key, subscription);
      this.logger.debug(`Created new signal subscription: ${key}`);
    }

    subscription.subscribers.add(socket);
    this.logger.debug(`Client subscribed to signals: ${key}`);
  }

  /**
   * Unsubscribe a client from signals
   */
  unsubscribe(socket: WebSocket, symbol: string, interval: Interval, strategyId: string): void {
    const key = this.makeKey(symbol, interval, strategyId);
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.subscribers.delete(socket);
      this.logger.debug(`Client unsubscribed from signals: ${key}`);

      // Clean up subscription if no more subscribers
      if (subscription.subscribers.size === 0) {
        this.subscriptions.delete(key);
        this.logger.debug(`Removed signal subscription: ${key}`);
      }
    }
  }

  /**
   * Remove a client from all signal subscriptions
   */
  removeClient(socket: WebSocket): void {
    for (const [key, subscription] of this.subscriptions.entries()) {
      subscription.subscribers.delete(socket);

      // Clean up empty subscriptions
      if (subscription.subscribers.size === 0) {
        this.subscriptions.delete(key);
        this.logger.debug(`Removed signal subscription: ${key}`);
      }
    }
  }

  /**
   * Get all signal subscriptions for a client
   */
  getClientSubscriptions(socket: WebSocket): SignalSubscriptionKey[] {
    const subscriptions: SignalSubscriptionKey[] = [];

    for (const [key, subscription] of this.subscriptions.entries()) {
      if (subscription.subscribers.has(socket)) {
        subscriptions.push(key);
      }
    }

    return subscriptions;
  }

  /**
   * Poll all subscriptions for new signals
   */
  private async pollSignals(): Promise<void> {
    if (this.subscriptions.size === 0) {
      this.logger.debug('No active signal subscriptions, skipping poll');
      return;
    }

    this.logger.debug(`Polling signals for ${this.subscriptions.size} subscriptions`);

    for (const [key, subscription] of this.subscriptions.entries()) {
      if (subscription.subscribers.size === 0) {
        continue;
      }

      try {
        await this.pollSubscription(subscription);
      } catch (error) {
        this.logger.error(`Error polling signals for ${key}:`, error);
      }
    }
  }

  /**
   * Poll a single subscription for new signals
   */
  private async pollSubscription(subscription: SignalSubscription): Promise<void> {
    const now = Date.now();
    const from = subscription.lastCheckTimestamp;
    const to = now;

    try {
      const signals = await this.analyticsClient.generateSignals(
        subscription.provider,
        subscription.symbol,
        subscription.interval,
        from,
        to,
        subscription.strategyId
      );

      if (signals.length > 0) {
        this.logger.info(
          `Found ${signals.length} new signals for ${subscription.symbol}:${subscription.interval}:${subscription.strategyId}`
        );

        // Broadcast each signal to subscribers
        for (const signal of signals) {
          this.broadcastSignal(subscription.subscribers, signal);
        }
      }

      // Update last check timestamp
      subscription.lastCheckTimestamp = to;
    } catch (error) {
      this.logger.error(
        `Failed to fetch signals for ${subscription.symbol}:${subscription.interval}:${subscription.strategyId}:`,
        error
      );
    }
  }

  /**
   * Broadcast a signal to a set of subscribers
   */
  private broadcastSignal(subscribers: Set<WebSocket>, signal: Signal): void {
    const message: ServerMessage = {
      type: 'signal_update',
      payload: signal,
    };

    const messageStr = JSON.stringify(message);

    for (const socket of subscribers) {
      if ((socket as any).readyState === (socket as any).OPEN) {
        (socket as any).send(messageStr);
      }
    }
  }

  /**
   * Create subscription key
   */
  private makeKey(symbol: string, interval: Interval, strategyId: string): SignalSubscriptionKey {
    return `${symbol}:${interval}:${strategyId}`;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get total subscriber count
   */
  getSubscriberCount(): number {
    let count = 0;
    for (const subscription of this.subscriptions.values()) {
      count += subscription.subscribers.size;
    }
    return count;
  }
}
