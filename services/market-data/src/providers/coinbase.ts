import { DataProvider } from './base.js';
import { RawCandle, Interval } from '@pytrader/shared/types';
import WebSocket from 'ws';
import { safeParseFloat } from './utils.js';

interface CoinbaseCandle {
    0: number; // time
    1: number; // low
    2: number; // high
    3: number; // open
    4: number; // close
    5: number; // volume
}

interface CoinbaseTickerMessage {
    type: string;
    product_id: string;
    price: string;
    volume_24h: string;
    low_24h: string;
    high_24h: string;
    volume_30d: string;
    best_bid: string;
    best_ask: string;
    side: string;
    time: string;
    trade_id: number;
    last_size: string;
}

export class CoinbaseProvider extends DataProvider {
    private ws: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly apiUrl = 'https://api.exchange.coinbase.com';
    private readonly wsUrl = 'wss://ws-feed.exchange.coinbase.com';
    private candleCache: Map<string, RawCandle> = new Map(); // Cache for in-progress candles

    async connect(): Promise<void> {
        if (this.connected) return;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                this.connected = true;
                this.startPing();
                this.emit('connected');
                this.resubscribe();
                resolve();
            });

            this.ws.on('close', () => {
                this.connected = false;
                this.stopPing();
                this.emit('disconnected');
                // Simple reconnection logic could go here
            });

            this.ws.on('error', (error) => {
                this.emitError(error);
                if (!this.connected) {
                    reject(error);
                }
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                this.handleMessage(data);
            });
        });
    }

    async disconnect(): Promise<void> {
        if (!this.ws) return;

        return new Promise((resolve) => {
            this.ws!.once('close', () => {
                this.ws = null;
                resolve();
            });
            this.ws!.close();
        });
    }

    async subscribeCandles(symbol: string, interval: Interval): Promise<void> {
        this.trackSubscription(symbol, interval);

        if (!this.connected || !this.ws) return;

        // Coinbase WS doesn't support direct candle subscriptions for all intervals easily
        // For this implementation, we'll subscribe to the 'ticker' channel which gives real-time price updates
        // In a production app, we might aggregate these into candles or use a different channel if available
        // Note: This is a simplified implementation. Real candle aggregation from ticks is complex.
        // For now, we will emit a "candle" update for every tick, effectively 1s candles or similar, 
        // but the interface expects specific intervals.
        // A better approach for a real app is to fetch snapshots and then update.

        const msg = {
            type: 'subscribe',
            product_ids: [this.formatSymbol(symbol)],
            channels: ['ticker']
        };

        this.ws.send(JSON.stringify(msg));
    }

    async unsubscribeCandles(symbol: string, interval: Interval): Promise<void> {
        this.untrackSubscription(symbol, interval);

        if (!this.connected || !this.ws) return;

        // Only unsubscribe if no other intervals are watching this symbol
        if (this.getSubscriptions(symbol).size === 0) {
            const msg = {
                type: 'unsubscribe',
                product_ids: [this.formatSymbol(symbol)],
                channels: ['ticker']
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    async getHistoricalCandles(
        symbol: string,
        interval: Interval,
        from: number,
        to: number
    ): Promise<RawCandle[]> {
        const granularity = this.getGranularity(interval);
        const productId = this.formatSymbol(symbol);

        // Coinbase API takes ISO strings
        const start = new Date(from).toISOString();
        const end = new Date(to).toISOString();

        const url = `${this.apiUrl}/products/${productId}/candles?granularity=${granularity}&start=${start}&end=${end}`;

        await this.throttle();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch candles: ${response.statusText}`);
        }

        const data = await response.json() as CoinbaseCandle[];

        // Coinbase returns [time, low, high, open, close, volume]
        // Time is in seconds
        return data.map(c => ({
            symbol,
            interval,
            timestamp: c[0] * 1000,
            low: safeParseFloat(c[1], 'low'),
            high: safeParseFloat(c[2], 'high'),
            open: safeParseFloat(c[3], 'open'),
            close: safeParseFloat(c[4], 'close'),
            volume: safeParseFloat(c[5], 'volume'),
            provider: 'coinbase',
        })).sort((a, b) => a.timestamp - b.timestamp);
    }

    private handleMessage(data: WebSocket.Data) {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === 'ticker') {
                const ticker = message as CoinbaseTickerMessage;
                const symbol = this.parseSymbol(ticker.product_id);

                // Aggregate ticks into proper candles for each subscribed interval
                const subscriptions = this.getSubscriptions(symbol);
                subscriptions.forEach(interval => {
                    const candle = this.updateOrCreateCandle(symbol, interval, ticker);
                    this.emitCandle(candle);
                });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private formatSymbol(symbol: string): string {
        return symbol.replace('/', '-');
    }

    private parseSymbol(productId: string): string {
        return productId.replace('-', '/');
    }

    private getIntervalMs(interval: Interval): number {
        return this.getGranularity(interval) * 1000;
    }

    private getCandleWindowStart(timestamp: number, intervalMs: number): number {
        return Math.floor(timestamp / intervalMs) * intervalMs;
    }

    private getCacheKey(symbol: string, interval: Interval, windowStart: number): string {
        return `${symbol}:${interval}:${windowStart}`;
    }

    private updateOrCreateCandle(symbol: string, interval: Interval, ticker: CoinbaseTickerMessage): RawCandle {
        const price = safeParseFloat(ticker.price, 'price');
        const volume = safeParseFloat(ticker.last_size, 'last_size');
        const timestamp = new Date(ticker.time).getTime();
        const intervalMs = this.getIntervalMs(interval);
        const windowStart = this.getCandleWindowStart(timestamp, intervalMs);
        const cacheKey = this.getCacheKey(symbol, interval, windowStart);

        let candle = this.candleCache.get(cacheKey);

        if (!candle) {
            // Create new candle for this window
            candle = {
                symbol,
                interval,
                timestamp: windowStart,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: volume,
                provider: 'coinbase',
            };
            this.candleCache.set(cacheKey, candle);
        } else {
            // Update existing candle
            candle.high = Math.max(candle.high, price);
            candle.low = Math.min(candle.low, price);
            candle.close = price;
            candle.volume += volume;
        }

        return candle;
    }

    private getGranularity(interval: Interval): number {
        const map: Record<Interval, number> = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '30m': 1800, // Not directly supported by all Coinbase endpoints, but close enough for some? 
            // Actually Coinbase supports: 60, 300, 900, 3600, 21600, 86400
            '1h': 3600,
            '4h': 21600,
            '1d': 86400,
            '1w': 604800 // Not supported directly usually, might need custom handling
        };

        const gran = map[interval];
        if (!gran) {
            throw new Error(`Unsupported interval for Coinbase: ${interval}`);
        }
        return gran;
    }

    private startPing() {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }

    private stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private resubscribe() {
        // Re-subscribe to all active subscriptions
        for (const [symbol, intervals] of this.subscriptions.entries()) {
            if (intervals.size > 0) {
                const msg = {
                    type: 'subscribe',
                    product_ids: [this.formatSymbol(symbol)],
                    channels: ['ticker']
                };
                this.ws?.send(JSON.stringify(msg));
            }
        }
    }

    /**
     * Get rate limit metadata for the provider
     * Coinbase Pro API limits:
     * Public endpoints: 10 requests per second, up to 15 bursts
     */
    getRateLimitMetadata(): import('./base').RateLimitMetadata {
        return {
            requestsPerSecond: 10,
        };
    }
}
