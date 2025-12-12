import type { WebSocket } from 'ws';
import { Interval } from '@pytrader/shared/types';

/**
 * Subscription key format: "symbol:interval"
 */
type SubscriptionKey = string;

/**
 * Signal subscription key format: "symbol:interval:strategyId"
 */
type SignalSubscriptionKey = string;

/**
 * Manages WebSocket client sessions and their subscriptions
 */
export class SessionManager {
  // Map: connection -> Set of subscription keys
  private subscriptions = new Map<WebSocket, Set<SubscriptionKey>>();

  // Map: subscription key -> Set of connections
  private subscribers = new Map<SubscriptionKey, Set<WebSocket>>();

  // Map: connection -> Set of signal subscription keys
  private signalSubscriptions = new Map<WebSocket, Set<SignalSubscriptionKey>>();

  // Map: signal subscription key -> Set of connections
  private signalSubscribers = new Map<SignalSubscriptionKey, Set<WebSocket>>();

  /**
   * Register a new client connection
   */
  addClient(socket: WebSocket): void {
    this.subscriptions.set(socket, new Set());
    this.signalSubscriptions.set(socket, new Set());
  }

  /**
   * Remove a client connection and clean up subscriptions
   */
  removeClient(socket: WebSocket): void {
    // Clean up candle subscriptions
    const subs = this.subscriptions.get(socket);
    if (subs) {
      // Remove this socket from all subscription lists
      for (const key of subs) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
          subscribers.delete(socket);
          if (subscribers.size === 0) {
            this.subscribers.delete(key);
          }
        }
      }
    }
    this.subscriptions.delete(socket);

    // Clean up signal subscriptions
    const signalSubs = this.signalSubscriptions.get(socket);
    if (signalSubs) {
      // Remove this socket from all signal subscription lists
      for (const key of signalSubs) {
        const subscribers = this.signalSubscribers.get(key);
        if (subscribers) {
          subscribers.delete(socket);
          if (subscribers.size === 0) {
            this.signalSubscribers.delete(key);
          }
        }
      }
    }
    this.signalSubscriptions.delete(socket);
  }

  /**
   * Subscribe a client to candles for a symbol/interval
   */
  subscribeCandles(socket: WebSocket, symbol: string, interval: Interval): void {
    const key = this.makeKey(symbol, interval);

    // Add to client's subscription set
    const clientSubs = this.subscriptions.get(socket);
    if (clientSubs) {
      clientSubs.add(key);
    }

    // Add client to subscription's subscriber set
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(socket);
  }

  /**
   * Unsubscribe a client from candles
   */
  unsubscribeCandles(socket: WebSocket, symbol: string, interval: Interval): void {
    const key = this.makeKey(symbol, interval);

    // Remove from client's subscription set
    const clientSubs = this.subscriptions.get(socket);
    if (clientSubs) {
      clientSubs.delete(key);
    }

    // Remove client from subscription's subscriber set
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.delete(socket);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }

  /**
   * Get all clients subscribed to a specific symbol/interval
   */
  getSubscribers(symbol: string, interval: Interval): Set<WebSocket> {
    const key = this.makeKey(symbol, interval);
    return this.subscribers.get(key) || new Set();
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(socket: WebSocket): Set<SubscriptionKey> {
    return this.subscriptions.get(socket) || new Set();
  }

  /**
   * Get total number of active connections
   */
  getConnectionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get total number of unique subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscribers.size;
  }

  /**
   * Create subscription key from symbol and interval
   */
  private makeKey(symbol: string, interval: Interval): SubscriptionKey {
    return `${symbol}:${interval}`;
  }

  /**
   * Subscribe a client to signals for a symbol/interval/strategy
   */
  subscribeSignals(
    socket: WebSocket,
    symbol: string,
    interval: Interval,
    strategyId: string
  ): void {
    const key = this.makeSignalKey(symbol, interval, strategyId);

    // Add to client's signal subscription set
    const clientSubs = this.signalSubscriptions.get(socket);
    if (clientSubs) {
      clientSubs.add(key);
    }

    // Add client to signal subscription's subscriber set
    if (!this.signalSubscribers.has(key)) {
      this.signalSubscribers.set(key, new Set());
    }
    this.signalSubscribers.get(key)!.add(socket);
  }

  /**
   * Unsubscribe a client from signals
   */
  unsubscribeSignals(
    socket: WebSocket,
    symbol: string,
    interval: Interval,
    strategyId: string
  ): void {
    const key = this.makeSignalKey(symbol, interval, strategyId);

    // Remove from client's signal subscription set
    const clientSubs = this.signalSubscriptions.get(socket);
    if (clientSubs) {
      clientSubs.delete(key);
    }

    // Remove client from signal subscription's subscriber set
    const subscribers = this.signalSubscribers.get(key);
    if (subscribers) {
      subscribers.delete(socket);
      if (subscribers.size === 0) {
        this.signalSubscribers.delete(key);
      }
    }
  }

  /**
   * Get all clients subscribed to specific signals
   */
  getSignalSubscribers(
    symbol: string,
    interval: Interval,
    strategyId: string
  ): Set<WebSocket> {
    const key = this.makeSignalKey(symbol, interval, strategyId);
    return this.signalSubscribers.get(key) || new Set();
  }

  /**
   * Get all signal subscriptions for a client
   */
  getClientSignalSubscriptions(socket: WebSocket): Set<SignalSubscriptionKey> {
    return this.signalSubscriptions.get(socket) || new Set();
  }

  /**
   * Create signal subscription key from symbol, interval, and strategyId
   */
  private makeSignalKey(
    symbol: string,
    interval: Interval,
    strategyId: string
  ): SignalSubscriptionKey {
    return `${symbol}:${interval}:${strategyId}`;
  }
}
