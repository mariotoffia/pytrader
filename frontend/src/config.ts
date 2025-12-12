/**
 * Centralized configuration for the frontend application
 * Uses Vite environment variables (import.meta.env)
 *
 * Environment variables must be prefixed with VITE_ to be exposed to the client
 */

interface Config {
  gatewayUrl: string;
  wsUrl: string;
}

const config: Config = {
  // Gateway API URL - defaults to localhost:4000
  gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000',

  // WebSocket URL - defaults to localhost:4000/stream
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4000/stream',
};

// Validate configuration on load
if (!config.gatewayUrl) {
  throw new Error('VITE_GATEWAY_URL is not configured');
}

if (!config.wsUrl) {
  throw new Error('VITE_WS_URL is not configured');
}

export default config;
