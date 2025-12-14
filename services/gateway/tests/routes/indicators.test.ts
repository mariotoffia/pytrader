import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerIndicatorRoutes } from '../../src/routes/indicators.js';
import { AnalyticsClient } from '../../src/clients/analyticsClient.js';

describe('Indicator Routes', () => {
  let app: FastifyInstance;
  let mockAnalyticsClient: AnalyticsClient;

  beforeEach(async () => {
    mockAnalyticsClient = {
      calculateIndicators: vi.fn(),
    } as any;

    app = Fastify();
    await registerIndicatorRoutes(app, mockAnalyticsClient);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /indicators', () => {
    it('should return calculated indicators for valid request', async () => {
      const mockResults = [
        {
          timestamp: 1000000,
          ema_20: 50000,
          ema_50: 49500,
          rsi_14: 65.5,
        },
      ];

      vi.mocked(mockAnalyticsClient.calculateIndicators).mockResolvedValue(mockResults);

      const response = await app.inject({
        method: 'POST',
        url: '/indicators',
        payload: {
          provider: 'mock',
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          indicators: ['ema_20', 'ema_50', 'rsi_14'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ results: mockResults });
      expect(mockAnalyticsClient.calculateIndicators).toHaveBeenCalledWith(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        ['ema_20', 'ema_50', 'rsi_14'],
        expect.any(Object)
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/indicators',
        payload: {
          symbol: 'BTC/USDT',
          // Missing interval, from, to, indicators
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 if analytics service fails', async () => {
      vi.mocked(mockAnalyticsClient.calculateIndicators).mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/indicators',
        payload: {
          provider: 'mock',
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          indicators: ['ema_20'],
        },
      });

      expect(response.statusCode).toBe(500);
    });

    it('should handle multiple indicators', async () => {
      vi.mocked(mockAnalyticsClient.calculateIndicators).mockResolvedValue([]);

      const response = await app.inject({
        method: 'POST',
        url: '/indicators',
        payload: {
          provider: 'mock',
          symbol: 'ETH/USDT',
          interval: '5m',
          from: 1000000,
          to: 2000000,
          indicators: ['ema_20', 'ema_50', 'rsi_14', 'bb_upper', 'bb_middle', 'bb_lower'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockAnalyticsClient.calculateIndicators).toHaveBeenCalledWith(
        'mock',
        'ETH/USDT',
        '5m',
        1000000,
        2000000,
        ['ema_20', 'ema_50', 'rsi_14', 'bb_upper', 'bb_middle', 'bb_lower'],
        expect.any(Object)
      );
    });

    it('should return empty results for no data', async () => {
      vi.mocked(mockAnalyticsClient.calculateIndicators).mockResolvedValue([]);

      const response = await app.inject({
        method: 'POST',
        url: '/indicators',
        payload: {
          provider: 'mock',
          symbol: 'BTC/USDT',
          interval: '1m',
          from: 1000000,
          to: 2000000,
          indicators: ['ema_20'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ results: [] });
    });
  });
});
