import { GatewayConfig } from '@pytrader/shared/types';
import { GatewayConfigSchema } from '@pytrader/shared/schemas';

/**
 * Load and validate gateway service configuration from environment variables
 */
export function loadConfig(): GatewayConfig {
  const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    marketDataUrl: process.env.MARKET_DATA_URL || 'http://localhost:3001',
    analyticsUrl: process.env.ANALYTICS_URL || 'http://localhost:3002',
    wsMaxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '100', 10),
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  };

  // Validate configuration
  const result = GatewayConfigSchema.safeParse(config);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    throw new Error('Invalid configuration. Check environment variables.');
  }

  return result.data;
}
