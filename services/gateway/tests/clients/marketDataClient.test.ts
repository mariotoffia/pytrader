import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketDataClient } from '../../src/clients/marketDataClient.js';
import { UpstreamServiceError } from '../../src/clients/upstreamServiceError.js';

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

      const candles = await client.getCandles('mock', 'BTC/USDT', '1m', 1000000, 2000000);

      expect(candles).toEqual(mockCandles);
      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toContain('/internal/candles?');
      expect(url).toContain('provider=mock');
      expect(url).toContain('symbol=BTC%2FUSDT');
      expect(url).toContain('interval=1m');
      expect(url).toContain('from=1000000');
      expect(url).toContain('to=2000000');
    });

    it('should throw error on failed response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Server Error',
      } as Response);

      await expect(client.getCandles('mock', 'BTC/USDT', '1m', 1000000, 2000000)).rejects.toThrow(
        'Market Data Service error: 500 Internal Server Error'
      );
    });

    it('should handle empty candle array', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ candles: [] }),
      } as Response);

      const candles = await client.getCandles('mock', 'BTC/USDT', '1m', 1000000, 2000000);

      expect(candles).toEqual([]);
    });

    it('should build correct URL with query parameters', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ candles: [] }),
      } as Response);

      await client.getCandles('binance', 'ETH/USDT', '5m', 5000000, 6000000);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toBe(
        `${baseUrl}/internal/candles?provider=binance&symbol=ETH%2FUSDT&interval=5m&from=5000000&to=6000000`
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
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/internal/latest-candle?'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('symbol=BTC%2FUSDT'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('interval=1m'));
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

      await expect(client.getLatestCandle('BTC/USDT', '1m')).rejects.toThrow(
        'Market Data Service error: 500 Internal Server Error'
      );
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

      try {
        await client.getCandles('mock', 'BTC/USDT', '1m', 1000000, 2000000);
        throw new Error('Expected getCandles to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(UpstreamServiceError);
        expect((error as UpstreamServiceError).upstream.status).toBe(0);
        expect((error as UpstreamServiceError).upstream.body).toContain('Network error');
      }
    });

    it('should handle JSON parse errors in getCandles', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(client.getCandles('mock', 'BTC/USDT', '1m', 1000000, 2000000)).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should handle network errors in getLatestCandle', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      try {
        await client.getLatestCandle('BTC/USDT', '1m');
        throw new Error('Expected getLatestCandle to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(UpstreamServiceError);
        expect((error as UpstreamServiceError).upstream.status).toBe(0);
        expect((error as UpstreamServiceError).upstream.body).toContain('Network error');
      }
    });
  });
});
