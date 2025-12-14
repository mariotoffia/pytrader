/**
 * Unit tests for ConfigManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { ConfigManager } from '../src/config/configManager.js';
import { MultiProviderConfig } from '@pytrader/shared/types';

// Mock logger
const mockLogger = pino({ level: 'silent' });

// Test config path
const TEST_CONFIG_DIR = path.join(process.cwd(), 'tests', 'temp');
const TEST_CONFIG_PATH = path.join(TEST_CONFIG_DIR, 'test-config.json');

describe('ConfigManager', () => {
  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(TEST_CONFIG_DIR)) {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    }

    // Clean up any existing config file
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }

    // Clear environment variables
    delete process.env.PROVIDER;
    delete process.env.SYMBOLS;
    delete process.env.BACKFILL_HOURS;
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
  });

  describe('constructor and initialization', () => {
    it('should create default config when file does not exist', () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const config = configManager.getConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.defaultBackfillHours).toBe(24);
      expect(config.providers.mock.enabled).toBe(true);
      expect(config.providers.binance.enabled).toBe(false);
      expect(config.providers.coinbase.enabled).toBe(false);
    });

    it('should create config file on disk when it does not exist', () => {
      new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      expect(fs.existsSync(TEST_CONFIG_PATH)).toBe(true);
    });

    it('should load existing config file', () => {
      const testConfig: MultiProviderConfig = {
        version: '1.0.0',
        defaultBackfillHours: 48,
        providers: {
          binance: {
            enabled: true,
            symbols: ['BTC/USDT'],
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

      fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const config = configManager.getConfig();

      expect(config.defaultBackfillHours).toBe(48);
      expect(config.providers.binance.enabled).toBe(true);
      expect(config.providers.binance.symbols).toEqual(['BTC/USDT']);
    });
  });

  describe('.env migration', () => {
    it('should migrate from .env when config file does not exist', () => {
      process.env.PROVIDER = 'binance';
      process.env.SYMBOLS = 'BTC/USDT,ETH/USDT,SOL/USDT';
      process.env.BACKFILL_HOURS = '48';

      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const config = configManager.getConfig();

      expect(config.defaultBackfillHours).toBe(48);
      expect(config.providers.binance.enabled).toBe(true);
      expect(config.providers.binance.symbols).toEqual(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
      expect(config.providers.binance.backfillOnStartup).toBe(true);
      expect(config.providers.mock.enabled).toBe(false);
    });

    it('should handle mock provider migration', () => {
      process.env.PROVIDER = 'mock';
      process.env.SYMBOLS = 'BTC/USDT';

      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const config = configManager.getConfig();

      expect(config.providers.mock.enabled).toBe(true);
      expect(config.providers.mock.symbols).toEqual(['BTC/USDT']);
    });

    it('should handle missing PROVIDER env var', () => {
      process.env.SYMBOLS = 'BTC/USDT';

      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const config = configManager.getConfig();

      // Should default to mock when no provider specified
      expect(config.providers.mock.enabled).toBe(true);
    });
  });

  describe('getProviderConfig', () => {
    it('should return config for specific provider', () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);
      const mockConfig = configManager.getProviderConfig('mock');

      expect(mockConfig.enabled).toBe(true);
      expect(mockConfig.symbols).toBeDefined();
      expect(mockConfig.intervals).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and save to file', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const newConfig: MultiProviderConfig = {
        version: '1.0.0',
        defaultBackfillHours: 72,
        providers: {
          binance: {
            enabled: true,
            symbols: ['BTC/USDT', 'ETH/USDT'],
            intervals: ['1m', '5m', '1h'],
            backfillOnStartup: true,
          },
          coinbase: {
            enabled: true,
            symbols: ['BTC/USDT'],
            intervals: ['1m'],
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

      await configManager.updateConfig(newConfig);

      // Verify in-memory config updated
      const config = configManager.getConfig();
      expect(config.defaultBackfillHours).toBe(72);
      expect(config.providers.binance.enabled).toBe(true);
      expect(config.providers.coinbase.enabled).toBe(true);

      // Verify file was updated
      const fileContent = fs.readFileSync(TEST_CONFIG_PATH, 'utf-8');
      const savedConfig = JSON.parse(fileContent);
      expect(savedConfig.defaultBackfillHours).toBe(72);
    });

    it('should reject invalid configuration', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const invalidConfig = {
        version: 'invalid',
        defaultBackfillHours: -1,
        providers: {},
      } as any;

      await expect(configManager.updateConfig(invalidConfig)).rejects.toThrow();
    });

    it('should perform atomic file writes', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const newConfig: MultiProviderConfig = {
        version: '1.0.0',
        defaultBackfillHours: 36,
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

      await configManager.updateConfig(newConfig);

      // Verify no .tmp file exists after successful write
      expect(fs.existsSync(`${TEST_CONFIG_PATH}.tmp`)).toBe(false);
    });
  });

  describe('reloadConfig', () => {
    it('should reload configuration from file', () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      // Manually modify the config file
      const modifiedConfig: MultiProviderConfig = {
        version: '1.0.0',
        defaultBackfillHours: 100,
        providers: {
          binance: {
            enabled: true,
            symbols: ['SOL/USDT'],
            intervals: ['1m'],
            backfillOnStartup: true,
          },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        },
      };

      fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(modifiedConfig, null, 2));

      // Reload
      const reloadedConfig = configManager.reloadConfig();

      expect(reloadedConfig.defaultBackfillHours).toBe(100);
      expect(reloadedConfig.providers.binance.enabled).toBe(true);
      expect(reloadedConfig.providers.binance.symbols).toEqual(['SOL/USDT']);
    });
  });

  describe('validation', () => {
    it('should validate version format', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const invalidConfig = {
        version: 'invalid-version',
        defaultBackfillHours: 24,
        providers: {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: { enabled: true, symbols: [], intervals: [], backfillOnStartup: false },
        },
      } as any;

      await expect(configManager.updateConfig(invalidConfig)).rejects.toThrow();
    });

    it('should validate backfill hours range', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const invalidConfig = {
        version: '1.0.0',
        defaultBackfillHours: 9000, // Exceeds max (8760)
        providers: {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: { enabled: true, symbols: [], intervals: [], backfillOnStartup: false },
        },
      } as any;

      await expect(configManager.updateConfig(invalidConfig)).rejects.toThrow();
    });

    it('should validate intervals', async () => {
      const configManager = new ConfigManager(TEST_CONFIG_PATH, mockLogger);

      const invalidConfig = {
        version: '1.0.0',
        defaultBackfillHours: 24,
        providers: {
          binance: {
            enabled: true,
            symbols: ['BTC/USDT'],
            intervals: ['invalid'],
            backfillOnStartup: false,
          },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        },
      } as any;

      await expect(configManager.updateConfig(invalidConfig)).rejects.toThrow();
    });
  });
});
