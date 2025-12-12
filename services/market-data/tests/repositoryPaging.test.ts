import { describe, it, expect, afterEach } from 'vitest';
import { CandleDatabase } from '../src/storage/database';
import { CandleRepository } from '../src/storage/repository';
import { OHLCVCandle } from '@pytrader/shared/types';

describe('CandleRepository paging', () => {
  const db = new CandleDatabase(':memory:');
  const repository = new CandleRepository(db.getDb());

  afterEach(() => {
    repository.deleteAllCandles();
  });

  it('pages forward from cursor (inclusive)', () => {
    const candles: OHLCVCandle[] = [
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 1000,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 1,
      },
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 2000,
        open: 2,
        high: 2,
        low: 2,
        close: 2,
        volume: 2,
      },
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 3000,
        open: 3,
        high: 3,
        low: 3,
        close: 3,
        volume: 3,
      },
    ];

    for (const candle of candles) repository.insertCandle(candle);

    const page = repository.getCandlesPage('binance', 'BTC/USDT', '1m', 2000, 'forward', 10);
    expect(page.map((c) => c.timestamp)).toEqual([2000, 3000]);
  });

  it('pages backward from cursor (inclusive) in ascending order', () => {
    const candles: OHLCVCandle[] = [
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 1000,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 1,
      },
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 2000,
        open: 2,
        high: 2,
        low: 2,
        close: 2,
        volume: 2,
      },
      {
        provider: 'binance',
        symbol: 'BTC/USDT',
        interval: '1m',
        timestamp: 3000,
        open: 3,
        high: 3,
        low: 3,
        close: 3,
        volume: 3,
      },
    ];

    for (const candle of candles) repository.insertCandle(candle);

    const page = repository.getCandlesPage('binance', 'BTC/USDT', '1m', 2000, 'backward', 10);
    expect(page.map((c) => c.timestamp)).toEqual([1000, 2000]);
  });

  it('filters by provider', () => {
    repository.insertCandle({
      provider: 'binance',
      symbol: 'BTC/USDT',
      interval: '1m',
      timestamp: 1000,
      open: 1,
      high: 1,
      low: 1,
      close: 1,
      volume: 1,
    });

    repository.insertCandle({
      provider: 'coinbase',
      symbol: 'BTC/USDT',
      interval: '1m',
      timestamp: 1000,
      open: 10,
      high: 10,
      low: 10,
      close: 10,
      volume: 10,
    });

    const page = repository.getCandlesPage('binance', 'BTC/USDT', '1m', 0, 'forward', 10);
    expect(page).toHaveLength(1);
    expect(page[0].provider).toBe('binance');
  });
});

