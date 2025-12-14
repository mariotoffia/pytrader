// Load environment variables from .env file
import 'dotenv/config';

import * as path from 'path';
import * as url from 'url';
import Fastify from 'fastify';
import { CandleDatabase } from './storage/database.js';
import { CandleRepository } from './storage/repository.js';
import { normalizeCandle } from './normalizer.js';
import { registerCandleRoutes } from './routes/candles.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerConfigRoutes } from './routes/config.js';
import { registerProviderRoutes } from './routes/providers.js';
import { registerBackfillRoutes } from './routes/backfill.js';
import { loadConfig } from './config.js';
import { ConfigManager } from './config/configManager.js';
import { ProviderManager } from './providers/providerManager.js';
import { RawCandle, DataProvider as DataProviderType } from '@pytrader/shared/types';

// Get the directory name for ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Market Data Service
 * Ingests market data from multiple providers, normalizes it, and stores in SQLite
 */
class MarketDataService {
  private fastify: ReturnType<typeof Fastify>;
  private database: CandleDatabase;
  private repository: CandleRepository;
  private providerManager: ProviderManager;
  private configManager: ConfigManager;
  private serviceConfig: ReturnType<typeof loadConfig>;

  constructor() {
    this.serviceConfig = loadConfig();

    // Initialize Fastify
    this.fastify = Fastify({
      logger: {
        level: this.serviceConfig.logLevel,
      },
    });

    // Initialize database and repository
    this.database = new CandleDatabase(this.serviceConfig.sqlitePath);
    this.repository = new CandleRepository(this.database.getDb());

    // Initialize configuration manager
    const configPath = path.join(__dirname, '../data/config.json');
    this.configManager = new ConfigManager(configPath, this.fastify.log);

    // Initialize provider manager
    this.providerManager = new ProviderManager(this.fastify.log);

    // Set up provider event handlers
    this.setupProviderHandlers();
  }

  /**
   * Set up provider event handlers for all providers
   */
  private setupProviderHandlers(): void {
    // Set up candle handlers for all providers
    for (const [providerName, provider] of this.providerManager.getAllProviders()) {
      // Handle incoming candles
      provider.on('candle', (rawCandle: RawCandle) => {
        try {
          const candle = normalizeCandle(rawCandle);
          this.repository.insertCandle(candle);
          this.fastify.log.debug(
            `[${providerName}] Stored candle: ${candle.symbol} ${candle.interval} @ ${candle.timestamp}`
          );
        } catch (error) {
          this.fastify.log.error(`[${providerName}] Error storing candle:`, error);
        }
      });

      // Handle provider errors
      provider.on('error', (error: Error) => {
        this.fastify.log.error(`[${providerName}] Provider error:`, error);
      });
    }
  }

  /**
   * Backfill historical data for all enabled providers
   */
  private async backfillHistoricalData(): Promise<void> {
    const multiConfig = this.configManager.getConfig();
    const backfillHours = multiConfig.defaultBackfillHours;

    this.fastify.log.info(`Backfilling ${backfillHours} hours of historical data...`);

    const now = Date.now();
    const from = now - backfillHours * 60 * 60 * 1000;
    const to = now;

    for (const [providerName, providerConfig] of Object.entries(multiConfig.providers)) {
      // Skip if provider not enabled or backfill not requested
      if (!providerConfig.enabled || !providerConfig.backfillOnStartup) {
        continue;
      }

      const provider = this.providerManager.getProvider(providerName as DataProviderType);
      if (!provider) {
        this.fastify.log.warn(`Provider ${providerName} not found, skipping backfill`);
        continue;
      }

      // Skip if provider not connected
      if (!provider.isConnected()) {
        this.fastify.log.warn(`Provider ${providerName} not connected, skipping backfill`);
        continue;
      }

      // Backfill for each symbol/interval combination
      for (const symbol of providerConfig.symbols) {
        for (const interval of providerConfig.intervals) {
          try {
            this.fastify.log.debug(`[${providerName}] Backfilling ${symbol} ${interval}...`);

            // Fetch historical candles
            const rawCandles = await provider.getHistoricalCandles(symbol, interval, from, to);

            // Normalize and store
            const candles = rawCandles.map(normalizeCandle);
            const inserted = this.repository.insertCandles(candles);

            this.fastify.log.info(
              `[${providerName}] Backfilled ${symbol} ${interval}: ${inserted} new candles (${rawCandles.length} total fetched)`
            );
          } catch (error) {
            this.fastify.log.error(
              `[${providerName}] Error backfilling ${symbol} ${interval}:`,
              error
            );
          }
        }
      }
    }

    this.fastify.log.info('Backfill complete');
  }

  /**
   * Register API routes
   */
  private async registerRoutes(): Promise<void> {
    await registerHealthRoutes(this.fastify);
    await registerCandleRoutes(this.fastify, this.repository);
    await registerConfigRoutes(this.fastify, this.configManager, this.providerManager);
    await registerProviderRoutes(this.fastify, this.configManager, this.providerManager);
    await registerBackfillRoutes(this.fastify, this.providerManager, this.repository);
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      // Register routes
      await this.registerRoutes();

      // Apply provider configuration (connects providers and subscribes to symbols/intervals)
      this.fastify.log.info('Applying provider configuration...');
      const multiConfig = this.configManager.getConfig();
      await this.providerManager.applyConfiguration(multiConfig.providers);
      this.fastify.log.info('Provider configuration applied');

      // Backfill historical data
      await this.backfillHistoricalData();

      // Start HTTP server
      await this.fastify.listen({
        port: this.serviceConfig.port,
        host: '0.0.0.0',
      });

      this.fastify.log.info(`Market Data Service listening on port ${this.serviceConfig.port}`);
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

    // Disconnect all providers
    await this.providerManager.disconnectAll();

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
