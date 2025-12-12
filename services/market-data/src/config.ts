import { MarketDataConfig } from '@pytrader/shared/types';
import { MarketDataConfigSchema } from '@pytrader/shared/schemas';

/**
 * Load and validate market data service configuration from environment variables
 */
export function loadConfig(): MarketDataConfig {
  const config = {
    port: parseInt(process.env.PORT || '4001', 10),
    provider: (process.env.PROVIDER || 'mock') as 'binance' | 'coinbase' | 'mock',
    sqlitePath: process.env.SQLITE_PATH || './data/market-data.db',
    symbols: (process.env.SYMBOLS || 'BTC/USDT,ETH/USDT').split(',').map(s => s.trim()),
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  };

  // Validate configuration
  const result = MarketDataConfigSchema.safeParse(config);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    throw new Error('Invalid configuration. Check environment variables.');
  }

  return result.data;
}

/**
 * Get backfill hours from environment
 */
export function getBackfillHours(): number {
  return parseInt(process.env.BACKFILL_HOURS || '24', 10);
}
