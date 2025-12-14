import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsClient } from '../../src/clients/analyticsClient.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('AnalyticsClient', () => {
  let client: AnalyticsClient;
  const baseUrl = 'http://localhost:5000';

  beforeEach(() => {
    client = new AnalyticsClient(baseUrl);
    vi.resetAllMocks();
  });

  describe('calculateIndicators', () => {
    it('should calculate indicators successfully', async () => {
      const mockResults = [
        {
          timestamp: 1000000,
          ema_20: 50000,
          ema_50: 49500,
          rsi_14: 65.5,
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockResults }),
      } as Response);

      const results = await client.calculateIndicators(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        ['ema_20', 'ema_50', 'rsi_14']
      );

      expect(results).toEqual(mockResults);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/internal/indicators`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            from: 1000000,
            to: 2000000,
            indicators: ['ema_20', 'ema_50', 'rsi_14'],
          }),
        })
      );
    });

    it('should throw error on failed response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(
        client.calculateIndicators('mock', 'BTC/USDT', '1m', 1000000, 2000000, ['ema_20'])
      ).rejects.toThrow('Analytics Service error: 500 Internal Server Error');
    });

    it('should handle empty results array', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      const results = await client.calculateIndicators(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        ['ema_20']
      );

      expect(results).toEqual([]);
    });

    it('should handle multiple indicators', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await client.calculateIndicators('mock', 'ETH/USDT', '5m', 5000000, 6000000, [
        'ema_20',
        'ema_50',
        'rsi_14',
        'bb_upper',
        'bb_middle',
        'bb_lower',
      ]);

      const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);

      expect(callBody.indicators).toEqual([
        'ema_20',
        'ema_50',
        'rsi_14',
        'bb_upper',
        'bb_middle',
        'bb_lower',
      ]);
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        client.calculateIndicators('mock', 'BTC/USDT', '1m', 1000000, 2000000, ['ema_20'])
      ).rejects.toThrow('Network error');
    });
  });

  describe('generateSignals', () => {
    it('should generate signals successfully', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy' as const,
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ signals: mockSignals }),
      } as Response);

      const signals = await client.generateSignals(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );

      expect(signals).toEqual(mockSignals);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/internal/signals`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            from: 1000000,
            to: 2000000,
            strategy_id: 'ema_crossover_rsi',
          }),
        })
      );
    });

    it('should throw error on failed response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(
        client.generateSignals('mock', 'BTC/USDT', '1m', 1000000, 2000000, 'invalid_strategy')
      ).rejects.toThrow('Analytics Service error: 400 Bad Request');
    });

    it('should handle empty signals array', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ signals: [] }),
      } as Response);

      const signals = await client.generateSignals(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );

      expect(signals).toEqual([]);
    });

    it('should handle different strategy IDs', async () => {
      const strategies = ['ema_crossover_rsi', 'macd_signal', 'bollinger_breakout'];

      for (const strategyId of strategies) {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          json: async () => ({ signals: [] }),
        } as Response);

        await client.generateSignals('mock', 'ETH/USDT', '5m', 5000000, 6000000, strategyId);

        const callBody = JSON.parse(
          vi.mocked(fetch).mock.calls[vi.mocked(fetch).mock.calls.length - 1][1]
            ?.body as string
        );

        expect(callBody.strategy_id).toBe(strategyId);
      }
    });

    it('should handle buy signals', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'buy' as const,
          confidence: 0.85,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ signals: mockSignals }),
      } as Response);

      const signals = await client.generateSignals(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );

      expect(signals[0].action).toBe('buy');
      expect(signals[0].confidence).toBe(0.85);
    });

    it('should handle sell signals', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'sell' as const,
          confidence: 0.75,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ signals: mockSignals }),
      } as Response);

      const signals = await client.generateSignals(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );

      expect(signals[0].action).toBe('sell');
      expect(signals[0].confidence).toBe(0.75);
    });

    it('should handle hold signals', async () => {
      const mockSignals = [
        {
          timestamp: 1000000,
          symbol: 'BTC/USDT',
          interval: '1m',
          action: 'hold' as const,
          confidence: 0.5,
          strategyId: 'ema_crossover_rsi',
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ signals: mockSignals }),
      } as Response);

      const signals = await client.generateSignals(
        'mock',
        'BTC/USDT',
        '1m',
        1000000,
        2000000,
        'ema_crossover_rsi'
      );

      expect(signals[0].action).toBe('hold');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        client.generateSignals('mock', 'BTC/USDT', '1m', 1000000, 2000000, 'ema_crossover_rsi')
      ).rejects.toThrow('Network error');
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
    it('should handle JSON parse errors in calculateIndicators', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(
        client.calculateIndicators('mock', 'BTC/USDT', '1m', 1000000, 2000000, ['ema_20'])
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle JSON parse errors in generateSignals', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(
        client.generateSignals('mock', 'BTC/USDT', '1m', 1000000, 2000000, 'ema_crossover_rsi')
      ).rejects.toThrow('Invalid JSON');
    });
  });
});
