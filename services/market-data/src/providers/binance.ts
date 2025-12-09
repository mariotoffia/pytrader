import { DataProvider } from './base.js';
import { RawCandle, Interval } from '@pytrader/shared/types';
import WebSocket from 'ws';

interface BinanceKline {
    0: number; // Open time
    1: string; // Open
    2: string; // High
    3: string; // Low
    4: string; // Close
    5: string; // Volume
    6: number; // Close time
    // ... other fields ignored
}

interface BinanceKlineStreamMessage {
    e: string; // Event type
    E: number; // Event time
    s: string; // Symbol
    k: {
        t: number; // Kline start time
        T: number; // Kline close time
        s: string; // Symbol
        i: string; // Interval
        f: number; // First trade ID
        L: number; // Last trade ID
        o: string; // Open price
        c: string; // Close price
        h: string; // High price
        l: string; // Low price
        v: string; // Base asset volume
        n: number; // Number of trades
        x: boolean; // Is this kline closed?
        q: string; // Quote asset volume
        V: string; // Taker buy base asset volume
        Q: string; // Taker buy quote asset volume
        B: string; // Ignore
    };
}

export class BinanceProvider extends DataProvider {
    private ws: WebSocket | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly apiUrl = 'https://data-api.binance.vision';
    private readonly wsUrl = 'wss://data-stream.binance.vision/ws';

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

        const binanceInterval = this.getBinanceInterval(interval);
        const params = [
            `${this.formatSymbol(symbol).toLowerCase()}@kline_${binanceInterval}`
        ];

        const msg = {
            method: 'SUBSCRIBE',
            params,
            id: Date.now()
        };

        this.ws.send(JSON.stringify(msg));
    }

    async unsubscribeCandles(symbol: string, interval: Interval): Promise<void> {
        this.untrackSubscription(symbol, interval);

        if (!this.connected || !this.ws) return;

        // Only unsubscribe if no other intervals are watching this symbol/interval combination
        // Actually Binance streams are specific to interval, so we can unsubscribe safely
        const binanceInterval = this.getBinanceInterval(interval);
        const params = [
            `${this.formatSymbol(symbol).toLowerCase()}@kline_${binanceInterval}`
        ];

        const msg = {
            method: 'UNSUBSCRIBE',
            params,
            id: Date.now()
        };
        this.ws.send(JSON.stringify(msg));
    }

    async getHistoricalCandles(
        symbol: string,
        interval: Interval,
        from: number,
        to: number
    ): Promise<RawCandle[]> {
        const binanceInterval = this.getBinanceInterval(interval);
        const symbolParam = this.formatSymbol(symbol);

        const url = `${this.apiUrl}/api/v3/klines?symbol=${symbolParam}&interval=${binanceInterval}&startTime=${from}&endTime=${to}&limit=1000`;

        await this.throttle();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch candles: ${response.statusText}`);
        }

        const data = await response.json() as BinanceKline[];

        return data.map(k => ({
            symbol,
            interval,
            timestamp: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    }

    private handleMessage(data: WebSocket.Data) {
        try {
            const message = JSON.parse(data.toString());

            if (message.e === 'kline') {
                const klineMsg = message as BinanceKlineStreamMessage;
                const symbol = this.parseSymbol(klineMsg.s); // Binance symbol is like BTCUSDT
                // We need to map back to our symbol format if possible, or store a mapping.
                // Since we don't store the mapping, we might need to assume a standard format or pass it through.
                // For now, let's try to reconstruct it or just use what we have if it matches.
                // Actually, we should check if we have a subscription for this symbol.

                // Simple heuristic for now: insert / before last 3 or 4 chars? No, that's brittle.
                // Better: iterate subscriptions and find matching formatted symbol.
                let matchedSymbol = symbol;
                for (const subSymbol of this.subscriptions.keys()) {
                    if (this.formatSymbol(subSymbol) === klineMsg.s) {
                        matchedSymbol = subSymbol;
                        break;
                    }
                }

                const interval = this.parseBinanceInterval(klineMsg.k.i);

                if (interval) {
                    const candle: RawCandle = {
                        symbol: matchedSymbol,
                        interval,
                        timestamp: klineMsg.k.t,
                        open: parseFloat(klineMsg.k.o),
                        high: parseFloat(klineMsg.k.h),
                        low: parseFloat(klineMsg.k.l),
                        close: parseFloat(klineMsg.k.c),
                        volume: parseFloat(klineMsg.k.v)
                    };
                    this.emitCandle(candle);
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private formatSymbol(symbol: string): string {
        return symbol.replace('/', '');
    }

    private parseSymbol(binanceSymbol: string): string {
        // This is tricky without knowing the quote currency length.
        // For now, return as is, but the matching logic in handleMessage handles the reverse lookup.
        return binanceSymbol;
    }

    private getBinanceInterval(interval: Interval): string {
        // Our Interval types match Binance format mostly
        return interval;
    }

    private parseBinanceInterval(interval: string): Interval | null {
        // Validate if it matches our Interval type
        const validIntervals: Interval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
        if (validIntervals.includes(interval as Interval)) {
            return interval as Interval;
        }
        return null;
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
        for (const [symbol, intervals] of this.subscriptions.entries()) {
            intervals.forEach(interval => {
                const binanceInterval = this.getBinanceInterval(interval);
                const params = [
                    `${this.formatSymbol(symbol).toLowerCase()}@kline_${binanceInterval}`
                ];
                const msg = {
                    method: 'SUBSCRIBE',
                    params,
                    id: Date.now()
                };
                this.ws?.send(JSON.stringify(msg));
            });
        }
    }

    /**
     * Get rate limit metadata for the provider
     * Binance API limits:
     * Public endpoints: 1200 weight per minute
     */
    getRateLimitMetadata(): import('./base').RateLimitMetadata {
        return {
            weightPerMinute: 1200,
        };
    }
}
