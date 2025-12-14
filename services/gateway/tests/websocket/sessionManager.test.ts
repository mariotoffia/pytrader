import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../../src/websocket/sessionManager.js';
import { EventEmitter } from 'events';

// Mock socket for testing
class MockSocket extends EventEmitter {
  id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let socket1: any;
  let socket2: any;

  beforeEach(() => {
    sessionManager = new SessionManager();
    socket1 = new MockSocket('socket1');
    socket2 = new MockSocket('socket2');
  });

  describe('Client Management', () => {
    it('should add client', () => {
      sessionManager.addClient(socket1);

      expect(sessionManager.getConnectionCount()).toBe(1);
      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(0);
    });

    it('should add multiple clients', () => {
      sessionManager.addClient(socket1);
      sessionManager.addClient(socket2);

      expect(sessionManager.getConnectionCount()).toBe(2);
    });

    it('should remove client', () => {
      sessionManager.addClient(socket1);
      sessionManager.removeClient(socket1);

      expect(sessionManager.getConnectionCount()).toBe(0);
    });

    it('should clean up client subscriptions on removal', () => {
      sessionManager.addClient(socket1);
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');

      expect(sessionManager.getSubscriptionCount()).toBe(1);

      sessionManager.removeClient(socket1);

      expect(sessionManager.getSubscriptionCount()).toBe(0);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(0);
    });
  });

  describe('Candle Subscriptions', () => {
    beforeEach(() => {
      sessionManager.addClient(socket1);
      sessionManager.addClient(socket2);
    });

    it('should subscribe client to candles', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');

      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(1);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(1);
    });

    it('should handle multiple subscriptions from same client', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket1, 'ETH/USDT', '5m');
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1h');

      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(3);
      expect(sessionManager.getSubscriptionCount()).toBe(3);
    });

    it('should handle multiple clients subscribing to same symbol/interval', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket2, 'BTC/USDT', '1m');

      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(2);
      expect(sessionManager.getSubscriptionCount()).toBe(1);
    });

    it('should unsubscribe client from candles', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.unsubscribeCandles(socket1, 'BTC/USDT', '1m');

      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(0);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(0);
      expect(sessionManager.getSubscriptionCount()).toBe(0);
    });

    it('should only remove specific client when unsubscribing', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket2, 'BTC/USDT', '1m');

      sessionManager.unsubscribeCandles(socket1, 'BTC/USDT', '1m');

      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(1);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').has(socket2)).toBe(true);
    });

    it('should handle duplicate subscriptions idempotently', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');

      // Should still only have one subscription
      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(1);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(1);
    });

    it('should return empty set for non-existent subscriptions', () => {
      expect(sessionManager.getSubscribers('UNKNOWN', '1m').size).toBe(0);
    });

    it('should handle different intervals for same symbol', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket2, 'BTC/USDT', '5m');

      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(1);
      expect(sessionManager.getSubscribers('BTC/USDT', '5m').size).toBe(1);
      expect(sessionManager.getSubscriptionCount()).toBe(2);
    });
  });

  describe('Signal Subscriptions', () => {
    beforeEach(() => {
      sessionManager.addClient(socket1);
      sessionManager.addClient(socket2);
    });

    it('should subscribe client to signals', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(sessionManager.getClientSignalSubscriptions(socket1).size).toBe(1);
      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        1
      );
    });

    it('should handle multiple signal subscriptions from same client', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.subscribeSignals(socket1, 'ETH/USDT', '5m', 'macd_signal');
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1h', 'bollinger_breakout');

      expect(sessionManager.getClientSignalSubscriptions(socket1).size).toBe(3);
    });

    it('should handle multiple clients subscribing to same signals', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.subscribeSignals(socket2, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        2
      );
    });

    it('should unsubscribe client from signals', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.unsubscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(sessionManager.getClientSignalSubscriptions(socket1).size).toBe(0);
      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        0
      );
    });

    it('should only remove specific client when unsubscribing from signals', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.subscribeSignals(socket2, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      sessionManager.unsubscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        1
      );
      expect(
        sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').has(socket2)
      ).toBe(true);
    });

    it('should clean up signal subscriptions on client removal', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      sessionManager.removeClient(socket1);

      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        0
      );
    });

    it('should handle different strategies for same symbol/interval', () => {
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.subscribeSignals(socket2, 'BTC/USDT', '1m', 'macd_signal');

      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        1
      );
      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'macd_signal').size).toBe(1);
    });

    it('should return empty set for non-existent signal subscriptions', () => {
      expect(sessionManager.getSignalSubscribers('UNKNOWN', '1m', 'unknown_strategy').size).toBe(0);
    });
  });

  describe('Mixed Subscriptions', () => {
    beforeEach(() => {
      sessionManager.addClient(socket1);
    });

    it('should handle both candle and signal subscriptions for same client', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(sessionManager.getClientSubscriptions(socket1).size).toBe(1);
      expect(sessionManager.getClientSignalSubscriptions(socket1).size).toBe(1);
    });

    it('should clean up all subscriptions on client removal', () => {
      sessionManager.subscribeCandles(socket1, 'BTC/USDT', '1m');
      sessionManager.subscribeCandles(socket1, 'ETH/USDT', '5m');
      sessionManager.subscribeSignals(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');
      sessionManager.subscribeSignals(socket1, 'ETH/USDT', '5m', 'macd_signal');

      sessionManager.removeClient(socket1);

      expect(sessionManager.getSubscriptionCount()).toBe(0);
      expect(sessionManager.getConnectionCount()).toBe(0);
      expect(sessionManager.getSubscribers('BTC/USDT', '1m').size).toBe(0);
      expect(sessionManager.getSignalSubscribers('BTC/USDT', '1m', 'ema_crossover_rsi').size).toBe(
        0
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle removing non-existent client gracefully', () => {
      const nonExistentSocket = new MockSocket('non-existent');

      expect(() => sessionManager.removeClient(nonExistentSocket)).not.toThrow();
    });

    it('should handle unsubscribing from non-existent subscription gracefully', () => {
      sessionManager.addClient(socket1);

      expect(() => sessionManager.unsubscribeCandles(socket1, 'BTC/USDT', '1m')).not.toThrow();
    });

    it('should handle getting subscriptions for non-existent client', () => {
      const nonExistentSocket = new MockSocket('non-existent');

      expect(sessionManager.getClientSubscriptions(nonExistentSocket).size).toBe(0);
      expect(sessionManager.getClientSignalSubscriptions(nonExistentSocket).size).toBe(0);
    });
  });
});
