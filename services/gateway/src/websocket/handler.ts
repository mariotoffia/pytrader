import { SocketStream } from '@fastify/websocket';
import { FastifyRequest } from 'fastify';
import { SessionManager } from './sessionManager.js';
import { SignalPoller } from './signalPoller.js';
import { ClientMessageSchema } from '@pytrader/shared/schemas';
import { ClientMessage, ErrorMessage, ServerMessage } from '@pytrader/shared/types';
import pino from 'pino';

/**
 * WebSocket message handler
 */
export class WebSocketHandler {
  constructor(
    private sessionManager: SessionManager,
    private logger: pino.Logger,
    private signalPoller?: SignalPoller
  ) {}

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: SocketStream, _request: FastifyRequest): void {
    this.sessionManager.addClient(socket);
    this.logger.info('WebSocket client connected');

    // Handle incoming messages
    socket.on('message', (data: Buffer) => {
      this.handleMessage(socket, data);
    });

    // Handle disconnection
    socket.on('close', () => {
      this.sessionManager.removeClient(socket);
      this.logger.info('WebSocket client disconnected');
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      this.logger.error('WebSocket error:', error);
    });
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(socket: SocketStream, data: Buffer): void {
    try {
      const raw = JSON.parse(data.toString());
      const validationResult = ClientMessageSchema.safeParse(raw);

      if (!validationResult.success) {
        this.sendError(socket, 'Invalid message format', 'INVALID_MESSAGE');
        return;
      }

      const message = validationResult.data as ClientMessage;

      switch (message.type) {
        case 'subscribe_candles':
          this.handleSubscribeCandles(socket, message);
          break;
        case 'unsubscribe_candles':
          this.handleUnsubscribeCandles(socket, message);
          break;
        case 'subscribe_signals':
          this.handleSubscribeSignals(socket, message);
          break;
        case 'unsubscribe_signals':
          this.handleUnsubscribeSignals(socket, message);
          break;
        default:
          this.sendError(socket, 'Unknown message type', 'UNKNOWN_TYPE');
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.sendError(socket, 'Failed to process message', 'PROCESSING_ERROR');
    }
  }

  /**
   * Handle subscribe to candles
   */
  private handleSubscribeCandles(socket: SocketStream, message: ClientMessage): void {
    if (message.type !== 'subscribe_candles') return;

    const { symbol, interval } = message.payload;
    this.sessionManager.subscribeCandles(socket, symbol, interval);
    this.logger.debug(`Client subscribed to ${symbol} ${interval}`);
  }

  /**
   * Handle unsubscribe from candles
   */
  private handleUnsubscribeCandles(socket: SocketStream, message: ClientMessage): void {
    if (message.type !== 'unsubscribe_candles') return;

    const { symbol, interval } = message.payload;
    this.sessionManager.unsubscribeCandles(socket, symbol, interval);
    this.logger.debug(`Client unsubscribed from ${symbol} ${interval}`);
  }

  /**
   * Handle subscribe to signals (placeholder)
   */
  private handleSubscribeSignals(socket: SocketStream, message: ClientMessage): void {
    if (message.type !== 'subscribe_signals') return;

    const { symbol, interval, strategyId } = message.payload;
    const int = interval || '1m';
    const strategy = strategyId || 'ema_crossover_rsi';

    this.sessionManager.subscribeSignals(socket, symbol, int, strategy);

    // Also subscribe in the signal poller
    if (this.signalPoller) {
      this.signalPoller.subscribe(socket, symbol, int, strategy);
    }

    this.logger.debug(`Client subscribed to signals for ${symbol}:${int}:${strategy}`);
  }

  /**
   * Handle unsubscribe from signals (placeholder)
   */
  private handleUnsubscribeSignals(socket: SocketStream, message: ClientMessage): void {
    if (message.type !== 'unsubscribe_signals') return;

    const { symbol, interval, strategyId } = message.payload;
    const int = interval || '1m';
    const strategy = strategyId || 'ema_crossover_rsi';

    this.sessionManager.unsubscribeSignals(socket, symbol, int, strategy);

    // Also unsubscribe from the signal poller
    if (this.signalPoller) {
      this.signalPoller.unsubscribe(socket, symbol, int, strategy);
    }

    this.logger.debug(`Client unsubscribed from signals for ${symbol}:${int}:${strategy}`);
  }

  /**
   * Send error message to client
   */
  private sendError(socket: SocketStream, message: string, code?: string): void {
    const errorMessage: ErrorMessage = {
      type: 'error',
      payload: { message, code },
    };
    this.sendMessage(socket, errorMessage);
  }

  /**
   * Send message to a specific client
   */
  sendMessage(socket: SocketStream, message: ServerMessage): void {
    if ((socket as any).readyState === (socket as any).OPEN) {
      (socket as any).send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all subscribers of a symbol/interval
   */
  broadcast(symbol: string, interval: string, message: ServerMessage): void {
    const subscribers = this.sessionManager.getSubscribers(symbol, interval as any);
    for (const socket of subscribers) {
      this.sendMessage(socket, message);
    }
  }
}
