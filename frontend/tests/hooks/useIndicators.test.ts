import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIndicators } from '../../src/hooks/useIndicators';

describe('useIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it('should initialize with empty indicators', () => {
    const { result } = renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: [],
      })
    );

    expect(result.current.indicators).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch indicators when candles are empty', () => {
    renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: [],
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fetch indicators when candles are provided', async () => {
    const mockCandles = [
      {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      },
      {
        timestamp: 2000000,
        open: 50500,
        high: 51500,
        low: 49500,
        close: 51000,
        volume: 120,
      },
    ];

    const mockIndicators = {
      results: [
        { timestamp: 1000000, ema_20: 50200, ema_50: 50000, rsi_14: 65 },
        { timestamp: 2000000, ema_20: 50600, ema_50: 50200, rsi_14: 70 },
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockIndicators,
    } as Response);

    const { result } = renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: mockCandles,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/indicators',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Request-Id': expect.any(String),
        }),
        body: expect.stringContaining('ema_20'),
      })
    );
  });

  it('should group indicators by name', async () => {
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

    const mockIndicators = {
      results: [
        { timestamp: 1000000, ema_20: 50200 },
        { timestamp: 1000000, ema_50: 50000 },
        { timestamp: 1000000, rsi_14: 65 },
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockIndicators,
    } as Response);

    const { result } = renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: mockCandles,
      })
    );

    await waitFor(() => {
      expect(result.current.indicators).toBeDefined();
      expect(Object.keys(result.current.indicators).length).toBeGreaterThan(0);
    });
  });

  it('should handle fetch errors', async () => {
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
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: mockCandles,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.indicators).toEqual({});
  });

  it('should refetch when candles change', async () => {
    const mockCandles1 = [
      {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      },
    ];

    const mockCandles2 = [
      {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      },
      {
        timestamp: 2000000,
        open: 50500,
        high: 51500,
        low: 49500,
        close: 51000,
        volume: 120,
      },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    const { rerender } = renderHook(
      ({ candles }) =>
        useIndicators({
          provider: 'mock',
          symbol: 'BTC/USDT',
          interval: '1m',
          gatewayUrl: 'http://localhost:4000',
          candles,
        }),
      { initialProps: { candles: mockCandles1 } }
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ candles: mockCandles2 });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should send correct request body', async () => {
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
      json: async () => ({ results: [] }),
    } as Response);

    renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: mockCandles,
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]!.body as string);

    expect(requestBody).toEqual({
      provider: 'mock',
      symbol: 'BTC/USDT',
      interval: '1m',
      from: 1000000,
      to: 1000000,
      indicators: ['ema_20', 'ema_50', 'rsi_14', 'bollinger_bands'],
    });
  });

  it('should handle network errors', async () => {
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

    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useIndicators({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        candles: mockCandles,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
