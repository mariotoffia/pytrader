import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketDataClient } from '../../src/clients/marketDataClient.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('MarketDataClient', () => {
  let client: MarketDataClient;
  const baseUrl = 'http://localhost:4000';

  beforeEach(() => {
    client = new MarketDataClient(baseUrl);
    vi.resetAllMocks();
  });

  describe('getCandles', () => {
    it('should fetch candles successfully', async () => {
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

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ candles: mockCandles }),
      } as Response);

      const candles = await client.getCandles('BTC/USDT', '1m', 1000000, 2000000);

      expect(candles).toEqual(mockCandles);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/internal/candles?')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('symbol=BTC%2FUSDT')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=1m')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('from=1000000')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('to=2000000')
      );
    });

    it('should throw error on failed response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(
        client.getCandles('BTC/USDT', '1m', 1000000, 2000000)
      ).rejects.toThrow('Market Data Service error: Internal Server Error');
    });

    it('should handle empty candle array', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ candles: [] }),
      } as Response);

      const candles = await client.getCandles('BTC/USDT', '1m', 1000000, 2000000);

      expect(candles).toEqual([]);
    });

    it('should build correct URL with query parameters', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ candles: [] }),
      } as Response);

      await client.getCandles('ETH/USDT', '5m', 5000000, 6000000);

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/internal/candles?symbol=ETH%2FUSDT&interval=5m&from=5000000&to=6000000`
      );
    });
  });

  describe('getLatestCandle', () => {
    it('should fetch latest candle successfully', async () => {
      const mockCandle = {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ candle: mockCandle }),
      } as Response);

      const candle = await client.getLatestCandle('BTC/USDT', '1m');

      expect(candle).toEqual(mockCandle);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/internal/latest-candle?')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('symbol=BTC%2FUSDT')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=1m')
      );
    });

    it('should return null for 404 response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const candle = await client.getLatestCandle('BTC/USDT', '1m');

      expect(candle).toBeNull();
    });

    it('should throw error for non-404 error responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(
        client.getLatestCandle('BTC/USDT', '1m')
      ).rejects.toThrow('Market Data Service error: Internal Server Error');
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(true);
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/health`);
    });

    it('should return false for failed health check', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response);

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false for network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in getCandles', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        client.getCandles('BTC/USDT', '1m', 1000000, 2000000)
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors in getCandles', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(
        client.getCandles('BTC/USDT', '1m', 1000000, 2000000)
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle network errors in getLatestCandle', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        client.getLatestCandle('BTC/USDT', '1m')
      ).rejects.toThrow('Network error');
    });
  });
});
