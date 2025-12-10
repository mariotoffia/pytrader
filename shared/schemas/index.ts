/**
 * Zod validation schemas for PyTrader
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const IntervalSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);

export const SignalActionSchema = z.enum(['buy', 'sell', 'hold']);

export const DataProviderSchema = z.enum(['binance', 'coinbase', 'mock']);

export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

// ============================================================================
// Market Data Schemas
// ============================================================================

export const OHLCVCandleSchema = z.object({
  symbol: z.string().min(1),
  interval: IntervalSchema,
  timestamp: z.number().int().positive(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
}).refine(
  (data) => data.high >= data.low,
  { message: 'High must be >= low' }
).refine(
  (data) => data.high >= data.open && data.high >= data.close,
  { message: 'High must be >= open and close' }
).refine(
  (data) => data.low <= data.open && data.low <= data.close,
  { message: 'Low must be <= open and close' }
);

export const SymbolSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.string().min(1),
  type: z.enum(['crypto', 'stock', 'forex']),
  baseAsset: z.string().min(1),
  quoteAsset: z.string().min(1),
});

export const RawCandleSchema = z.object({
  symbol: z.string().min(1),
  interval: z.string().min(1),
  timestamp: z.number().int(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
}).passthrough(); // Allow additional fields

// ============================================================================
// Analytics Schemas
// ============================================================================

export const SignalSchema = z.object({
  symbol: z.string().min(1),
  timestamp: z.number().int().positive(),
  action: SignalActionSchema,
  confidence: z.number().min(0).max(1),
  strategyId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const IndicatorNameSchema = z.enum([
  'ema_20',
  'ema_50',
  'ema_200',
  'rsi_14',
  'macd',
  'bollinger_bands',
  'volume_sma',
]);

export const IndicatorResultSchema = z.object({
  timestamp: z.number().int().positive(),
}).catchall(z.number().or(z.undefined()));

// ============================================================================
// WebSocket Message Schemas
// ============================================================================

export const SubscribeCandlesMessageSchema = z.object({
  type: z.literal('subscribe_candles'),
  payload: z.object({
    symbol: z.string().min(1),
    interval: IntervalSchema,
  }),
});

export const UnsubscribeCandlesMessageSchema = z.object({
  type: z.literal('unsubscribe_candles'),
  payload: z.object({
    symbol: z.string().min(1),
    interval: IntervalSchema,
  }),
});

export const SubscribeSignalsMessageSchema = z.object({
  type: z.literal('subscribe_signals'),
  payload: z.object({
    symbol: z.string().min(1),
    interval: IntervalSchema.optional(),
    strategyId: z.string().optional(),
  }),
});

export const UnsubscribeSignalsMessageSchema = z.object({
  type: z.literal('unsubscribe_signals'),
  payload: z.object({
    symbol: z.string().min(1),
    interval: IntervalSchema.optional(),
    strategyId: z.string().optional(),
  }),
});

export const CandleUpdateMessageSchema = z.object({
  type: z.literal('candle_update'),
  payload: OHLCVCandleSchema,
});

export const SignalUpdateMessageSchema = z.object({
  type: z.literal('signal_update'),
  payload: SignalSchema,
});

export const ErrorMessageSchema = z.object({
  type: z.literal('error'),
  payload: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  SubscribeCandlesMessageSchema,
  UnsubscribeCandlesMessageSchema,
  SubscribeSignalsMessageSchema,
  UnsubscribeSignalsMessageSchema,
]);

export const ServerMessageSchema = z.discriminatedUnion('type', [
  CandleUpdateMessageSchema,
  SignalUpdateMessageSchema,
  ErrorMessageSchema,
]);

// ============================================================================
// API Request/Response Schemas
// ============================================================================

export const GetCandlesRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: IntervalSchema,
  from: z.number().int().positive(),
  to: z.number().int().positive(),
}).refine(
  (data) => data.to > data.from,
  { message: 'to must be greater than from' }
);

export const GetCandlesResponseSchema = z.object({
  candles: z.array(OHLCVCandleSchema),
});

export const GetSymbolsResponseSchema = z.object({
  symbols: z.array(SymbolSchema),
});

export const CalculateIndicatorsRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: IntervalSchema,
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  indicators: z.array(IndicatorNameSchema).min(1),
}).refine(
  (data) => data.to > data.from,
  { message: 'to must be greater than from' }
);

export const CalculateIndicatorsResponseSchema = z.object({
  results: z.array(IndicatorResultSchema),
});

export const GenerateSignalsRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: IntervalSchema,
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  strategyId: z.string().min(1),
}).refine(
  (data) => data.to > data.from,
  { message: 'to must be greater than from' }
);

export const GenerateSignalsResponseSchema = z.object({
  signals: z.array(SignalSchema),
});

// ============================================================================
// Configuration Schemas
// ============================================================================

export const MarketDataConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  provider: DataProviderSchema,
  sqlitePath: z.string().min(1),
  symbols: z.array(z.string().min(1)).min(1),
  logLevel: LogLevelSchema,
});

export const GatewayConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  marketDataUrl: z.string().url(),
  analyticsUrl: z.string().url(),
  wsMaxConnections: z.number().int().positive(),
  logLevel: LogLevelSchema,
});

export const AnalyticsConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  marketDataUrl: z.string().url(),
  logLevel: LogLevelSchema,
});

// ============================================================================
// Health Check Schema
// ============================================================================

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.string().min(1),
  timestamp: z.number().int().positive(),
  version: z.string().optional(),
  uptime: z.number().nonnegative().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate and parse data with a Zod schema
 */
export function validateAndParse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate data and return result with success/error
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
