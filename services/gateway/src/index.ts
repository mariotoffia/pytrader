// Load environment variables from .env file
import 'dotenv/config';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { loadConfig } from './config.js';
import { MarketDataClient } from './clients/marketDataClient.js';
import { AnalyticsClient } from './clients/analyticsClient.js';
import { SessionManager } from './websocket/sessionManager.js';
import { WebSocketHandler } from './websocket/handler.js';
import { SignalPoller } from './websocket/signalPoller.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerSymbolRoutes } from './routes/symbols.js';
import { registerCandleRoutes } from './routes/candles.js';
import { registerIndicatorRoutes } from './routes/indicators.js';
import { registerSignalRoutes } from './routes/signals.js';
import { registerMarketDataRoutes } from './routes/marketData.js';

/**
 * Gateway Service
 * API and WebSocket gateway for client applications
 */
class GatewayService {
  private fastify: ReturnType<typeof Fastify>;
  private config: ReturnType<typeof loadConfig>;
  private marketDataClient: MarketDataClient;
  private analyticsClient: AnalyticsClient;
  private sessionManager: SessionManager;
  private wsHandler: WebSocketHandler;
  private signalPoller: SignalPoller;

  constructor() {
    this.config = loadConfig();

    // Initialize Fastify with WebSocket support
    this.fastify = Fastify({
      logger: {
        level: this.config.logLevel,
      },
    });

    // Initialize clients
    this.marketDataClient = new MarketDataClient(this.config.marketDataUrl);
    this.analyticsClient = new AnalyticsClient(this.config.analyticsUrl);

    // Initialize WebSocket components
    this.sessionManager = new SessionManager();
    this.signalPoller = new SignalPoller(this.analyticsClient, this.fastify.log);
    this.wsHandler = new WebSocketHandler(this.sessionManager, this.fastify.log, this.signalPoller);
  }

  /**
   * Register REST API routes
   */
  private async registerRoutes(): Promise<void> {
    await registerHealthRoutes(this.fastify);
    await registerSymbolRoutes(this.fastify);
    await registerCandleRoutes(this.fastify, this.marketDataClient);
    await registerIndicatorRoutes(this.fastify, this.analyticsClient);
    await registerSignalRoutes(this.fastify, this.analyticsClient);
    await registerMarketDataRoutes(this.fastify, this.marketDataClient);
  }

  /**
   * Register WebSocket routes
   */
  private async registerWebSocket(): Promise<void> {
    await this.fastify.register(websocket);

    this.fastify.get('/stream', { websocket: true }, (socket: any, request: any) => {
      this.wsHandler.handleConnection(socket, request);

      // When a client connects, link them to the signal poller
      // The signal poller will handle broadcasting signals to subscribed clients
      socket.on('close', () => {
        this.signalPoller.removeClient(socket);
      });
    });
  }

  /**
   * Check health of downstream services
   */
  private async checkDownstreamServices(): Promise<void> {
    this.fastify.log.info('Checking downstream services...');

    const marketDataHealthy = await this.marketDataClient.healthCheck();
    if (marketDataHealthy) {
      this.fastify.log.info('✓ Market Data Service is healthy');
    } else {
      this.fastify.log.warn('✗ Market Data Service is not responding');
    }

    const analyticsHealthy = await this.analyticsClient.healthCheck();
    if (analyticsHealthy) {
      this.fastify.log.info('✓ Analytics Service is healthy');
    } else {
      this.fastify.log.warn('✗ Analytics Service is not responding (may not be started yet)');
    }
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      // Register CORS support
      await this.fastify.register(cors, {
        origin: true, // Allow all origins in development
        credentials: true,
      });

      // Register WebSocket support
      await this.registerWebSocket();

      // Register REST routes
      await this.registerRoutes();

      // Check downstream services
      await this.checkDownstreamServices();

      // Start signal polling
      this.signalPoller.start();
      this.fastify.log.info('Signal polling started');

      // Start HTTP server
      await this.fastify.listen({
        port: this.config.port,
        host: '0.0.0.0',
      });

      this.fastify.log.info(`Gateway Service listening on port ${this.config.port}`);
      this.fastify.log.info(`WebSocket endpoint: ws://localhost:${this.config.port}/stream`);
      this.fastify.log.info(`REST API: http://localhost:${this.config.port}`);
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Failed to start service');
      console.error('Failed to start service:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    this.fastify.log.info('Shutting down...');

    // Stop signal polling
    this.signalPoller.stop();

    // Close HTTP server (this also closes all WebSocket connections)
    await this.fastify.close();

    this.fastify.log.info('Shutdown complete');
  }

  /**
   * Get session statistics
   */
  getStats(): { connections: number; subscriptions: number } {
    return {
      connections: this.sessionManager.getConnectionCount(),
      subscriptions: this.sessionManager.getSubscriptionCount(),
    };
  }
}

// Start service
const service = new GatewayService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await service.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await service.stop();
  process.exit(0);
});

// Start service
service.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
