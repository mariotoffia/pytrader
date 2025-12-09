import { SocketStream } from '@fastify/websocket';
import { Interval } from '@pytrader/shared/types';

/**
 * Subscription key format: "symbol:interval"
 */
type SubscriptionKey = string;

/**
 * Manages WebSocket client sessions and their subscriptions
 */
export class SessionManager {
  // Map: connection -> Set of subscription keys
  private subscriptions = new Map<SocketStream, Set<SubscriptionKey>>();

  // Map: subscription key -> Set of connections
  private subscribers = new Map<SubscriptionKey, Set<SocketStream>>();

  /**
   * Register a new client connection
   */
  addClient(socket: SocketStream): void {
    this.subscriptions.set(socket, new Set());
  }

  /**
   * Remove a client connection and clean up subscriptions
   */
  removeClient(socket: SocketStream): void {
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
  }

  /**
   * Subscribe a client to candles for a symbol/interval
   */
  subscribeCandles(socket: SocketStream, symbol: string, interval: Interval): void {
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
  unsubscribeCandles(socket: SocketStream, symbol: string, interval: Interval): void {
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
  getSubscribers(symbol: string, interval: Interval): Set<SocketStream> {
    const key = this.makeKey(symbol, interval);
    return this.subscribers.get(key) || new Set();
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(socket: SocketStream): Set<SubscriptionKey> {
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
}
