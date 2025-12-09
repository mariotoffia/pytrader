import { describe, it, expect } from 'vitest';
import { normalizeCandle, normalizeCandles } from '../src/normalizer';
import { RawCandle } from '@pytrader/shared/types';

describe('normalizer', () => {
  describe('normalizeCandle', () => {
    it('should normalize a raw candle to OHLCV format', () => {
      const raw: RawCandle = {
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 1234567890000,
        open: 50000,
        high: 50100,
        low: 49900,
        close: 50050,
        volume: 100.5,
      };

      const normalized = normalizeCandle(raw);

      expect(normalized).toEqual({
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 1234567890000,
        open: 50000,
        high: 50100,
        low: 49900,
        close: 50050,
        volume: 100.5,
      });
    });

    it('should handle extra provider-specific fields', () => {
      const raw: RawCandle = {
        symbol: 'ETH/USDT',
        interval: '5m',
        timestamp: 1234567890000,
        open: 3000,
        high: 3100,
        low: 2900,
        close: 3050,
        volume: 50.25,
        trades: 1234, // Extra field
        quoteVolume: 150000, // Extra field
      };

      const normalized = normalizeCandle(raw);

      expect(normalized.symbol).toBe('ETH/USDT');
      expect(normalized.timestamp).toBe(1234567890000);
      expect(normalized).not.toHaveProperty('trades');
      expect(normalized).not.toHaveProperty('quoteVolume');
    });
  });

  describe('normalizeCandles', () => {
    it('should normalize multiple candles', () => {
      const rawCandles: RawCandle[] = [
        {
          symbol: 'BTC/USDT',
          interval: '1m',
          timestamp: 1234567890000,
          open: 50000,
          high: 50100,
          low: 49900,
          close: 50050,
          volume: 100.5,
        },
        {
          symbol: 'BTC/USDT',
          interval: '1m',
          timestamp: 1234567950000,
          open: 50050,
          high: 50150,
          low: 49950,
          close: 50100,
          volume: 110.5,
        },
      ];

      const normalized = normalizeCandles(rawCandles);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].timestamp).toBe(1234567890000);
      expect(normalized[1].timestamp).toBe(1234567950000);
    });

    it('should handle empty array', () => {
      const normalized = normalizeCandles([]);
      expect(normalized).toEqual([]);
    });
  });
});
