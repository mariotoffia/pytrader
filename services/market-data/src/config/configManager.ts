/**
 * ConfigManager - Manages multi-provider configuration for market-data service
 *
 * Responsibilities:
 * - Load config.json on startup (create default if missing)
 * - Migrate from .env on first run
 * - Validate all config updates with Zod
 * - Atomic file writes (tmp file + rename)
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import type { Logger } from 'pino';
import {
  MultiProviderConfig,
  ProviderConfig,
  DataProvider,
} from '../../../../shared/types/index.js';
import { MultiProviderConfigSchema } from '../../../../shared/schemas/index.js';

/**
 * Default configuration used when creating config.json for the first time
 */
const DEFAULT_CONFIG: MultiProviderConfig = {
  version: '1.0.0',
  defaultBackfillHours: 24,
  providers: {
    binance: {
      enabled: false,
      symbols: ['BTC/USDT', 'ETH/USDT'],
      intervals: ['1m', '5m'],
      backfillOnStartup: false,
    },
    coinbase: {
      enabled: false,
      symbols: ['BTC/USDT'],
      intervals: ['1m'],
      backfillOnStartup: false,
    },
    mock: {
      enabled: true,
      symbols: ['BTC/USDT', 'ETH/USDT'],
      intervals: ['1m'],
      backfillOnStartup: true,
    },
  },
};

export class ConfigManager {
  private config: MultiProviderConfig;
  private readonly configPath: string;
  private readonly logger: Logger;

  constructor(configPath: string, logger: Logger) {
    this.configPath = configPath;
    this.logger = logger;
    this.config = this.loadOrCreateConfig();
  }

  /**
   * Get the current configuration
   */
  getConfig(): MultiProviderConfig {
    return this.config;
  }

  /**
   * Get configuration for a specific provider
   */
  getProviderConfig(provider: DataProvider): ProviderConfig {
    return this.config.providers[provider];
  }

  /**
   * Update the configuration
   * Validates, saves to file atomically, and updates in-memory config
   */
  async updateConfig(newConfig: MultiProviderConfig): Promise<void> {
    // Validate with Zod
    const validated = MultiProviderConfigSchema.parse(newConfig);

    // Save to file atomically
    await this.saveConfig(validated);

    // Update in-memory config
    this.config = validated;

    this.logger.info('Configuration updated successfully');
  }

  /**
   * Reload configuration from file
   */
  reloadConfig(): MultiProviderConfig {
    this.logger.info('Reloading configuration from file');
    this.config = this.loadOrCreateConfig();
    return this.config;
  }

  /**
   * Load config from file, or create default if missing
   * Handles migration from .env on first run
   */
  private loadOrCreateConfig(): MultiProviderConfig {
    try {
      // Check if config file exists
      const configExists = this.fileExistsSync(this.configPath);

      if (!configExists) {
        this.logger.info(`Config file not found at ${this.configPath}`);

        // Try to migrate from .env
        const migratedConfig = this.migrateFromEnv();

        if (migratedConfig) {
          this.logger.info('Successfully migrated configuration from .env');
          this.saveConfigSync(migratedConfig);
          return migratedConfig;
        }

        // No .env migration, create default config
        this.logger.info('Creating default configuration');
        this.saveConfigSync(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }

      // Load existing config file
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(fileContent);

      // Validate with Zod
      const validated = MultiProviderConfigSchema.parse(parsedConfig);

      this.logger.info('Configuration loaded successfully');
      return validated;
    } catch (error) {
      this.logger.error({ error }, 'Error loading configuration, using defaults');
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Migrate configuration from .env file
   * Returns null if no relevant env vars found
   */
  private migrateFromEnv(): MultiProviderConfig | null {
    const provider = process.env.PROVIDER as DataProvider | undefined;
    const symbols = process.env.SYMBOLS?.split(',').map((s) => s.trim());
    const backfillHours = process.env.BACKFILL_HOURS
      ? parseInt(process.env.BACKFILL_HOURS, 10)
      : undefined;

    // Check if any relevant env vars exist
    if (!provider && !symbols && !backfillHours) {
      return null;
    }

    this.logger.info('[MIGRATION] Migrating from .env to config.json');
    if (provider) this.logger.info(`[MIGRATION] Provider: ${provider}`);
    if (symbols) this.logger.info(`[MIGRATION] Symbols: ${symbols.join(', ')}`);
    if (backfillHours) this.logger.info(`[MIGRATION] Backfill hours: ${backfillHours}`);

    // Create config based on .env values
    const config: MultiProviderConfig = {
      version: '1.0.0',
      defaultBackfillHours: backfillHours || 24,
      providers: {
        binance: {
          enabled: provider === 'binance',
          symbols: provider === 'binance' && symbols ? symbols : ['BTC/USDT', 'ETH/USDT'],
          intervals: ['1m', '5m'],
          backfillOnStartup: provider === 'binance',
        },
        coinbase: {
          enabled: provider === 'coinbase',
          symbols: provider === 'coinbase' && symbols ? symbols : ['BTC/USDT'],
          intervals: ['1m'],
          backfillOnStartup: provider === 'coinbase',
        },
        mock: {
          enabled: provider === 'mock' || !provider,
          symbols:
            (provider === 'mock' || !provider) && symbols ? symbols : ['BTC/USDT', 'ETH/USDT'],
          intervals: ['1m'],
          backfillOnStartup: provider === 'mock' || !provider,
        },
      },
    };

    this.logger.info(`[MIGRATION] Created config.json at ${this.configPath}`);

    return config;
  }

  /**
   * Save configuration to file atomically
   * Uses tmp file + rename to ensure atomic writes
   */
  private async saveConfig(config: MultiProviderConfig): Promise<void> {
    const tmpPath = `${this.configPath}.tmp`;
    const dirPath = path.dirname(this.configPath);

    try {
      // Ensure directory exists
      await fsPromises.mkdir(dirPath, { recursive: true });

      // Write to temp file
      await fsPromises.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf-8');

      // Atomic rename
      await fsPromises.rename(tmpPath, this.configPath);

      this.logger.debug(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      this.logger.error({ error }, 'Error saving configuration');

      // Clean up tmp file if it exists
      try {
        await fsPromises.unlink(tmpPath);
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Synchronous version of saveConfig for use during initialization
   */
  private saveConfigSync(config: MultiProviderConfig): void {
    const tmpPath = `${this.configPath}.tmp`;
    const dirPath = path.dirname(this.configPath);

    try {
      // Ensure directory exists
      fs.mkdirSync(dirPath, { recursive: true });

      // Write to temp file
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');

      // Atomic rename
      fs.renameSync(tmpPath, this.configPath);

      this.logger.debug(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      this.logger.error({ error }, 'Error saving configuration');

      // Clean up tmp file if it exists
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Check if file exists (synchronous)
   */
  private fileExistsSync(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
