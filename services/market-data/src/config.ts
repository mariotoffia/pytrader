/**
 * Load and validate market data service configuration from environment variables
 *
 * NOTE: Provider, symbols, and backfill configuration is now managed via
 * data/config.json and the ConfigManager class. Only service-level settings
 * are loaded from environment variables.
 */
export interface ServiceConfig {
  port: number;
  sqlitePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Load service configuration from environment variables
 */
export function loadConfig(): ServiceConfig {
  const config: ServiceConfig = {
    port: parseInt(process.env.PORT || '4001', 10),
    sqlitePath: process.env.SQLITE_PATH || './data/market-data.db',
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  };

  // Emit deprecation warning if old env vars are present
  if (process.env.PROVIDER || process.env.SYMBOLS || process.env.BACKFILL_HOURS) {
    console.warn(
      '[DEPRECATION] PROVIDER, SYMBOLS, BACKFILL_HOURS env vars are deprecated. ' +
        'Configuration is now managed via data/config.json. ' +
        'These environment variables will be ignored.'
    );
  }

  return config;
}
