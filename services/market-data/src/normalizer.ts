import { RawCandle, OHLCVCandle, Interval } from '@pytrader/shared/types';

/**
 * Normalize raw candle data from external providers to canonical OHLCV format
 */
export function normalizeCandle(raw: RawCandle): OHLCVCandle {
  return {
    symbol: raw.symbol,
    interval: raw.interval as Interval,
    timestamp: raw.timestamp,
    open: raw.open,
    high: raw.high,
    low: raw.low,
    close: raw.close,
    volume: raw.volume,
  };
}

/**
 * Normalize multiple candles
 */
export function normalizeCandles(raw: RawCandle[]): OHLCVCandle[] {
  return raw.map(normalizeCandle);
}
