import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import config from '../config';
import { useMarketDataManagement } from '../hooks/useMarketDataManagement';
import { CandlePageDirection, Interval, OHLCVCandle, PageCandlesResponse } from '../types';
import { CandlesVirtualTable } from '../components/CandlesVirtualTable';
import { MarketDataBrowserControls } from '../components/MarketDataBrowserControls';
import type { VirtualizedListScrollInfo } from '../components/VirtualizedList';

const ROW_HEIGHT = 28;
const TABLE_HEIGHT = 600;
const PAGE_SIZE = 200;
const SCROLL_THRESHOLD_PX = 240;

function toDateTimeLocalValue(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

export function MarketDataBrowser() {
  const gatewayUrl = config.gatewayUrl;
  const { stats, loading: statsLoading, error: statsError } = useMarketDataManagement({ gatewayUrl });

  const providers = useMemo(() => Array.from(new Set(stats.map((s) => s.provider))).sort(), [stats]);

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedInterval, setSelectedInterval] = useState<Interval>('1m');
  const [startTimeLocal, setStartTimeLocal] = useState<string>('');

  const symbols = useMemo(() => {
    return Array.from(
      new Set(stats.filter((s) => !selectedProvider || s.provider === selectedProvider).map((s) => s.symbol))
    ).sort();
  }, [stats, selectedProvider]);

  const intervals = useMemo(() => {
    return Array.from(
      new Set(
        stats
          .filter((s) => {
            if (selectedProvider && s.provider !== selectedProvider) return false;
            if (selectedSymbol && s.symbol !== selectedSymbol) return false;
            return true;
          })
          .map((s) => s.interval)
      )
    ).sort() as Interval[];
  }, [stats, selectedProvider, selectedSymbol]);

  useEffect(() => {
    if (!selectedProvider && providers.length > 0) {
      setSelectedProvider(providers[0]);
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    if (symbols.length === 0) return;
    if (!selectedSymbol || !symbols.includes(selectedSymbol)) {
      setSelectedSymbol(symbols[0]);
    }
  }, [symbols, selectedSymbol]);

  useEffect(() => {
    if (intervals.length === 0) return;
    if (!intervals.includes(selectedInterval)) {
      setSelectedInterval(intervals[0]);
    }
  }, [intervals, selectedInterval]);

  useEffect(() => {
    if (!selectedProvider || !selectedSymbol || !selectedInterval) return;
    const stat = stats.find(
      (s) => s.provider === selectedProvider && s.symbol === selectedSymbol && s.interval === selectedInterval
    );
    setStartTimeLocal(toDateTimeLocalValue(stat?.newestTimestamp ?? Date.now()));
  }, [stats, selectedProvider, selectedSymbol, selectedInterval]);

  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingBefore, setLoadingBefore] = useState(false);
  const [loadingAfter, setLoadingAfter] = useState(false);
  const [hasMoreBefore, setHasMoreBefore] = useState(true);
  const [hasMoreAfter, setHasMoreAfter] = useState(true);
  const [candleError, setCandleError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const pendingPrependAdjust = useRef<{ scrollTop: number; pixels: number } | null>(null);

  useLayoutEffect(() => {
    const adjust = pendingPrependAdjust.current;
    if (!adjust || !listRef.current) return;
    listRef.current.scrollTop = adjust.scrollTop + adjust.pixels;
    pendingPrependAdjust.current = null;
  }, [candles.length]);

  const fetchPage = useCallback(
    async (direction: CandlePageDirection, cursor: number): Promise<PageCandlesResponse> => {
      const params = new URLSearchParams({
        provider: selectedProvider,
        symbol: selectedSymbol,
        interval: selectedInterval,
        cursor: cursor.toString(),
        direction,
        limit: PAGE_SIZE.toString(),
      });

      const response = await fetch(`${gatewayUrl}/market-data/candles/page?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch candles: ${response.statusText}`);
      }

      return (await response.json()) as PageCandlesResponse;
    },
    [gatewayUrl, selectedProvider, selectedSymbol, selectedInterval]
  );

  const loadInitial = useCallback(async () => {
    if (!selectedProvider || !selectedSymbol || !selectedInterval || !startTimeLocal) return;

    const cursor = new Date(startTimeLocal).getTime();
    if (!Number.isFinite(cursor)) return;

    setLoadingInitial(true);
    setCandleError(null);
    setHasMoreBefore(true);
    setHasMoreAfter(true);

    try {
      const forward = await fetchPage('forward', cursor);
      if (forward.candles.length > 0) {
        setCandles(forward.candles);
        return;
      }

      const backward = await fetchPage('backward', cursor);
      setCandles(backward.candles);
      if (backward.candles.length === 0) {
        setHasMoreBefore(false);
        setHasMoreAfter(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candles';
      setCandleError(message);
    } finally {
      setLoadingInitial(false);
      if (listRef.current) listRef.current.scrollTop = 0;
    }
  }, [fetchPage, selectedProvider, selectedSymbol, selectedInterval, startTimeLocal]);

  const loadMoreAfter = useCallback(async () => {
    if (loadingInitial || loadingAfter || !hasMoreAfter) return;
    if (!selectedProvider || !selectedSymbol || !selectedInterval) return;

    const last = candles[candles.length - 1];
    if (!last) return;

    setLoadingAfter(true);
    try {
      const page = await fetchPage('forward', last.timestamp + 1);
      if (page.candles.length === 0) {
        setHasMoreAfter(false);
        return;
      }
      setCandles((prev) => [...prev, ...page.candles]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch newer candles';
      setCandleError(message);
    } finally {
      setLoadingAfter(false);
    }
  }, [candles, fetchPage, hasMoreAfter, loadingAfter, loadingInitial, selectedInterval, selectedProvider, selectedSymbol]);

  const loadMoreBefore = useCallback(async () => {
    if (loadingInitial || loadingBefore || !hasMoreBefore) return;
    if (!selectedProvider || !selectedSymbol || !selectedInterval) return;

    const first = candles[0];
    if (!first) return;

    const currentScrollTop = listRef.current?.scrollTop ?? 0;

    setLoadingBefore(true);
    try {
      const page = await fetchPage('backward', first.timestamp - 1);
      if (page.candles.length === 0) {
        setHasMoreBefore(false);
        return;
      }

      pendingPrependAdjust.current = { scrollTop: currentScrollTop, pixels: page.candles.length * ROW_HEIGHT };
      setCandles((prev) => [...page.candles, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch older candles';
      setCandleError(message);
    } finally {
      setLoadingBefore(false);
    }
  }, [candles, fetchPage, hasMoreBefore, loadingBefore, loadingInitial, selectedInterval, selectedProvider, selectedSymbol]);

  const handleScroll = useCallback(
    (info: VirtualizedListScrollInfo) => {
      if (candles.length === 0) return;

      if (info.scrollTop < SCROLL_THRESHOLD_PX) {
        void loadMoreBefore();
      }

      if (info.scrollTop + info.clientHeight > info.scrollHeight - SCROLL_THRESHOLD_PX) {
        void loadMoreAfter();
      }
    },
    [candles.length, loadMoreAfter, loadMoreBefore]
  );

  const loadedRange = useMemo(() => {
    if (candles.length === 0) return null;
    return {
      from: candles[0].timestamp,
      to: candles[candles.length - 1].timestamp,
    };
  }, [candles]);

  const canLoad = Boolean(selectedProvider && selectedSymbol && selectedInterval && startTimeLocal);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#131722',
        padding: '24px',
        gap: '16px',
        overflowY: 'auto',
      }}
    >
      <div>
        <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Market Data Browser</h1>
        <p style={{ margin: 0, color: '#787b86', fontSize: '14px' }}>
          Browse stored candles with provider/interval filtering and cursor paging.
        </p>
      </div>

      {(statsError || candleError) && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid #ef5350',
            borderRadius: '4px',
            color: '#ef5350',
            fontSize: '14px',
          }}
        >
          Error: {candleError || statsError}
        </div>
      )}

      <MarketDataBrowserControls
        providers={providers}
        symbols={symbols}
        intervals={intervals}
        selectedProvider={selectedProvider}
        selectedSymbol={selectedSymbol}
        selectedInterval={selectedInterval}
        startTimeLocal={startTimeLocal}
        statsLoading={statsLoading}
        loadingInitial={loadingInitial}
        canLoad={canLoad}
        onProviderChange={setSelectedProvider}
        onSymbolChange={setSelectedSymbol}
        onIntervalChange={setSelectedInterval}
        onStartTimeChange={setStartTimeLocal}
        onLoad={() => void loadInitial()}
      />

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#787b86', fontSize: '12px' }}>
        <div>Loaded: {candles.length.toLocaleString()} candles</div>
        {loadedRange && (
          <div>
            Range: {new Date(loadedRange.from).toLocaleString()} → {new Date(loadedRange.to).toLocaleString()}
          </div>
        )}
        <div>
          Older: {loadingBefore ? 'loading' : hasMoreBefore ? 'available' : 'none'} | Newer:{' '}
          {loadingAfter ? 'loading' : hasMoreAfter ? 'available' : 'none'}
        </div>
      </div>

      <CandlesVirtualTable
        candles={candles}
        height={TABLE_HEIGHT}
        rowHeight={ROW_HEIGHT}
        statsLoading={statsLoading}
        loadingInitial={loadingInitial}
        containerRef={listRef}
        onScroll={handleScroll}
      />
    </div>
  );
}
