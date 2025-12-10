import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCandles } from '../../src/hooks/useCandles';

describe('useCandles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it('should initialize with empty candles', () => {
    const { result } = renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    expect(result.current.candles).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch historical candles on mount', async () => {
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

    const { result } = renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candles).toEqual(mockCandles);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.candles).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should refetch when symbol changes', async () => {
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
        timestamp: 2000000,
        open: 3000,
        high: 3100,
        low: 2900,
        close: 3050,
        volume: 200,
      },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: mockCandles1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: mockCandles2 }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ symbol }) =>
        useCandles({
          symbol,
          interval: '1m',
          gatewayUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3000/stream',
        }),
      { initialProps: { symbol: 'BTC/USDT' } }
    );

    await waitFor(() => {
      expect(result.current.candles).toEqual(mockCandles1);
    });

    rerender({ symbol: 'ETH/USDT' });

    await waitFor(() => {
      expect(result.current.candles).toEqual(mockCandles2);
    });
  });

  it('should refetch when interval changes', async () => {
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
        timestamp: 2000000,
        open: 50100,
        high: 51100,
        low: 49100,
        close: 50600,
        volume: 150,
      },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: mockCandles1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: mockCandles2 }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ interval }) =>
        useCandles({
          symbol: 'BTC/USDT',
          interval,
          gatewayUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3000/stream',
        }),
      { initialProps: { interval: '1m' as const } }
    );

    await waitFor(() => {
      expect(result.current.candles).toEqual(mockCandles1);
    });

    rerender({ interval: '5m' as const });

    await waitFor(() => {
      expect(result.current.candles).toEqual(mockCandles2);
    });
  });

  it('should build correct API URL with query parameters', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candles: [] }),
    } as Response);

    renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('http://localhost:3000/candles');
    expect(fetchCall).toContain('symbol=BTC%2FUSDT');
    expect(fetchCall).toContain('interval=1m');
    expect(fetchCall).toContain('from=');
    expect(fetchCall).toContain('to=');
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.candles).toEqual([]);
  });

  it('should maintain loading state during fetch', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise as any);

    const { result } = renderHook(() =>
      useCandles({
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/stream',
      })
    );

    // Should be loading initially
    expect(result.current.loading).toBe(true);

    // Resolve the fetch
    resolveFetch({
      ok: true,
      json: async () => ({ candles: [] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
