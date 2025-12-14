import { useEffect, useRef, useState, useCallback } from 'react';
import { ServerMessage, Interval } from '../types';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: ServerMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  // Track if we're intentionally closing (e.g., during cleanup)
  const isIntentionalCloseRef = useRef(false);
  // Track if connection was ever established (to distinguish StrictMode remount)
  const hadConnectionRef = useRef(false);

  const connect = useCallback(() => {
    // Reset intentional close flag when connecting
    isIntentionalCloseRef.current = false;

    // Prevent multiple simultaneous connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        hadConnectionRef.current = true;
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = () => {
        // Suppress error logging for intentional closes (StrictMode cleanup)
        // and for connection failures during reconnection attempts
        if (isIntentionalCloseRef.current) {
          return;
        }
        // Only log errors for established connections or first connection attempt
        if (hadConnectionRef.current && reconnectAttemptsRef.current === 0) {
          console.warn('WebSocket connection error, will retry...');
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        // Don't attempt to reconnect if this was an intentional close (cleanup)
        if (isIntentionalCloseRef.current) {
          return;
        }

        // Only log disconnection if it was a clean close or we had an established connection
        if (event.wasClean || hadConnectionRef.current) {
          console.log('WebSocket disconnected');
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);
          if (reconnectAttemptsRef.current === 1) {
            console.log(`Reconnecting in ${reconnectInterval}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('Max reconnect attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, onMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    // Mark this as an intentional close to suppress warnings
    isIntentionalCloseRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((symbol: string, interval: Interval) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe_candles',
          payload: { symbol, interval },
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((symbol: string, interval: Interval) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'unsubscribe_candles',
          payload: { symbol, interval },
        })
      );
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // Only run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    reconnectAttempts,
    socket: wsRef.current,
  };
}
