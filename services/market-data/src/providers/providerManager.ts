/**
 * ProviderManager - Manages multiple data provider instances
 *
 * Responsibilities:
 * - Instantiate and manage all provider classes (Binance, Coinbase, Mock)
 * - Apply configuration changes (connect, disconnect, update subscriptions)
 * - Emit events when provider state changes
 * - Forward candle events from providers
 */

import { EventEmitter } from 'events';
import type { Logger } from 'pino';
import {
  DataProvider as DataProviderType,
  ProviderConfig,
  ProviderStatus,
  ProviderSubscription,
  Interval,
} from '../../../../shared/types/index.js';
import { DataProvider } from './base.js';
import { BinanceProvider } from './binance.js';
import { CoinbaseProvider } from './coinbase.js';
import { MockProvider } from './mock.js';

/**
 * Events emitted by ProviderManager:
 * - 'provider_connected': (provider: DataProviderType) => void
 * - 'provider_disconnected': (provider: DataProviderType) => void
 * - 'provider_error': (provider: DataProviderType, error: Error) => void
 * - 'provider_subscription_changed': (provider: DataProviderType, subscriptions: ProviderSubscription[]) => void
 */
export class ProviderManager extends EventEmitter {
  private providers: Map<DataProviderType, DataProvider> = new Map();
  private readonly logger: Logger;
  // Track current configs for future state management
  // private currentConfigs: Record<DataProviderType, ProviderConfig> = {
  //   binance: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
  //   coinbase: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
  //   mock: { enabled: false, symbols: [], intervals: [], backfillOnStartup: false },
  // };

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.initializeProviders();
  }

  /**
   * Initialize all provider instances
   */
  private initializeProviders(): void {
    this.providers.set('binance', new BinanceProvider());
    this.providers.set('coinbase', new CoinbaseProvider());
    this.providers.set('mock', new MockProvider());

    this.logger.info('Initialized all provider instances');

    // Set up event forwarding from providers
    this.setupProviderEventHandlers();
  }

  /**
   * Set up event handlers for all providers
   * Forwards provider events to consumers
   */
  private setupProviderEventHandlers(): void {
    for (const [name, provider] of this.providers.entries()) {
      provider.on('connected', () => {
        this.logger.info(`Provider ${name} connected`);
        this.emit('provider_connected', name);
      });

      provider.on('disconnected', () => {
        this.logger.info(`Provider ${name} disconnected`);
        this.emit('provider_disconnected', name);
      });

      provider.on('error', (error: Error) => {
        this.logger.error({ provider: name, error }, `Provider ${name} error`);
        this.emit('provider_error', name, error);
      });
    }
  }

  /**
   * Apply configuration to all providers
   * Connects/disconnects providers and updates subscriptions based on config
   */
  async applyConfiguration(
    configs: Record<DataProviderType, ProviderConfig>
  ): Promise<void> {
    this.logger.info('Applying configuration to providers');

    const promises: Promise<void>[] = [];

    for (const providerName of Object.keys(configs) as DataProviderType[]) {
      const config = configs[providerName];
      promises.push(this.updateProvider(providerName, config));
    }

    await Promise.all(promises);

    // this.currentConfigs = configs;
    this.logger.info('Configuration applied to all providers');
  }

  /**
   * Get a specific provider instance
   */
  getProvider(name: DataProviderType): DataProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all provider instances
   */
  getAllProviders(): Map<DataProviderType, DataProvider> {
    return this.providers;
  }

  /**
   * Get status for all providers
   */
  getProviderStatuses(
    configs: Record<DataProviderType, ProviderConfig>
  ): ProviderStatus[] {
    const statuses: ProviderStatus[] = [];

    for (const [name, provider] of this.providers.entries()) {
      const config = configs[name];
      const subscriptions = this.getProviderSubscriptions(provider);

      statuses.push({
        name,
        enabled: config.enabled,
        connected: provider.isConnected(),
        subscriptions,
        errorState: null, // Can be enhanced to track error state
      });
    }

    return statuses;
  }

  /**
   * Disconnect all providers gracefully
   */
  async disconnectAll(): Promise<void> {
    this.logger.info('Disconnecting all providers');

    const promises: Promise<void>[] = [];

    for (const [name, provider] of this.providers.entries()) {
      if (provider.isConnected()) {
        this.logger.info(`Disconnecting ${name}`);
        promises.push(this.disconnectProvider(name, provider));
      }
    }

    await Promise.all(promises);
    this.logger.info('All providers disconnected');
  }

  /**
   * Update a single provider based on configuration
   */
  private async updateProvider(
    name: DataProviderType,
    config: ProviderConfig
  ): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      this.logger.error(`Provider ${name} not found`);
      return;
    }

    const wasConnected = provider.isConnected();

    try {
      if (config.enabled) {
        // Connect if not already connected
        if (!wasConnected) {
          await this.connectProvider(name, provider);
        }

        // Update subscriptions
        await this.updateSubscriptions(name, provider, config);
      } else {
        // Disconnect if currently connected
        if (wasConnected) {
          await this.disconnectProvider(name, provider);
        }
      }
    } catch (error) {
      this.logger.error({ provider: name, error }, `Error updating provider ${name}`);
      throw error;
    }
  }

  /**
   * Connect a provider
   */
  private async connectProvider(
    name: DataProviderType,
    provider: DataProvider
  ): Promise<void> {
    this.logger.info(`Connecting provider ${name}`);

    try {
      await provider.connect();
      this.logger.info(`Provider ${name} connected successfully`);
    } catch (error) {
      this.logger.error({ provider: name, error }, `Failed to connect provider ${name}`);
      throw error;
    }
  }

  /**
   * Disconnect a provider
   */
  private async disconnectProvider(
    name: DataProviderType,
    provider: DataProvider
  ): Promise<void> {
    this.logger.info(`Disconnecting provider ${name}`);

    try {
      await provider.disconnect();
      this.logger.info(`Provider ${name} disconnected successfully`);
    } catch (error) {
      this.logger.error({ provider: name, error }, `Failed to disconnect provider ${name}`);
      throw error;
    }
  }

  /**
   * Update subscriptions for a provider
   * Subscribes to new symbol/interval combinations and unsubscribes from removed ones
   */
  private async updateSubscriptions(
    name: DataProviderType,
    provider: DataProvider,
    config: ProviderConfig
  ): Promise<void> {
    // Build target subscription set from config (symbol × interval combinations)
    const targetSubscriptions = new Set<string>();
    for (const symbol of config.symbols) {
      for (const interval of config.intervals) {
        targetSubscriptions.add(`${symbol}:${interval}`);
      }
    }

    // Get current subscriptions
    const currentSubscriptions = this.getProviderSubscriptions(provider);
    const currentSubscriptionKeys = new Set(
      currentSubscriptions.map((sub) => `${sub.symbol}:${sub.interval}`)
    );

    // Find subscriptions to add and remove
    const toAdd: Array<{ symbol: string; interval: Interval }> = [];
    const toRemove: Array<{ symbol: string; interval: Interval }> = [];

    // Find new subscriptions to add
    for (const key of targetSubscriptions) {
      if (!currentSubscriptionKeys.has(key)) {
        const [symbol, interval] = key.split(':');
        toAdd.push({ symbol, interval: interval as Interval });
      }
    }

    // Find subscriptions to remove
    for (const key of currentSubscriptionKeys) {
      if (!targetSubscriptions.has(key)) {
        const [symbol, interval] = key.split(':');
        toRemove.push({ symbol, interval: interval as Interval });
      }
    }

    // Unsubscribe from removed subscriptions
    for (const { symbol, interval } of toRemove) {
      try {
        await provider.unsubscribeCandles(symbol, interval);
        this.logger.debug(`Unsubscribed ${name} from ${symbol}:${interval}`);
      } catch (error) {
        this.logger.error(
          { provider: name, symbol, interval, error },
          `Error unsubscribing from ${symbol}:${interval}`
        );
      }
    }

    // Subscribe to new subscriptions
    for (const { symbol, interval } of toAdd) {
      try {
        await provider.subscribeCandles(symbol, interval);
        this.logger.debug(`Subscribed ${name} to ${symbol}:${interval}`);
      } catch (error) {
        this.logger.error(
          { provider: name, symbol, interval, error },
          `Error subscribing to ${symbol}:${interval}`
        );
      }
    }

    // Emit subscription changed event if there were changes
    if (toAdd.length > 0 || toRemove.length > 0) {
      const updatedSubscriptions = this.getProviderSubscriptions(provider);
      this.emit('provider_subscription_changed', name, updatedSubscriptions);
      this.logger.info(
        `Provider ${name} subscriptions updated: +${toAdd.length}, -${toRemove.length}`
      );
    }
  }

  /**
   * Get all subscriptions for a provider
   */
  private getProviderSubscriptions(provider: DataProvider): ProviderSubscription[] {
    const subscriptions: ProviderSubscription[] = [];

    // Access the protected subscriptions map through the public method
    // We need to iterate through all possible symbols to get subscriptions
    // Since we can't access the protected map directly, we'll need to track them differently

    // For now, we'll use a workaround by checking the provider's subscription tracking
    // This assumes the provider tracks subscriptions properly
    const subscriptionMap = (provider as any).subscriptions as Map<string, Set<Interval>>;

    if (subscriptionMap) {
      for (const [symbol, intervals] of subscriptionMap.entries()) {
        for (const interval of intervals) {
          subscriptions.push({ symbol, interval });
        }
      }
    }

    return subscriptions;
  }
}
