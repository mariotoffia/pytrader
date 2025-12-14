/**
 * Integration tests for new API routes (config, providers, backfill)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../src/config/configManager.js';
import { ProviderManager } from '../src/providers/providerManager.js';
import { CandleDatabase } from '../src/storage/database.js';
import { CandleRepository } from '../src/storage/repository.js';
import { registerConfigRoutes } from '../src/routes/config.js';
import { registerProviderRoutes } from '../src/routes/providers.js';
import { registerBackfillRoutes } from '../src/routes/backfill.js';
import { MultiProviderConfig } from '@pytrader/shared/types';

// Test paths
const TEST_DIR = path.join(process.cwd(), 'tests', 'temp');
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'test-routes-config.json');
const TEST_DB_PATH = path.join(TEST_DIR, 'test-routes.db');

describe('API Routes Integration Tests', () => {
  let fastify: FastifyInstance;
  let configManager: ConfigManager;
  let providerManager: ProviderManager;
  let database: CandleDatabase;
  let repository: CandleRepository;

  beforeEach(async () => {
    // Create temp directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Clean up existing files
    if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

    // Initialize Fastify
    fastify = Fastify({ logger: false });

    // Initialize managers
    configManager = new ConfigManager(TEST_CONFIG_PATH, fastify.log);
    providerManager = new ProviderManager(fastify.log);
    database = new CandleDatabase(TEST_DB_PATH);
    repository = new CandleRepository(database.getDb());

    // Register routes
    await registerConfigRoutes(fastify, configManager, providerManager);
    await registerProviderRoutes(fastify, configManager, providerManager);
    await registerBackfillRoutes(fastify, providerManager, repository);
  });

  afterEach(async () => {
    await fastify.close();
    if (fs.existsSync(TEST_CONFIG_PATH)) fs.unlinkSync(TEST_CONFIG_PATH);
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe('Config Routes', () => {
    describe('GET /internal/config', () => {
      it('should return current configuration', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/config',
        });

        expect(response.statusCode).toBe(200);
        const config = JSON.parse(response.body);
        expect(config.version).toBeDefined();
        expect(config.defaultBackfillHours).toBeDefined();
        expect(config.providers).toBeDefined();
        expect(config.providers.binance).toBeDefined();
        expect(config.providers.coinbase).toBeDefined();
        expect(config.providers.mock).toBeDefined();
      });
    });

    describe('PUT /internal/config', () => {
      it('should update configuration', async () => {
        const newConfig: MultiProviderConfig = {
          version: '1.0.0',
          defaultBackfillHours: 48,
          providers: {
            binance: {
              enabled: true,
              symbols: ['BTC/USDT', 'ETH/USDT'],
              intervals: ['1m', '5m'],
              backfillOnStartup: true,
            },
            coinbase: {
              enabled: false,
              symbols: [],
              intervals: [],
              backfillOnStartup: false,
            },
            mock: {
              enabled: false,
              symbols: [],
              intervals: [],
              backfillOnStartup: false,
            },
          },
        };

        const response = await fastify.inject({
          method: 'PUT',
          url: '/internal/config',
          payload: newConfig,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.success).toBe(true);
        expect(result.config.defaultBackfillHours).toBe(48);
      });

      it('should reject invalid configuration', async () => {
        const invalidConfig = {
          version: 'invalid-version',
          defaultBackfillHours: -1,
          providers: {},
        };

        const response = await fastify.inject({
          method: 'PUT',
          url: '/internal/config',
          payload: invalidConfig,
        });

        expect(response.statusCode).toBe(400);
        const result = JSON.parse(response.body);
        expect(result.error).toBeDefined();
      });

      it('should persist configuration to file', async () => {
        const newConfig: MultiProviderConfig = {
          version: '1.0.0',
          defaultBackfillHours: 72,
          providers: {
            binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
            coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
            mock: {
              enabled: true,
              symbols: ['BTC/USDT'],
              intervals: ['1m'],
              backfillOnStartup: true,
            },
          },
        };

        await fastify.inject({
          method: 'PUT',
          url: '/internal/config',
          payload: newConfig,
        });

        // Verify file was updated
        const fileContent = fs.readFileSync(TEST_CONFIG_PATH, 'utf-8');
        const savedConfig = JSON.parse(fileContent);
        expect(savedConfig.defaultBackfillHours).toBe(72);
      });
    });

    describe('POST /internal/config/reload', () => {
      it('should reload configuration from file', async () => {
        // Manually modify the config file
        const modifiedConfig: MultiProviderConfig = {
          version: '1.0.0',
          defaultBackfillHours: 100,
          providers: {
            binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
            coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
            mock: {
              enabled: true,
              symbols: ['SOL/USDT'],
              intervals: ['1m'],
              backfillOnStartup: false,
            },
          },
        };

        fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(modifiedConfig, null, 2));

        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/config/reload',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.success).toBe(true);
        expect(result.config.defaultBackfillHours).toBe(100);
        expect(result.config.providers.mock.symbols).toContain('SOL/USDT');
      });
    });
  });

  describe('Provider Routes', () => {
    describe('GET /internal/providers', () => {
      it('should return all provider statuses', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.providers).toHaveLength(3);

        const mockProvider = result.providers.find((p: any) => p.name === 'mock');
        expect(mockProvider).toBeDefined();
        expect(mockProvider.enabled).toBeDefined();
        expect(mockProvider.connected).toBeDefined();
        expect(mockProvider.subscriptions).toBeDefined();
      });
    });

    describe('GET /internal/providers/:provider/tickers', () => {
      it('should return supported tickers for binance', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/binance/tickers',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.provider).toBe('binance');
        expect(result.tickers).toContain('BTC/USDT');
        expect(result.tickers).toContain('ETH/USDT');
      });

      it('should return supported tickers for coinbase', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/coinbase/tickers',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.provider).toBe('coinbase');
        expect(result.tickers).toBeDefined();
      });

      it('should return supported tickers for mock', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/mock/tickers',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.provider).toBe('mock');
        expect(result.tickers).toContain('BTC/USDT');
      });

      it('should return 404 for invalid provider', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/invalid/tickers',
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('GET /internal/providers/:provider/intervals', () => {
      it('should return supported intervals', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/binance/intervals',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.provider).toBe('binance');
        expect(result.intervals).toContain('1m');
        expect(result.intervals).toContain('5m');
        expect(result.intervals).toContain('1h');
      });

      it('should return 404 for invalid provider', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/invalid/intervals',
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('GET /internal/providers/:provider/status', () => {
      it('should return specific provider status', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/mock/status',
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.name).toBe('mock');
        expect(result.enabled).toBeDefined();
        expect(result.connected).toBeDefined();
        expect(result.subscriptions).toBeDefined();
      });

      it('should return 404 for invalid provider', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/internal/providers/invalid/status',
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('Backfill Routes', () => {
    beforeEach(async () => {
      // Connect mock provider for backfill tests
      const config: MultiProviderConfig = {
        version: '1.0.0',
        defaultBackfillHours: 24,
        providers: {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: {
            enabled: true,
            symbols: ['BTC/USDT'],
            intervals: ['1m'],
            backfillOnStartup: false,
          },
        },
      };

      await providerManager.applyConfiguration(config.providers);
    });

    describe('POST /internal/backfill', () => {
      it('should perform backfill with hours parameter', async () => {
        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            hours: 1,
          },
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.success).toBe(true);
        expect(result.provider).toBe('mock');
        expect(result.symbol).toBe('BTC/USDT');
        expect(result.interval).toBe('1m');
        expect(result.candlesInserted).toBeGreaterThanOrEqual(0);
        expect(result.candlesFetched).toBeGreaterThanOrEqual(0);
        expect(result.duration).toBeGreaterThanOrEqual(0);
      });

      it('should perform backfill with from/to parameters', async () => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            from: oneHourAgo,
            to: now,
          },
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.success).toBe(true);
        expect(result.timeRange.from).toBe(oneHourAgo);
        expect(result.timeRange.to).toBe(now);
      });

      it('should reject invalid request (missing time parameters)', async () => {
        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            // Missing hours AND from/to
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should reject invalid request (both hours AND from/to)', async () => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            hours: 1,
            from: oneHourAgo,
            to: now,
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 for invalid provider (validation error)', async () => {
        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'invalid',
            symbol: 'BTC/USDT',
            interval: '1m',
            hours: 1,
          },
        });

        // Zod validation rejects invalid provider name before route logic
        expect(response.statusCode).toBe(400);
      });

      it('should return 503 for disconnected provider', async () => {
        // Disconnect all providers
        await providerManager.disconnectAll();

        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: '1m',
            hours: 1,
          },
        });

        expect(response.statusCode).toBe(503);
      });

      it('should reject invalid interval', async () => {
        const response = await fastify.inject({
          method: 'POST',
          url: '/internal/backfill',
          payload: {
            provider: 'mock',
            symbol: 'BTC/USDT',
            interval: 'invalid',
            hours: 1,
          },
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
