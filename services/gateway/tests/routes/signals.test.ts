import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerSignalRoutes } from '../../src/routes/signals.js';
import { AnalyticsClient } from '../../src/clients/analyticsClient.js';

describe('Signal Routes', () => {
  let app: FastifyInstance;
  let mockAnalyticsClient: AnalyticsClient;

  beforeEach(async () => {
    mockAnalyticsClient = {
      generateSignals: vi.fn(),
    } as any;

    app = Fastify();
    await registerSignalRoutes(app, mockAnalyticsClient);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /signals', () => {
    it('should return trading signals for valid request', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy',
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue(mockSignals);

      const response = await app.inject({
        method: 'POST',
        url: '/signals',
        payload: {
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          strategyId: 'ema_crossover_rsi',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ signals: mockSignals });
      expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledWith(
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/signals',
        payload: {
          symbol: 'BTC/USDT',
          // Missing interval, from, to, strategyId
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 if analytics service fails', async () => {
      vi.mocked(mockAnalyticsClient.generateSignals).mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/signals',
        payload: {
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          strategyId: 'ema_crossover_rsi',
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should handle different strategy IDs', async () => {
      const strategies = ['ema_crossover_rsi', 'macd_signal', 'bollinger_breakout'];

      for (const strategyId of strategies) {
        vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue([]);

        const response = await app.inject({
          method: 'POST',
          url: '/signals',
          payload: {
            symbol: 'ETH/USDT',
            interval: '5m',
            from: 1000000,
            to: 2000000,
            strategyId,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(mockAnalyticsClient.generateSignals).toHaveBeenCalledWith(
          'ETH/USDT',
          '5m',
          1000000,
          2000000,
          strategyId
        );
      }
    });

    it('should return hold signals', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'hold',
          confidence: 0.5,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue(mockSignals);

      const response = await app.inject({
        method: 'POST',
        url: '/signals',
        payload: {
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          strategyId: 'ema_crossover_rsi',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().signals[0].action).toBe('hold');
    });

    it('should return empty signals for no data', async () => {
      vi.mocked(mockAnalyticsClient.generateSignals).mockResolvedValue([]);

      const response = await app.inject({
        method: 'POST',
        url: '/signals',
        payload: {
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          strategyId: 'ema_crossover_rsi',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ signals: [] });
    });
  });
});
