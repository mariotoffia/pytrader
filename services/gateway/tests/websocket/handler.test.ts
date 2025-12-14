import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketHandler } from '../../src/websocket/handler.js';
import { SessionManager } from '../../src/websocket/sessionManager.js';
import { SignalPoller } from '../../src/websocket/signalPoller.js';
import pino from 'pino';
import { EventEmitter } from 'events';

// Mock WebSocket socket
class MockSocket extends EventEmitter {
  readyState = 1; // OPEN
  OPEN = 1;
  CLOSED = 3;

  send = vi.fn();
  close = vi.fn();
}

describe('WebSocketHandler', () => {
  let handler: WebSocketHandler;
  let mockSessionManager: SessionManager;
  let mockSignalPoller: SignalPoller;
  let logger: pino.Logger;

  beforeEach(() => {
    // Create mock session manager
    mockSessionManager = {
      addClient: vi.fn(),
      removeClient: vi.fn(),
      subscribeCandles: vi.fn(),
      unsubscribeCandles: vi.fn(),
      subscribeSignals: vi.fn(),
      unsubscribeSignals: vi.fn(),
      getSubscribers: vi.fn().mockReturnValue([]),
    } as any;

    // Create mock signal poller
    mockSignalPoller = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as any;

    // Create silent logger for tests
    logger = pino({ level: 'silent' });

    handler = new WebSocketHandler(mockSessionManager, logger, mockSignalPoller);
  });

  describe('handleConnection', () => {
    it('should add client to session manager on connection', () => {
      const socket = new MockSocket() as any;

      handler.handleConnection(socket, {} as any);

      expect(mockSessionManager.addClient).toHaveBeenCalledWith(socket);
    });

    it('should remove client on disconnect', () => {
      const socket = new MockSocket() as any;

      handler.handleConnection(socket, {} as any);
      socket.emit('close');

      expect(mockSessionManager.removeClient).toHaveBeenCalledWith(socket);
    });

    it('should handle socket errors', () => {
      const socket = new MockSocket() as any;
      const error = new Error('Socket error');

      handler.handleConnection(socket, {} as any);

      // Should not throw
      expect(() => socket.emit('error', error)).not.toThrow();
    });
  });

  describe('handleMessage - subscribe_candles', () => {
    it('should subscribe to candles for valid message', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'subscribe_candles',
        payload: { symbol: 'BTC/USDT', interval: '1m' },
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(mockSessionManager.subscribeCandles).toHaveBeenCalledWith(socket, 'BTC/USDT', '1m');
    });

    it('should send error for invalid message format', () => {
      const socket = new MockSocket() as any;
      const invalidMessage = { invalid: 'message' };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(invalidMessage)));

      expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('error'));
      expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('Invalid message format'));
    });
  });

  describe('handleMessage - unsubscribe_candles', () => {
    it('should unsubscribe from candles for valid message', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'unsubscribe_candles',
        payload: { symbol: 'ETH/USDT', interval: '5m' },
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(mockSessionManager.unsubscribeCandles).toHaveBeenCalledWith(socket, 'ETH/USDT', '5m');
    });
  });

  describe('handleMessage - subscribe_signals', () => {
    it('should subscribe to signals for valid message', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'subscribe_signals',
        payload: {
          symbol: 'BTC/USDT',
          interval: '1m',
          strategyId: 'ema_crossover_rsi',
        },
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(mockSessionManager.subscribeSignals).toHaveBeenCalledWith(
        socket,
        'BTC/USDT',
        '1m',
        'ema_crossover_rsi'
      );
      expect(mockSignalPoller.subscribe).toHaveBeenCalledWith(
        socket,
        'BTC/USDT',
        '1m',
        'ema_crossover_rsi'
      );
    });

    it('should use default interval and strategyId if not provided', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'subscribe_signals',
        payload: { symbol: 'BTC/USDT' },
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(mockSessionManager.subscribeSignals).toHaveBeenCalledWith(
        socket,
        'BTC/USDT',
        '1m',
        'ema_crossover_rsi'
      );
    });
  });

  describe('handleMessage - unsubscribe_signals', () => {
    it('should unsubscribe from signals for valid message', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'unsubscribe_signals',
        payload: {
          symbol: 'ETH/USDT',
          interval: '5m',
          strategyId: 'macd_signal',
        },
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(mockSessionManager.unsubscribeSignals).toHaveBeenCalledWith(
        socket,
        'ETH/USDT',
        '5m',
        'macd_signal'
      );
      expect(mockSignalPoller.unsubscribe).toHaveBeenCalledWith(
        socket,
        'ETH/USDT',
        '5m',
        'macd_signal'
      );
    });
  });

  describe('handleMessage - unknown type', () => {
    it('should send error for unknown message type', () => {
      const socket = new MockSocket() as any;
      const message = {
        type: 'unknown_type',
        payload: {},
      };

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from(JSON.stringify(message)));

      expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
  });

  describe('broadcast', () => {
    it('should send message to all subscribers', () => {
      const socket1 = new MockSocket() as any;
      const socket2 = new MockSocket() as any;

      vi.mocked(mockSessionManager.getSubscribers).mockReturnValue([socket1, socket2]);

      const message = {
        type: 'candle_update',
        payload: {
          timestamp: 1000000,
          open: 50000,
          high: 51000,
          low: 49000,
          close: 50500,
          volume: 100,
        },
      };

      handler.broadcast('BTC/USDT', '1m', message as any);

      expect(socket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send to closed sockets', () => {
      const socket = new MockSocket() as any;
      socket.readyState = socket.CLOSED;

      vi.mocked(mockSessionManager.getSubscribers).mockReturnValue([socket]);

      const message = { type: 'candle_update', payload: {} };

      handler.broadcast('BTC/USDT', '1m', message as any);

      expect(socket.send).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message if socket is open', () => {
      const socket = new MockSocket() as any;
      const message = { type: 'candle_update', payload: {} };

      handler.sendMessage(socket, message as any);

      expect(socket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send message if socket is closed', () => {
      const socket = new MockSocket() as any;
      socket.readyState = socket.CLOSED;

      const message = { type: 'candle_update', payload: {} };

      handler.sendMessage(socket, message as any);

      expect(socket.send).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON', () => {
      const socket = new MockSocket() as any;

      handler.handleConnection(socket, {} as any);
      socket.emit('message', Buffer.from('not valid json'));

      expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('error'));
    });

    it('should handle buffer parsing errors gracefully', () => {
      const socket = new MockSocket() as any;

      handler.handleConnection(socket, {} as any);

      // Should not throw
      expect(() => socket.emit('message', Buffer.from(''))).not.toThrow();
    });
  });
});
