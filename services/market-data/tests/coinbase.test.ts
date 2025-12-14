import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoinbaseProvider } from '../src/providers/coinbase';
import WebSocket from 'ws';

// Hoist the mock object so it can be used in vi.mock factory
const mocks = vi.hoisted(() => ({
  WebSocket: vi.fn(),
  // We'll create a new instance for each connection, but we can track the last one here if we want
  // Or better, we can just make the mock constructor return a specific object we control
  getLastInstance: vi.fn(),
}));

// Mock WebSocket
vi.mock('ws', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const instance = {
        on: vi.fn(),
        send: vi.fn(),
        close: vi.fn(),
        ping: vi.fn(),
        readyState: 1,
        once: vi.fn().mockImplementation((event, cb) => {
          if (event === 'close') cb();
        }),
      };
      mocks.getLastInstance.mockReturnValue(instance);
      return instance;
    }),
    WebSocket: vi.fn(),
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('CoinbaseProvider', () => {
  let provider: CoinbaseProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new CoinbaseProvider();
  });

  const connectAndGetMock = () => {
    const connectPromise = provider.connect();
    // Get the instance captured by our helper
    const mockInstance = mocks.getLastInstance();
    return { connectPromise, mockInstance };
  };

  afterEach(async () => {
    await provider.disconnect();
  });

  it('should connect successfully', async () => {
    const { connectPromise, mockInstance } = connectAndGetMock();

    // Simulate WS open
    const onOpen = mockInstance.on.mock.calls.find((call: any) => call[0] === 'open')[1];
    onOpen();

    await connectPromise;
    expect(provider.isConnected()).toBe(true);
  });

  it('should format symbol correctly for subscription', async () => {
    const { connectPromise, mockInstance } = connectAndGetMock();
    const onOpen = mockInstance.on.mock.calls.find((call: any) => call[0] === 'open')[1];
    onOpen();
    await connectPromise;

    await provider.subscribeCandles('BTC/USDT', '1m');

    expect(mockInstance.send).toHaveBeenCalledWith(
      expect.stringContaining('"product_ids":["BTC-USDT"]')
    );
  });

  it('should handle incoming ticker messages', async () => {
    const { connectPromise, mockInstance } = connectAndGetMock();
    const onOpen = mockInstance.on.mock.calls.find((call: any) => call[0] === 'open')[1];
    onOpen();
    await connectPromise;

    const candlePromise = new Promise((resolve) => {
      provider.on('candle', resolve);
    });

    await provider.subscribeCandles('BTC/USDT', '1m');

    // Simulate ticker message
    const onMessage = mockInstance.on.mock.calls.find((call: any) => call[0] === 'message')[1];
    const tickerMsg = {
      type: 'ticker',
      product_id: 'BTC-USDT',
      price: '50000.00',
      volume_24h: '1000',
      low_24h: '49000',
      high_24h: '51000',
      volume_30d: '30000',
      best_bid: '49999',
      best_ask: '50001',
      side: 'buy',
      time: new Date().toISOString(),
      trade_id: 12345,
      last_size: '0.1',
    };

    onMessage(JSON.stringify(tickerMsg));

    const candle: any = await candlePromise;
    expect(candle.symbol).toBe('BTC/USDT');
    expect(candle.close).toBe(50000.0);
  });

  it('should fetch historical candles', async () => {
    const mockResponse = [
      [1638316800, 56000, 57000, 56500, 56800, 100], // time, low, high, open, close, vol
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const candles = await provider.getHistoricalCandles(
      'BTC/USDT',
      '1m',
      1638316800000,
      1638320400000
    );

    expect(candles.length).toBe(1);
    expect(candles[0].symbol).toBe('BTC/USDT');
    expect(candles[0].low).toBe(56000);
    expect(candles[0].timestamp).toBe(1638316800000);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('granularity=60'));
  });
});
