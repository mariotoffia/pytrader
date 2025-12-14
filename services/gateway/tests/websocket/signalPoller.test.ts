import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalPoller } from '../../src/websocket/signalPoller.js';
import { AnalyticsClient } from '../../src/clients/analyticsClient.js';
import pino from 'pino';
import { EventEmitter } from 'events';

// Mock WebSocket socket
class MockSocket extends EventEmitter {
  id: string;
  readyState = 1; // OPEN
  OPEN = 1;
  CLOSED = 3;

  send = vi.fn();

  constructor(id: string) {
    super();
    this.id = id;
  }
}

describe('SignalPoller', () => {
  let poller: SignalPoller;
  let mockAnalyticsClient: AnalyticsClient;
  let logger: pino.Logger;
  let socket1: any;
  let socket2: any;

  beforeEach(() => {
    // Create mock analytics client
    mockAnalyticsClient = {
      generateSignals: vi.fn().mockResolvedValue([]),
    } as any;

    // Create silent logger for tests
    logger = pino({ level: 'silent' });

    // Create poller with short intervals for testing
    poller = new SignalPoller(
      mockAnalyticsClient,
      logger,
      1, // 1 second polling interval
      2 // 2 second lookback
    );

    socket1 = new MockSocket('socket1');
    socket2 = new MockSocket('socket2');
  });

  afterEach(() => {
    poller.stop();
  });

  describe('Lifecycle', () => {
    it('should start polling', () => {
      // Add subscription so polling actually happens
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();
      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalled();
    });

    it('should stop polling', async () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      await new Promise((resolve) => setTimeout(resolve, 10)); // Let initial poll happen

      const callCountBefore = vi.mocked(mockAnalyticsClient.generateSignals).mock.calls.length;

      poller.stop();

      // Wait a bit to ensure no more calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      const callCountAfter = vi.mocked(mockAnalyticsClient.generateSignals).mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
    });

    it('should not start multiple times', () => {
      // Add subscription so polling actually happens
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();
      poller.start(); // Should not throw

      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalled();
    });

    it('should handle stop when not started', () => {
      expect(() => poller.stop()).not.toThrow();
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe client to signals', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(poller.getSubscriptionCount()).toBe(1);
      expect(poller.getSubscriberCount()).toBe(1);
    });

    it('should handle multiple subscriptions from same client', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket1, 'mock', 'ETH/USDT', '5m', 'macd_signal');

      expect(poller.getSubscriptionCount()).toBe(2);
      expect(poller.getSubscriberCount()).toBe(2);
    });

    it('should handle multiple clients subscribing to same signal', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket2, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(poller.getSubscriptionCount()).toBe(1);
      expect(poller.getSubscriberCount()).toBe(2);
    });

    it('should unsubscribe client from signals', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.unsubscribe(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(poller.getSubscriptionCount()).toBe(0);
      expect(poller.getSubscriberCount()).toBe(0);
    });

    it('should only remove specific client when unsubscribing', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket2, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');

      poller.unsubscribe(socket1, 'BTC/USDT', '1m', 'ema_crossover_rsi');

      expect(poller.getSubscriptionCount()).toBe(1);
      expect(poller.getSubscriberCount()).toBe(1);
    });

    it('should remove client from all subscriptions', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket1, 'mock', 'ETH/USDT', '5m', 'macd_signal');

      poller.removeClient(socket1);

      expect(poller.getSubscriptionCount()).toBe(0);
      expect(poller.getSubscriberCount()).toBe(0);
    });

    it('should get client subscriptions', () => {
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket1, 'mock', 'ETH/USDT', '5m', 'macd_signal');

      const subscriptions = poller.getClientSubscriptions(socket1);

      expect(subscriptions.length).toBe(2);
      expect(subscriptions).toContain('BTC/USDT:1m:ema_crossover_rsi');
      expect(subscriptions).toContain('ETH/USDT:5m:macd_signal');
    });

    it('should return empty array for non-subscribed client', () => {
      const subscriptions = poller.getClientSubscriptions(socket1);

      expect(subscriptions).toEqual([]);
    });
  });

  describe('Signal Broadcasting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should broadcast new signals to subscribers', async () => {
      const mockSignals = [
        {
          timestamp: Date.now(),
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy' as const,
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue(mockSignals);

      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      // Wait for the poll to complete
      await vi.runOnlyPendingTimersAsync();

      expect(socket1.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(socket1.send.mock.calls[0][0]);

      expect(sentMessage.type).toBe('signal_update');
      expect(sentMessage.payload).toEqual(mockSignals[0]);
    });

    it('should broadcast to multiple subscribers', async () => {
      const mockSignals = [
        {
          timestamp: Date.now(),
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy' as const,
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue(mockSignals);

      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket2, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      await vi.runOnlyPendingTimersAsync();

      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).toHaveBeenCalled();
    });

    it('should not send to closed sockets', async () => {
      const mockSignals = [
        {
          timestamp: Date.now(),
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy' as const,
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue(mockSignals);

      socket1.readyState = socket1.CLOSED;
      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      await vi.runOnlyPendingTimersAsync();

      expect(socket1.send).not.toHaveBeenCalled();
    });

    it('should skip polling when no subscriptions exist', async () => {
      poller.start();

      await vi.runOnlyPendingTimersAsync();

      // No calls should happen when there are no subscriptions
      expect(mockAnalyticsClient.generateSignals).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle analytics client errors gracefully', async () => {
      vi.mocked(mockAnalyticsClient.generateSignals).mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      // Should not throw
      await expect(vi.runOnlyPendingTimersAsync()).resolves.not.toThrow();
    });

    it('should continue polling other subscriptions after error', async () => {
      vi.mocked(mockAnalyticsClient.generateSignals)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValue([]);

      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.subscribe(socket2, 'mock', 'ETH/USDT', '5m', 'macd_signal');
      poller.start();

      // Wait for both subscription polls to complete
      await vi.waitFor(() => {
        expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledTimes(2);
      });

      // pollSignals() should poll both subscriptions even if one fails
      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledWith(
        'mock',
        'BTC/USDT',
        '1m',
        expect.any(Number),
        expect.any(Number),
        'ema_crossover_rsi'
      );
      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledWith(
        'mock',
        'ETH/USDT',
        '5m',
        expect.any(Number),
        expect.any(Number),
        'macd_signal'
      );
    });
  });

  describe('Time Windows', () => {
    it('should use lookback window for new subscriptions', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      poller.subscribe(socket1, 'mock', 'BTC/USDT', '1m', 'ema_crossover_rsi');
      poller.start();

      // The subscription should have lastCheckTimestamp set to now - lookback (2 seconds)
      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledWith(
        'mock',
        'BTC/USDT',
        '1m',
        expect.any(Number), // from (should be around now - 2000ms)
        expect.any(Number), // to (should be around now)
        'ema_crossover_rsi'
      );
    });
  });
});
