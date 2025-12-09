import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockProvider } from '../src/providers/mock';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  afterEach(async () => {
    await provider.disconnect();
  });

  it('should connect successfully', async () => {
    await provider.connect();
    expect(provider.isConnected()).toBe(true);
  });

  it('should disconnect successfully', async () => {
    await provider.connect();
    await provider.disconnect();
    expect(provider.isConnected()).toBe(false);
  });

  it('should generate historical candles', async () => {
    await provider.connect();

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const candles = await provider.getHistoricalCandles('BTC/USDT', '1m', oneHourAgo, now);

    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0].symbol).toBe('BTC/USDT');
    expect(candles[0].interval).toBe('1m');
    expect(candles[0].open).toBeGreaterThan(0);
    expect(candles[0].high).toBeGreaterThanOrEqual(candles[0].open);
    expect(candles[0].low).toBeLessThanOrEqual(candles[0].open);
  });

  it('should emit candle events when subscribed', async () => {
    await provider.connect();

    const candlePromise = new Promise((resolve) => {
      provider.on('candle', (candle) => {
        resolve(candle);
      });
    });

    await provider.subscribeCandles('BTC/USDT', '1m');

    const candle = await Promise.race([
      candlePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
    ]);

    expect(candle).toBeDefined();
    expect((candle as any).symbol).toBe('BTC/USDT');
  });

  it('should track subscriptions', async () => {
    await provider.connect();
    await provider.subscribeCandles('BTC/USDT', '1m');

    const subscriptions = provider.getSubscriptions('BTC/USDT');
    expect(subscriptions.has('1m')).toBe(true);
  });

  it('should unsubscribe from candles', async () => {
    await provider.connect();
    await provider.subscribeCandles('BTC/USDT', '1m');
    await provider.unsubscribeCandles('BTC/USDT', '1m');

    const subscriptions = provider.getSubscriptions('BTC/USDT');
    expect(subscriptions.has('1m')).toBe(false);
  });
});
