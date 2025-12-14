import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSignals } from '../../src/hooks/useSignals';

describe('useSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it('should initialize with empty signals', () => {
    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: null,
        strategyId: 'ema_crossover_rsi',
      })
    );

    expect(result.current.signals).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch historical signals on mount', async () => {
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

    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: null,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.signals).toEqual(mockSignals);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: null,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.signals).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should send correct request body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: null,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]!.body as string);

    expect(requestBody.symbol).toBe('BTC/USDT');
    expect(requestBody.interval).toBe('1m');
    expect(requestBody.provider).toBe('mock');
    expect(requestBody.strategyId).toBe('ema_crossover_rsi');
    expect(requestBody.from).toBeDefined();
    expect(requestBody.to).toBeDefined();
  });

  it('should subscribe to WebSocket when socket is provided', async () => {
    const mockSocket = {
      readyState: 1, // OPEN
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: mockSocket as any,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalled();
    });

    const sendCall = mockSocket.send.mock.calls[0][0];
    const message = JSON.parse(sendCall);

    expect(message).toEqual({
      type: 'subscribe_signals',
      payload: {
        symbol: 'BTC/USDT',
        interval: '1m',
        strategyId: 'ema_crossover_rsi',
      },
    });
  });

  it('should not subscribe when socket is not open', () => {
    const mockSocket = {
      readyState: 0, // CONNECTING
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: mockSocket as any,
        strategyId: 'ema_crossover_rsi',
      })
    );

    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('should handle real-time signal updates', async () => {
    const mockSocket = {
      readyState: 1,
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: mockSocket as any,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the message handler
    const addEventListenerCall = mockSocket.addEventListener.mock.calls.find(
      (call) => call[0] === 'message'
    );
    expect(addEventListenerCall).toBeDefined();

    const messageHandler = addEventListenerCall![1];

    // Simulate receiving a signal update
    const newSignal = {
      timestamp: 2000000,
      symbol: 'BTC/USDT',
      interval: '1m',
      action: 'sell' as const,
      confidence: 0.75,
      strategyId: 'ema_crossover_rsi',
    };

    const messageEvent = {
      data: JSON.stringify({
        type: 'signal_update',
        payload: newSignal,
      }),
    } as MessageEvent;

    messageHandler(messageEvent);

    await waitFor(() => {
      expect(result.current.signals).toHaveLength(1);
      expect(result.current.signals[0]).toEqual(newSignal);
    });
  });

  it('should deduplicate signals', async () => {
    const mockSocket = {
      readyState: 1,
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const existingSignal = {
      timestamp: 1000000,
      symbol: 'BTC/USDT',
      interval: '1m',
      action: 'buy' as const,
      confidence: 0.85,
      strategyId: 'ema_crossover_rsi',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [existingSignal] }),
    } as Response);

    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: mockSocket as any,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(result.current.signals).toHaveLength(1);
    });

    // Get the message handler
    const addEventListenerCall = mockSocket.addEventListener.mock.calls.find(
      (call) => call[0] === 'message'
    );
    const messageHandler = addEventListenerCall![1];

    // Try to add the same signal again
    const messageEvent = {
      data: JSON.stringify({
        type: 'signal_update',
        payload: existingSignal,
      }),
    } as MessageEvent;

    messageHandler(messageEvent);

    await waitFor(() => {
      // Should still only have 1 signal (deduplicated)
      expect(result.current.signals).toHaveLength(1);
    });
  });

  it('should unsubscribe on unmount', async () => {
    const mockSocket = {
      readyState: 1,
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    const { unmount } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: mockSocket as any,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalled();
    });

    unmount();

    // Should send unsubscribe message
    const sendCalls = mockSocket.send.mock.calls;
    const unsubscribeCall = sendCalls.find((call) => {
      const message = JSON.parse(call[0]);
      return message.type === 'unsubscribe_signals';
    });

    expect(unsubscribeCall).toBeDefined();
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSignals({
        provider: 'mock',
        symbol: 'BTC/USDT',
        interval: '1m',
        gatewayUrl: 'http://localhost:4000',
        wsSocket: null,
        strategyId: 'ema_crossover_rsi',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should refetch when symbol changes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ signals: [] }),
    } as Response);

    const { rerender } = renderHook(
      ({ symbol }) =>
        useSignals({
          provider: 'mock',
          symbol,
          interval: '1m',
          gatewayUrl: 'http://localhost:4000',
          wsSocket: null,
          strategyId: 'ema_crossover_rsi',
        }),
      { initialProps: { symbol: 'BTC/USDT' } }
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ symbol: 'ETH/USDT' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
