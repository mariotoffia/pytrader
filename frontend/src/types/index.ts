/**
 * Frontend-specific types
 */

export type DataProvider = 'binance' | 'coinbase' | 'mock';

export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface OHLCVCandle {
  symbol: string;
  interval: Interval;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  provider?: string;
}

export interface Symbol {
  symbol: string;
  exchange: string;
  type: 'crypto' | 'stock' | 'forex';
  baseAsset: string;
  quoteAsset: string;
}

export type SignalAction = 'buy' | 'sell' | 'hold';

export interface Signal {
  symbol: string;
  timestamp: number;
  action: SignalAction;
  confidence: number;
  price: number;
  strategyId: string;
  metadata?: Record<string, any>;
}

// WebSocket message types
export interface SubscribeCandlesMessage {
  type: 'subscribe_candles';
  payload: {
    symbol: string;
    interval: Interval;
  };
}

export interface CandleUpdateMessage {
  type: 'candle_update';
  payload: OHLCVCandle;
}

export interface SignalUpdateMessage {
  type: 'signal_update';
  payload: Signal;
}

export type ServerMessage = CandleUpdateMessage | SignalUpdateMessage;

// Market Data Management Types
export interface MarketDataStatistics {
  totalCandles: number;
  providers: string[];
  symbols: string[];
  intervals: string[];
}

export interface DetailedMarketDataStats {
  provider: string;
  symbol: string;
  interval: string;
  count: number;
  oldestTimestamp: number;
  newestTimestamp: number;
}

export interface DeleteCandlesRequest {
  provider?: string;
  symbol?: string;
  interval?: string;
}

export interface DeleteCandlesResponse {
  success: boolean;
  deletedCount: number;
  filters: DeleteCandlesRequest;
  timestamp: number;
}

export type CandlePageDirection = 'forward' | 'backward';

export interface PageCandlesResponse {
  candles: OHLCVCandle[];
  nextCursor: number | null;
  prevCursor: number | null;
}

// Provider Management Types
export interface ProviderSubscription {
  symbol: string;
  interval: Interval;
}

export interface ProviderStatus {
  name: DataProvider;
  enabled: boolean;
  connected: boolean;
  subscriptions: ProviderSubscription[];
  errorState: string | null;
}

export interface BackfillRequest {
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  from?: number;
  to?: number;
  hours?: number;
}

export interface BackfillResponse {
  success: boolean;
  provider: DataProvider;
  symbol: string;
  interval: Interval;
  candlesInserted: number;
  candlesFetched: number;
  timeRange: { from: number; to: number };
  duration: number;
}
