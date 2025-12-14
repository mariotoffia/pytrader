/**
 * Unit tests for ProviderManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import pino from 'pino';
import { ProviderManager } from '../src/providers/providerManager.js';
import { ProviderConfig } from '@pytrader/shared/types';

// Mock logger
const mockLogger = pino({ level: 'silent' });

describe('ProviderManager', () => {
  let providerManager: ProviderManager;

  beforeEach(() => {
    providerManager = new ProviderManager(mockLogger);
  });

  describe('initialization', () => {
    it('should initialize all provider instances', () => {
      const providers = providerManager.getAllProviders();

      expect(providers.size).toBe(3);
      expect(providers.has('binance')).toBe(true);
      expect(providers.has('coinbase')).toBe(true);
      expect(providers.has('mock')).toBe(true);
    });

    it('should return specific provider', () => {
      const mockProvider = providerManager.getProvider('mock');

      expect(mockProvider).toBeDefined();
      expect(mockProvider).not.toBeNull();
    });

    it('should return undefined for invalid provider', () => {
      const invalid = providerManager.getProvider('invalid' as any);

      expect(invalid).toBeUndefined();
    });
  });

  describe('applyConfiguration', () => {
    it('should connect enabled providers', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        coinbase: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT', 'ETH/USDT'],
          intervals: ['1m', '5m'],
          backfillOnStartup: true,
        },
      };

      await providerManager.applyConfiguration(config);

      const mockProvider = providerManager.getProvider('mock');
      expect(mockProvider?.isConnected()).toBe(true);

      const binanceProvider = providerManager.getProvider('binance');
      expect(binanceProvider?.isConnected()).toBe(false);
    });

    it('should subscribe to configured symbols and intervals', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        coinbase: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT'],
          intervals: ['1m', '5m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(config);

      const mockProvider = providerManager.getProvider('mock');
      const btcSubscriptions = mockProvider?.getSubscriptions('BTC/USDT');

      expect(btcSubscriptions?.has('1m')).toBe(true);
      expect(btcSubscriptions?.has('5m')).toBe(true);
      expect(btcSubscriptions?.size).toBe(2);
    });

    it('should handle multiple symbols', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        coinbase: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
          intervals: ['1m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(config);

      const mockProvider = providerManager.getProvider('mock');

      expect(mockProvider?.getSubscriptions('BTC/USDT').has('1m')).toBe(true);
      expect(mockProvider?.getSubscriptions('ETH/USDT').has('1m')).toBe(true);
      expect(mockProvider?.getSubscriptions('SOL/USDT').has('1m')).toBe(true);
    });

    it('should update subscriptions when config changes', async () => {
      // Initial config with BTC/USDT
      const initialConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        coinbase: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT'],
          intervals: ['1m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(initialConfig);

      // Update config to add ETH/USDT and remove BTC/USDT
      const updatedConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        coinbase: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
        mock: {
          enabled: true,
          symbols: ['ETH/USDT'],
          intervals: ['1m', '5m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(updatedConfig);

      const mockProvider = providerManager.getProvider('mock');

      // BTC/USDT should be unsubscribed
      expect(mockProvider?.getSubscriptions('BTC/USDT').size).toBe(0);

      // ETH/USDT should have both intervals
      expect(mockProvider?.getSubscriptions('ETH/USDT').has('1m')).toBe(true);
      expect(mockProvider?.getSubscriptions('ETH/USDT').has('5m')).toBe(true);
    });

    it('should disconnect provider when disabled', async () => {
      // Enable mock provider first
      const enabledConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT'],
          intervals: ['1m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(enabledConfig);
      expect(providerManager.getProvider('mock')?.isConnected()).toBe(true);

      // Disable mock provider
      const disabledConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        mock: {
          enabled: false,
          symbols: [],
          intervals: [],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(disabledConfig);
      expect(providerManager.getProvider('mock')?.isConnected()).toBe(false);
    });
  });

  describe('getProviderStatuses', () => {
    it('should return status for all providers', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT'],
          intervals: ['1m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(config);

      const statuses = providerManager.getProviderStatuses(config);

      expect(statuses).toHaveLength(3);

      const mockStatus = statuses.find((s) => s.name === 'mock');
      expect(mockStatus?.enabled).toBe(true);
      expect(mockStatus?.connected).toBe(true);
      expect(mockStatus?.subscriptions.length).toBeGreaterThan(0);

      const binanceStatus = statuses.find((s) => s.name === 'binance');
      expect(binanceStatus?.enabled).toBe(false);
      expect(binanceStatus?.connected).toBe(false);
    });

    it('should include subscription information in status', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT', 'ETH/USDT'],
          intervals: ['1m', '5m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(config);

      const statuses = providerManager.getProviderStatuses(config);
      const mockStatus = statuses.find((s) => s.name === 'mock');

      expect(mockStatus?.subscriptions).toHaveLength(4); // 2 symbols × 2 intervals
      expect(mockStatus?.subscriptions).toContainEqual({ symbol: 'BTC/USDT', interval: '1m' });
      expect(mockStatus?.subscriptions).toContainEqual({ symbol: 'BTC/USDT', interval: '5m' });
      expect(mockStatus?.subscriptions).toContainEqual({ symbol: 'ETH/USDT', interval: '1m' });
      expect(mockStatus?.subscriptions).toContainEqual({ symbol: 'ETH/USDT', interval: '5m' });
    });
  });

  describe('disconnectAll', () => {
    it('should disconnect all connected providers', async () => {
      const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
        binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        mock: {
          enabled: true,
          symbols: ['BTC/USDT'],
          intervals: ['1m'],
          backfillOnStartup: false,
        },
      };

      await providerManager.applyConfiguration(config);
      expect(providerManager.getProvider('mock')?.isConnected()).toBe(true);

      await providerManager.disconnectAll();

      expect(providerManager.getProvider('mock')?.isConnected()).toBe(false);
      expect(providerManager.getProvider('binance')?.isConnected()).toBe(false);
      expect(providerManager.getProvider('coinbase')?.isConnected()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit provider_connected event when provider connects', async (ctx) => {
      return new Promise<void>(async (resolve) => {
        providerManager.once('provider_connected', (provider) => {
          expect(provider).toBe('mock');
          resolve();
        });

        const config: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: {
            enabled: true,
            symbols: ['BTC/USDT'],
            intervals: ['1m'],
            backfillOnStartup: false,
          },
        };

        await providerManager.applyConfiguration(config);
      });
    });

    it('should emit provider_disconnected event when provider disconnects', async () => {
      return new Promise<void>(async (resolve) => {
        // First connect
        const enabledConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: {
            enabled: true,
            symbols: ['BTC/USDT'],
            intervals: ['1m'],
            backfillOnStartup: false,
          },
        };

        await providerManager.applyConfiguration(enabledConfig);

        // Set up listener for disconnect
        providerManager.once('provider_disconnected', (provider) => {
          expect(provider).toBe('mock');
          resolve();
        });

        // Disconnect
        const disabledConfig: Record<'binance' | 'coinbase' | 'mock', ProviderConfig> = {
          binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
          mock: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
        };

        await providerManager.applyConfiguration(disabledConfig);
      });
    });
  });
});
