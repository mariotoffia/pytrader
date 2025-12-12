/**
 * Shared TypeScript types for PyTrader
 */

// ============================================================================
// Market Data Types
// ============================================================================

/**
 * Supported trading intervals
 */
export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

/**
 * Canonical OHLCV candlestick data
 */
export interface OHLCVCandle {
  symbol: string;
  interval: Interval;
  timestamp: number;  // Unix timestamp in milliseconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  provider?: string;  // Data source provider (e.g., 'binance', 'coinbase', 'mock')
}

/**
 * Trading symbol information
 */
export interface Symbol {
  symbol: string;        // e.g., "BTC/USDT"
  exchange: string;      // e.g., "binance", "coinbase"
  type: 'crypto' | 'stock' | 'forex';
  baseAsset: string;     // e.g., "BTC"
  quoteAsset: string;    // e.g., "USDT"
}

/**
 * Raw candle data from external provider (before normalization)
 */
export interface RawCandle {
  symbol: string;
  interval: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  provider?: string;  // Data source provider
  [key: string]: any;  // Allow additional provider-specific fields
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Signal action
 */
export type SignalAction = 'buy' | 'sell' | 'hold';

/**
 * Trading signal with strategy metadata
 */
export interface Signal {
  symbol: string;
  timestamp: number;
  action: SignalAction;
  confidence: number;    // 0.0 to 1.0
  price: number;         // Price at which the signal was generated
  strategyId: string;    // e.g., "ema_crossover_rsi"
  metadata?: Record<string, any>;
}

/**
 * Technical indicator names
 */
export type IndicatorName =
  | 'ema_20'
  | 'ema_50'
  | 'ema_200'
  | 'rsi_14'
  | 'macd'
  | 'bollinger_bands'
  | 'volume_sma';

/**
 * Indicator calculation result
 */
export interface IndicatorResult {
  timestamp: number;
  [indicatorName: string]: number | undefined;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

/**
 * Client → Server: Subscribe to candlestick updates
 */
export interface SubscribeCandlesMessage {
  type: 'subscribe_candles';
  payload: {
    symbol: string;
    interval: Interval;
  };
}

/**
 * Client → Server: Unsubscribe from candlestick updates
 */
export interface UnsubscribeCandlesMessage {
  type: 'unsubscribe_candles';
  payload: {
    symbol: string;
    interval: Interval;
  };
}

/**
 * Client → Server: Subscribe to signal updates
 */
export interface SubscribeSignalsMessage {
  type: 'subscribe_signals';
  payload: {
    symbol: string;
    interval?: Interval;
    strategyId?: string;
  };
}

/**
 * Client → Server: Unsubscribe from signal updates
 */
export interface UnsubscribeSignalsMessage {
  type: 'unsubscribe_signals';
  payload: {
    symbol: string;
    interval?: Interval;
    strategyId?: string;
  };
}

/**
 * Server → Client: Candlestick update
 */
export interface CandleUpdateMessage {
  type: 'candle_update';
  payload: OHLCVCandle;
}

/**
 * Server → Client: Signal update
 */
export interface SignalUpdateMessage {
  type: 'signal_update';
  payload: Signal;
}

/**
 * Server → Client: Error message
 */
export interface ErrorMessage {
  type: 'error';
  payload: {
    message: string;
    code?: string;
  };
}

/**
 * All possible client → server messages
 */
export type ClientMessage =
  | SubscribeCandlesMessage
  | UnsubscribeCandlesMessage
  | SubscribeSignalsMessage
  | UnsubscribeSignalsMessage;

/**
 * All possible server → client messages
 */
export type ServerMessage =
  | CandleUpdateMessage
  | SignalUpdateMessage
  | ErrorMessage;

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * GET /candles query parameters
 */
export interface GetCandlesRequest {
  symbol: string;
  interval: Interval;
  from: number;  // Unix timestamp in milliseconds
  to: number;    // Unix timestamp in milliseconds
}

/**
 * GET /candles response
 */
export interface GetCandlesResponse {
  candles: OHLCVCandle[];
}

/**
 * GET /symbols response
 */
export interface GetSymbolsResponse {
  symbols: Symbol[];
}

/**
 * POST /internal/indicators request
 */
export interface CalculateIndicatorsRequest {
  symbol: string;
  interval: Interval;
  from: number;
  to: number;
  indicators: IndicatorName[];
}

/**
 * POST /internal/indicators response
 */
export interface CalculateIndicatorsResponse {
  results: IndicatorResult[];
}

/**
 * POST /internal/signals request
 */
export interface GenerateSignalsRequest {
  symbol: string;
  interval: Interval;
  from: number;
  to: number;
  strategyId: string;
}

/**
 * POST /internal/signals response
 */
export interface GenerateSignalsResponse {
  signals: Signal[];
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Data provider type
 */
export type DataProvider = 'binance' | 'coinbase' | 'mock';

/**
 * Market data service configuration
 */
export interface MarketDataConfig {
  port: number;
  provider: DataProvider;
  sqlitePath: string;
  symbols: string[];  // e.g., ["BTC/USDT", "ETH/USDT"]
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Gateway service configuration
 */
export interface GatewayConfig {
  port: number;
  marketDataUrl: string;
  analyticsUrl: string;
  wsMaxConnections: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Analytics service configuration
 */
export interface AnalyticsConfig {
  port: number;
  marketDataUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: number;
  version?: string;
  uptime?: number;
}
