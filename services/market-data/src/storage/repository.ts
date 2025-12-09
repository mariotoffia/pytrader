import Database from 'better-sqlite3';
import { OHLCVCandle, Interval } from '@pytrader/shared/types';

/**
 * Repository for candlestick data operations
 * Implements idempotent writes and efficient queries
 */
export class CandleRepository {
  private insertStmt: Database.Statement;
  private queryByRangeStmt: Database.Statement;
  private queryLatestStmt: Database.Statement;
  private countStmt: Database.Statement;

  constructor(private db: Database.Database) {
    // Prepare statements for better performance
    this.insertStmt = db.prepare(`
      INSERT OR IGNORE INTO candles (symbol, interval, timestamp, open, high, low, close, volume)
      VALUES (@symbol, @interval, @timestamp, @open, @high, @low, @close, @volume)
    `);

    this.queryByRangeStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume
      FROM candles
      WHERE symbol = ? AND interval = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    this.queryLatestStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume
      FROM candles
      WHERE symbol = ? AND interval = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    this.countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM candles
      WHERE symbol = ? AND interval = ?
    `);
  }

  /**
   * Insert a single candle (idempotent)
   */
  insertCandle(candle: OHLCVCandle): void {
    this.insertStmt.run({
      symbol: candle.symbol,
      interval: candle.interval,
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    });
  }

  /**
   * Insert multiple candles in a transaction (idempotent)
   */
  insertCandles(candles: OHLCVCandle[]): number {
    const insertMany = this.db.transaction((candles: OHLCVCandle[]) => {
      let inserted = 0;
      for (const candle of candles) {
        const info = this.insertStmt.run({
          symbol: candle.symbol,
          interval: candle.interval,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        });
        if (info.changes > 0) inserted++;
      }
      return inserted;
    });

    return insertMany(candles);
  }

  /**
   * Query candles by time range
   */
  getCandlesByRange(
    symbol: string,
    interval: Interval,
    from: number,
    to: number
  ): OHLCVCandle[] {
    const rows = this.queryByRangeStmt.all(symbol, interval, from, to) as any[];
    return rows.map((row) => ({
      symbol: row.symbol,
      interval: row.interval,
      timestamp: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
  }

  /**
   * Get the latest candle for a symbol/interval
   */
  getLatestCandle(symbol: string, interval: Interval): OHLCVCandle | null {
    const row = this.queryLatestStmt.get(symbol, interval) as any;
    if (!row) return null;

    return {
      symbol: row.symbol,
      interval: row.interval,
      timestamp: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    };
  }

  /**
   * Count candles for a symbol/interval
   */
  countCandles(symbol: string, interval: Interval): number {
    const result = this.countStmt.get(symbol, interval) as any;
    return result?.count || 0;
  }
}
