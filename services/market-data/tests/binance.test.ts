import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BinanceProvider } from '../src/providers/binance';
import WebSocket from 'ws';

// Hoist the mock object so it can be used in vi.mock factory
const mocks = vi.hoisted(() => ({
  WebSocket: vi.fn(),
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

describe('BinanceProvider', () => {
  let provider: BinanceProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new BinanceProvider();
  });

  const connectAndGetMock = () => {
    const connectPromise = provider.connect();
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
      expect.stringContaining('"params":["btcusdt@kline_1m"]')
    );
  });

  it('should handle incoming kline messages', async () => {
    const { connectPromise, mockInstance } = connectAndGetMock();
    const onOpen = mockInstance.on.mock.calls.find((call: any) => call[0] === 'open')[1];
    onOpen();
    await connectPromise;

    const candlePromise = new Promise((resolve) => {
      provider.on('candle', resolve);
    });

    await provider.subscribeCandles('BTC/USDT', '1m');

    // Simulate kline message
    const onMessage = mockInstance.on.mock.calls.find((call: any) => call[0] === 'message')[1];
    const klineMsg = {
      e: 'kline',
      E: 1638316800000,
      s: 'BTCUSDT',
      k: {
        t: 1638316800000,
        T: 1638316859999,
        s: 'BTCUSDT',
        i: '1m',
        f: 100,
        L: 200,
        o: '50000.00',
        c: '50100.00',
        h: '50200.00',
        l: '49900.00',
        v: '10.5',
        n: 50,
        x: false,
        q: '500000.00',
        V: '5.0',
        Q: '250000.00',
        B: '0',
      },
    };

    onMessage(JSON.stringify(klineMsg));

    const candle: any = await candlePromise;
    expect(candle.symbol).toBe('BTC/USDT');
    expect(candle.close).toBe(50100.0);
    expect(candle.volume).toBe(10.5);
  });

  it('should fetch historical candles', async () => {
    const mockResponse = [
      [1638316800000, '50000.00', '50200.00', '49900.00', '50100.00', '10.5', 1638316859999],
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
    expect(candles[0].close).toBe(50100.0);
    expect(candles[0].timestamp).toBe(1638316800000);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('symbol=BTCUSDT'));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('interval=1m'));
  });
});
