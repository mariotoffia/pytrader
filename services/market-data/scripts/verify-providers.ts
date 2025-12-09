import { CoinbaseProvider } from '../src/providers/coinbase';
import { BinanceProvider } from '../src/providers/binance';

async function testProviders() {
    console.log('--- Testing Coinbase Provider ---');
    const coinbase = new CoinbaseProvider();

    try {
        await coinbase.connect();
        console.log('Coinbase connected');

        // Test Historical
        console.log('Fetching Coinbase historical candles...');
        const now = Date.now();
        const oneHourAgo = now - 3600 * 1000;
        const candles = await coinbase.getHistoricalCandles('BTC/USDT', '1m', oneHourAgo, now);
        console.log(`Received ${candles.length} historical candles from Coinbase`);
        if (candles.length > 0) {
            console.log('Sample candle:', candles[0]);
        }

        // Test Real-time
        console.log('Subscribing to Coinbase real-time updates...');
        const coinbasePromise = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                console.log('Timeout waiting for Coinbase candle');
                resolve();
            }, 10000);

            coinbase.on('candle', (candle) => {
                console.log('Received Coinbase candle:', candle);
                clearTimeout(timeout);
                resolve();
            });
        });

        await coinbase.subscribeCandles('BTC/USDT', '1m');
        await coinbasePromise;
        await coinbase.unsubscribeCandles('BTC/USDT', '1m');

    } catch (error) {
        console.error('Coinbase test failed:', error);
    } finally {
        await coinbase.disconnect();
    }

    console.log('\n--- Testing Binance Provider ---');
    const binance = new BinanceProvider();

    try {
        await binance.connect();
        console.log('Binance connected');

        // Test Historical
        console.log('Fetching Binance historical candles...');
        const now = Date.now();
        const oneHourAgo = now - 3600 * 1000;
        const candles = await binance.getHistoricalCandles('BTC/USDT', '1m', oneHourAgo, now);
        console.log(`Received ${candles.length} historical candles from Binance`);
        if (candles.length > 0) {
            console.log('Sample candle:', candles[0]);
        }

        // Test Real-time
        console.log('Subscribing to Binance real-time updates...');
        const binancePromise = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                console.log('Timeout waiting for Binance candle');
                resolve();
            }, 10000);

            binance.on('candle', (candle) => {
                console.log('Received Binance candle:', candle);
                clearTimeout(timeout);
                resolve();
            });
        });

        await binance.subscribeCandles('BTC/USDT', '1m');
        await binancePromise;
        await binance.unsubscribeCandles('BTC/USDT', '1m');

    } catch (error) {
        console.error('Binance test failed:', error);
    } finally {
        await binance.disconnect();
    }
}

testProviders().catch(console.error);
