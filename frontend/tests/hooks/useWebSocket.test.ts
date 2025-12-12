import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  it('should connect to WebSocket', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should send subscribe message when subscribe is called', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const sendSpy = vi.spyOn(result.current.socket!, 'send');

    result.current.subscribe('BTC/USDT', '1m');

    expect(sendSpy).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'subscribe_candles',
        payload: { symbol: 'BTC/USDT', interval: '1m' },
      })
    );
  });

  it('should send unsubscribe message when unsubscribe is called', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const sendSpy = vi.spyOn(result.current.socket!, 'send');

    result.current.unsubscribe('BTC/USDT', '1m');

    expect(sendSpy).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'unsubscribe_candles',
        payload: { symbol: 'BTC/USDT', interval: '1m' },
      })
    );
  });

  it('should not send messages when socket is not open', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    // Socket is not open yet
    result.current.subscribe('BTC/USDT', '1m');

    // Should not throw or cause errors
    expect(result.current.isConnected).toBe(false);
  });

  it('should clean up on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const closeSpy = vi.spyOn(result.current.socket!, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should have socket reference when connected', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.socket).toBeDefined();
      expect(result.current.socket?.readyState).toBe(1); // OPEN
    });
  });

  it('should accept custom reconnection settings', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        reconnectInterval: 100,
        maxReconnectAttempts: 5,
      })
    );

    expect(result.current.reconnectAttempts).toBe(0);
  });

  it('should handle multiple subscribe calls', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const sendSpy = vi.spyOn(result.current.socket!, 'send');

    result.current.subscribe('BTC/USDT', '1m');
    result.current.subscribe('ETH/USDT', '5m');

    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('should provide working subscribe and unsubscribe methods', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:4000/stream',
        maxReconnectAttempts: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });
});
