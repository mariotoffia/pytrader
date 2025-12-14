import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart } from '../components/Chart';
import { SymbolSelector } from '../components/SymbolSelector';
import { IntervalSelector } from '../components/IntervalSelector';
import { useCandles } from '../hooks/useCandles';
import { useIndicators } from '../hooks/useIndicators';
import { useSignals } from '../hooks/useSignals';
import { useWebSocket } from '../hooks/useWebSocket';
import { useProviderStatus } from '../hooks/useProviderStatus';
import { useConfig } from '../hooks/useConfig';
import { useBackfill } from '../hooks/useBackfill';
import { Interval, DataProvider } from '../types';
import { intervalToMs } from '../utils/interval';
import {
  getStoredProvider,
  setStoredProvider,
  getStoredSymbol,
  setStoredSymbol,
  getStoredInterval,
  setStoredInterval,
} from '../utils/localStorage';
import config from '../config';

const GATEWAY_URL = config.gatewayUrl;
const WS_URL = config.wsUrl;

export function Dashboard() {
  // Initialize state from localStorage
  const [provider, setProvider] = useState<DataProvider>(getStoredProvider() || 'mock');
  const [symbol, setSymbol] = useState(getStoredSymbol() || 'BTC/USDT');
  const [interval, setInterval] = useState<Interval>(getStoredInterval() || '1m');

  // Fetch provider statuses
  const { providers, error: providerError } = useProviderStatus({
    gatewayUrl: GATEWAY_URL,
    pollInterval: 5000,
  });

  // Fetch config to get configured symbols and intervals
  const { config: appConfig } = useConfig();
  const defaultBackfillHours = appConfig?.defaultBackfillHours ?? 24;

  const [candleFrom, setCandleFrom] = useState<number>(() => Date.now() - 24 * 60 * 60 * 1000);

  // Reset range when switching data source
  useEffect(() => {
    const now = Date.now();
    setCandleFrom(now - defaultBackfillHours * 60 * 60 * 1000);
  }, [provider, symbol, interval, defaultBackfillHours]);

  const handleChartVisibleRangeChange = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      const intervalMs = intervalToMs(interval);
      const leftBufferMs = intervalMs * 200;

      const desiredFrom = Math.max(0, from - leftBufferMs);
      // Only extend the left edge (history). The right edge is driven by WebSocket live updates.
      // This prevents a tight loop where a moving "now" keeps changing `to`, causing refetch storms.
      void to; // intentionally unused
      setCandleFrom((prev) => (desiredFrom < prev ? desiredFrom : prev));
    },
    [interval]
  );

  // Get symbols from config for current provider
  const providerSymbols = appConfig?.providers?.[provider]?.symbols || [];

  // Validate and update symbol when provider changes
  useEffect(() => {
    if (providerSymbols && providerSymbols.length > 0 && !providerSymbols.includes(symbol)) {
      // Current symbol not supported by new provider, switch to first available
      console.log(
        `[Dashboard] Symbol ${symbol} not supported by ${provider}, switching to ${providerSymbols[0]}`
      );
      setSymbol(providerSymbols[0]);
    }
  }, [provider, providerSymbols, symbol]);

  // Persist selections to localStorage
  useEffect(() => {
    setStoredProvider(provider);
  }, [provider]);

  useEffect(() => {
    setStoredSymbol(symbol);
  }, [symbol]);

  useEffect(() => {
    setStoredInterval(interval);
  }, [interval]);

  // Create a single shared WebSocket connection
  const handleDashboardMessage = useCallback(() => {}, []);
  const { socket, isConnected } = useWebSocket({
    url: WS_URL,
    onMessage: handleDashboardMessage, // Messages handled by individual hooks
    debugLabel: 'dashboard',
  });

  // Use the shared WebSocket for candles
  const {
    candles,
    loading,
    error,
    refetch: refetchCandles,
  } = useCandles({
    provider,
    symbol,
    interval,
    gatewayUrl: GATEWAY_URL,
    wsUrl: WS_URL,
    from: candleFrom,
  });

  // Fetch technical indicators (EMA 20, EMA 50, RSI 14)
  const { indicators } = useIndicators({
    provider,
    symbol,
    interval,
    gatewayUrl: GATEWAY_URL,
    candles,
  });

  // Fetch and subscribe to trading signals using the shared socket
  const { signals } = useSignals({
    provider,
    symbol,
    interval,
    gatewayUrl: GATEWAY_URL,
    wsSocket: socket,
    strategyId: 'ema_crossover_rsi',
  });

  // Find current provider status
  const currentProvider = providers?.find((p) => p.name === provider);
  const isProviderAvailable = currentProvider?.enabled && currentProvider?.connected;

  // Backfill hook for automatic initial data loading
  const { triggerBackfillByHours, loading: backfilling } = useBackfill({ gatewayUrl: GATEWAY_URL });
  const hasTriggeredInitialBackfill = useRef<string | boolean>(false);

  // Trigger initial backfill when no candles are available
  useEffect(() => {
    const triggerInitialBackfill = async () => {
      // Only trigger if:
      // 1. Not currently loading candles
      // 2. No candles available
      // 3. No error from candle fetch
      // 4. Haven't already triggered backfill for this combination
      // 5. Provider is available
      if (!loading && candles.length === 0 && !error && isProviderAvailable && !backfilling) {
        const backfillKey = `${provider}-${symbol}-${interval}`;
        if (hasTriggeredInitialBackfill.current !== backfillKey) {
          hasTriggeredInitialBackfill.current = backfillKey as any;
          console.log(
            `[Dashboard] No candles found for ${provider}/${symbol}/${interval}, triggering backfill...`
          );

          const result = await triggerBackfillByHours(provider, symbol, interval, 24);
          if (result && result.success) {
            console.log(
              `[Dashboard] Backfill completed: ${result.candlesInserted} candles inserted`
            );
            // Refresh candles after backfill
            setTimeout(() => refetchCandles(), 500);
          }
        }
      }
    };

    triggerInitialBackfill();
  }, [
    loading,
    candles.length,
    error,
    provider,
    symbol,
    interval,
    isProviderAvailable,
    backfilling,
    triggerBackfillByHours,
    refetchCandles,
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#131722',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: '#1e222d',
          borderBottom: '1px solid #2b2b43',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Provider Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: '#787b86', fontSize: '11px', textTransform: 'uppercase' }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as DataProvider)}
              style={{
                background: '#2b2b43',
                color: '#d1d4dc',
                border: '1px solid #434651',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              {providers
                ?.filter((p) => p.enabled)
                .map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name.charAt(0).toUpperCase() + p.name.slice(1)}{' '}
                    {p.connected ? '\u2713' : '\u2717'}
                  </option>
                ))}
              {(providers?.filter((p) => p.enabled).length ?? 0) === 0 && (
                <option value={provider}>{provider}</option>
              )}
            </select>
          </div>

          <SymbolSelector value={symbol} onChange={setSymbol} symbols={providerSymbols} />
          <IntervalSelector value={interval} onChange={setInterval} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Provider status warning */}
          {!isProviderAvailable && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#ff9800',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                Provider "{provider}" unavailable
              </span>
            </div>
          )}

          {/* Provider error */}
          {providerError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#ef5350',
                borderRadius: '4px',
              }}
            >
              <span style={{ color: '#fff', fontSize: '12px' }}>Provider status error</span>
            </div>
          )}

          {/* Connection status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#26a69a' : '#ef5350',
              }}
            />
            <span style={{ color: '#d1d4dc', fontSize: '12px' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Candle count */}
          <span style={{ color: '#787b86', fontSize: '12px' }}>{candles.length} candles</span>
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {(loading || backfilling) && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontSize: '16px',
            }}
          >
            {backfilling ? 'Backfilling historical data...' : 'Loading candles...'}
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ef5350',
              fontSize: '16px',
              textAlign: 'center',
            }}
          >
            <div>Error loading candles</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>{error}</div>
          </div>
        )}

        {!error && candles.length > 0 && (
          <Chart
            candles={candles}
            symbol={symbol}
            provider={provider}
            interval={interval}
            indicators={indicators}
            signals={signals}
            onBackfillComplete={refetchCandles}
            onVisibleRangeChange={handleChartVisibleRangeChange}
          />
        )}

        {!loading && !error && candles.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#787b86',
              fontSize: '14px',
            }}
          >
            No candles available for {symbol} {interval}
          </div>
        )}
      </div>
    </div>
  );
}
