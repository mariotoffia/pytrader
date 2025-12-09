import Fastify from 'fastify';
import { CandleDatabase } from './storage/database.js';
import { CandleRepository } from './storage/repository.js';
import { DataProvider } from './providers/base.js';
import { MockProvider } from './providers/mock.js';
import { normalizeCandle } from './normalizer.js';
import { registerCandleRoutes } from './routes/candles.js';
import { registerHealthRoutes } from './routes/health.js';
import { loadConfig, getBackfillHours } from './config.js';
import { RawCandle } from '@pytrader/shared/types';

/**
 * Market Data Service
 * Ingests market data from providers, normalizes it, and stores in SQLite
 */
class MarketDataService {
  private fastify: ReturnType<typeof Fastify>;
  private database: CandleDatabase;
  private repository: CandleRepository;
  private provider: DataProvider;
  private config: ReturnType<typeof loadConfig>;

  constructor() {
    this.config = loadConfig();

    // Initialize Fastify
    this.fastify = Fastify({
      logger: {
        level: this.config.logLevel,
      },
    });

    // Initialize database and repository
    this.database = new CandleDatabase(this.config.sqlitePath);
    this.repository = new CandleRepository(this.database.getDb());

    // Initialize provider based on configuration
    this.provider = this.createProvider();

    // Set up provider event handlers
    this.setupProviderHandlers();
  }

  /**
   * Create provider based on configuration
   */
  private createProvider(): DataProvider {
    switch (this.config.provider) {
      case 'mock':
        return new MockProvider();
      case 'binance':
        // TODO: Implement Binance provider
        throw new Error('Binance provider not yet implemented');
      case 'coinbase':
        // TODO: Implement Coinbase provider
        throw new Error('Coinbase provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Set up provider event handlers
   */
  private setupProviderHandlers(): void {
    // Handle incoming candles
    this.provider.on('candle', (rawCandle: RawCandle) => {
      try {
        const candle = normalizeCandle(rawCandle);
        this.repository.insertCandle(candle);
        this.fastify.log.debug(
          `Stored candle: ${candle.symbol} ${candle.interval} @ ${candle.timestamp}`
        );
      } catch (error) {
        this.fastify.log.error('Error storing candle:', error);
      }
    });

    // Handle provider errors
    this.provider.on('error', (error: Error) => {
      this.fastify.log.error('Provider error:', error);
    });
  }

  /**
   * Backfill historical data
   */
  private async backfillHistoricalData(): Promise<void> {
    const backfillHours = getBackfillHours();
    const now = Date.now();
    const from = now - backfillHours * 60 * 60 * 1000;
    const to = now;

    this.fastify.log.info(`Backfilling ${backfillHours} hours of historical data...`);

    for (const symbol of this.config.symbols) {
      try {
        // Fetch historical candles
        const rawCandles = await this.provider.getHistoricalCandles(symbol, '1m', from, to);

        // Normalize and store
        const candles = rawCandles.map(normalizeCandle);
        const inserted = this.repository.insertCandles(candles);

        this.fastify.log.info(
          `Backfilled ${symbol}: ${inserted} new candles (${rawCandles.length} total fetched)`
        );
      } catch (error) {
        this.fastify.log.error(`Error backfilling ${symbol}:`, error);
      }
    }

    this.fastify.log.info('Backfill complete');
  }

  /**
   * Subscribe to real-time data for configured symbols
   */
  private async subscribeToSymbols(): Promise<void> {
    this.fastify.log.info('Subscribing to real-time data...');

    for (const symbol of this.config.symbols) {
      try {
        await this.provider.subscribeCandles(symbol, '1m');
        this.fastify.log.info(`Subscribed to ${symbol} 1m candles`);
      } catch (error) {
        this.fastify.log.error(`Error subscribing to ${symbol}:`, error);
      }
    }
  }

  /**
   * Register API routes
   */
  private async registerRoutes(): Promise<void> {
    await registerHealthRoutes(this.fastify);
    await registerCandleRoutes(this.fastify, this.repository);
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      // Register routes
      await this.registerRoutes();

      // Connect to data provider
      this.fastify.log.info(`Connecting to ${this.config.provider} provider...`);
      await this.provider.connect();
      this.fastify.log.info('Provider connected');

      // Backfill historical data
      await this.backfillHistoricalData();

      // Subscribe to real-time updates
      await this.subscribeToSymbols();

      // Start HTTP server
      await this.fastify.listen({
        port: this.config.port,
        host: '0.0.0.0',
      });

      this.fastify.log.info(`Market Data Service listening on port ${this.config.port}`);
    } catch (error) {
      this.fastify.log.error('Failed to start service:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    this.fastify.log.info('Shutting down...');

    // Disconnect provider
    await this.provider.disconnect();

    // Close database
    this.database.close();

    // Stop HTTP server
    await this.fastify.close();

    this.fastify.log.info('Shutdown complete');
  }
}

// Start service
const service = new MarketDataService();

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
