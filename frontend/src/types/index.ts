/**
 * Frontend-specific types
 */

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
