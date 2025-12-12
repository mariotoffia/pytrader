import Database from 'better-sqlite3';
import { OHLCVCandle, Interval, CandlePageDirection } from '@pytrader/shared/types';

/**
 * Repository for candlestick data operations
 * Implements idempotent writes and efficient queries
 */
export class CandleRepository {
  private insertStmt: Database.Statement;
  private queryByRangeStmt: Database.Statement;
  private queryPageForwardStmt: Database.Statement;
  private queryPageBackwardStmt: Database.Statement;
  private queryLatestStmt: Database.Statement;
  private countStmt: Database.Statement;
  private statsStmt: Database.Statement;
  private detailedStatsStmt: Database.Statement;

  constructor(private db: Database.Database) {
    // Prepare statements for better performance
    this.insertStmt = db.prepare(`
      INSERT OR IGNORE INTO candles (symbol, interval, timestamp, open, high, low, close, volume, provider)
      VALUES (@symbol, @interval, @timestamp, @open, @high, @low, @close, @volume, @provider)
    `);

    this.queryByRangeStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume, provider
      FROM candles
      WHERE symbol = ? AND interval = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    this.queryPageForwardStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume, provider
      FROM candles
      WHERE provider = ? AND symbol = ? AND interval = ? AND timestamp >= ?
      ORDER BY timestamp ASC
      LIMIT ?
    `);

    this.queryPageBackwardStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume, provider
      FROM candles
      WHERE provider = ? AND symbol = ? AND interval = ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    this.queryLatestStmt = db.prepare(`
      SELECT symbol, interval, timestamp, open, high, low, close, volume, provider
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

    this.statsStmt = db.prepare(`
      SELECT
        COUNT(*) as totalCandles,
        COUNT(DISTINCT provider) as providerCount,
        COUNT(DISTINCT symbol) as symbolCount,
        COUNT(DISTINCT interval) as intervalCount
      FROM candles
    `);

    this.detailedStatsStmt = db.prepare(`
      SELECT
        provider,
        symbol,
        interval,
        COUNT(*) as count,
        MIN(timestamp) as oldestTimestamp,
        MAX(timestamp) as newestTimestamp
      FROM candles
      GROUP BY provider, symbol, interval
      ORDER BY provider, symbol, interval
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
      provider: candle.provider || 'mock',
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
          provider: candle.provider || 'mock',
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
      provider: row.provider,
    }));
  }

  /**
   * Get a page of candles around a cursor time
   * - forward: timestamp >= cursor, ordered ASC
   * - backward: timestamp <= cursor, ordered ASC (internally queried DESC then reversed)
   */
  getCandlesPage(
    provider: string,
    symbol: string,
    interval: Interval,
    cursor: number,
    direction: CandlePageDirection,
    limit: number
  ): OHLCVCandle[] {
    const stmt = direction === 'backward' ? this.queryPageBackwardStmt : this.queryPageForwardStmt;
    const rows = stmt.all(provider, symbol, interval, cursor, limit) as any[];

    const candles = rows.map((row) => ({
      symbol: row.symbol,
      interval: row.interval,
      timestamp: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      provider: row.provider,
    }));

    if (direction === 'backward') {
      candles.reverse();
    }

    return candles;
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
      provider: row.provider,
    };
  }

  /**
   * Count candles for a symbol/interval
   */
  countCandles(symbol: string, interval: Interval): number {
    const result = this.countStmt.get(symbol, interval) as any;
    return result?.count || 0;
  }

  /**
   * Get overall statistics
   */
  getStatistics(): {
    totalCandles: number;
    providers: string[];
    symbols: string[];
    intervals: string[];
  } {
    const stats = this.statsStmt.get() as any;

    const providers = this.db
      .prepare('SELECT DISTINCT provider FROM candles ORDER BY provider')
      .all()
      .map((row: any) => row.provider);

    const symbols = this.db
      .prepare('SELECT DISTINCT symbol FROM candles ORDER BY symbol')
      .all()
      .map((row: any) => row.symbol);

    const intervals = this.db
      .prepare('SELECT DISTINCT interval FROM candles ORDER BY interval')
      .all()
      .map((row: any) => row.interval);

    return {
      totalCandles: stats.totalCandles || 0,
      providers,
      symbols,
      intervals,
    };
  }

  /**
   * Get detailed statistics breakdown
   */
  getDetailedStats(): Array<{
    provider: string;
    symbol: string;
    interval: string;
    count: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  }> {
    const rows = this.detailedStatsStmt.all() as any[];
    return rows.map((row) => ({
      provider: row.provider,
      symbol: row.symbol,
      interval: row.interval,
      count: row.count,
      oldestTimestamp: row.oldestTimestamp,
      newestTimestamp: row.newestTimestamp,
    }));
  }

  /**
   * Delete candles with flexible filtering
   */
  deleteCandles(filters: {
    provider?: string;
    symbol?: string;
    interval?: string;
  }): number {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.provider) {
      conditions.push('provider = ?');
      params.push(filters.provider);
    }

    if (filters.symbol) {
      conditions.push('symbol = ?');
      params.push(filters.symbol);
    }

    if (filters.interval) {
      conditions.push('interval = ?');
      params.push(filters.interval);
    }

    if (conditions.length === 0) {
      throw new Error('At least one filter is required for deletion');
    }

    const sql = `DELETE FROM candles WHERE ${conditions.join(' AND ')}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);

    return result.changes;
  }

  /**
   * Delete all candles (use with caution)
   */
  deleteAllCandles(): number {
    const stmt = this.db.prepare('DELETE FROM candles');
    const result = stmt.run();
    return result.changes;
  }
}
