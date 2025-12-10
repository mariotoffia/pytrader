import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerCandleRoutes } from '../../src/routes/candles.js';
import { MarketDataClient } from '../../src/clients/marketDataClient.js';

describe('Candle Routes', () => {
  let app: FastifyInstance;
  let mockMarketDataClient: MarketDataClient;

  beforeEach(async () => {
    mockMarketDataClient = {
      getCandles: vi.fn(),
    } as any;

    app = Fastify();
    await registerCandleRoutes(app, mockMarketDataClient);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /candles', () => {
    it('should return candles for valid request', async () => {
      const mockCandles = [
        {
          timestamp: 1000000,
          open: 50000,
          high: 51000,
          low: 49000,
          close: 50500,
          volume: 100,
        },
      ];

      vi.mocked(mockMarketDataClient.getCandles).mockResolvedValue(mockCandles);

      const response = await app.inject({
        method: 'GET',
        url: '/candles?symbol=BTC/USDT&interval=1m&from=1000000&to=2000000',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ candles: mockCandles });
      expect(mockMarketDataClient.getCandles).toHaveBeenCalledWith(
        'BTC/USDT',
        '1m',
        1000000,
        2000000
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/candles?symbol=BTC/USDT',
        // Missing interval, from, to
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 if market data service fails', async () => {
      vi.mocked(mockMarketDataClient.getCandles).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/candles?symbol=BTC/USDT&interval=1m&from=1000000&to=2000000',
      });

      expect(response.statusCode).toBe(500);
    });

    it('should handle different intervals', async () => {
      const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

      for (const interval of intervals) {
        vi.mocked(mockMarketDataClient.getCandles).mockResolvedValue([]);

        const response = await app.inject({
          method: 'GET',
          url: `/candles?symbol=ETH/USDT&interval=${interval}&from=1000000&to=2000000`,
        });

        expect(response.statusCode).toBe(200);
      }
    });
  });
});
