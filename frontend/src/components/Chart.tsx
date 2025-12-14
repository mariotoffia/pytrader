import { useEffect, useRef } from 'react';
import {
  CandlestickData,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { OHLCVCandle, Signal, DataProvider, Interval } from '../types';
import { IndicatorData } from '../hooks/useIndicators';
import { useChartBackfill } from '../hooks/useChartBackfill';
import { useChartSetup } from './chart/useChartSetup';
import config from '../config';

interface ChartProps {
  candles: OHLCVCandle[];
  symbol: string;
  provider: DataProvider;
  interval: Interval;
  indicators?: IndicatorData;
  signals?: Signal[];
  onBackfillComplete?: () => void;
  onVisibleRangeChange?: (range: { from: number; to: number }) => void;
}

const GATEWAY_URL = config.gatewayUrl;

export function Chart({
  candles,
  symbol,
  provider,
  interval,
  indicators,
  signals,
  onBackfillComplete,
  onVisibleRangeChange,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);

  // Backfill management
  const { handleVisibleRangeChange, backfilling, backfillMessage } = useChartBackfill({
    gatewayUrl: GATEWAY_URL,
    provider,
    symbol,
    interval,
    candles,
    onBackfillComplete,
  });

  const onVisibleRangeChangeRef = useRef<typeof onVisibleRangeChange>(onVisibleRangeChange);
  const handleVisibleRangeChangeRef = useRef(handleVisibleRangeChange);
  useEffect(() => {
    onVisibleRangeChangeRef.current = onVisibleRangeChange;
  }, [onVisibleRangeChange]);
  useEffect(() => {
    handleVisibleRangeChangeRef.current = handleVisibleRangeChange;
  }, [handleVisibleRangeChange]);

  const {
    chartRef,
    candleSeriesRef,
    ema20SeriesRef,
    ema50SeriesRef,
    bbUpperSeriesRef,
    bbMiddleSeriesRef,
    bbLowerSeriesRef,
    rsiSeriesRef,
  } = useChartSetup({
    chartContainerRef,
    rsiContainerRef,
    onVisibleRangeChangeRef,
    handleVisibleRangeChangeRef,
  });

  // Update candles when data changes
  const initialRangeNotifiedKeyRef = useRef<string>('');
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData[] = candles.map((candle) => ({
      time: Math.floor(candle.timestamp / 1000) as any, // Convert to seconds
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candleSeriesRef.current.setData(chartData);

    // On first data load for a symbol/interval, notify the parent about the initial visible range
    // so it can ensure we have enough candles loaded for this view.
    const key = `${provider}:${symbol}:${interval}`;
    if (initialRangeNotifiedKeyRef.current !== key) {
      initialRangeNotifiedKeyRef.current = key;
      const chart = chartRef.current;
      if (chart) {
        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange && timeRange.from != null && timeRange.to != null) {
          const fromMs = typeof timeRange.from === 'number' ? timeRange.from * 1000 : null;
          const toMs = typeof timeRange.to === 'number' ? timeRange.to * 1000 : null;
          if (fromMs != null && toMs != null) {
            onVisibleRangeChangeRef.current?.({ from: fromMs, to: toMs });
            void handleVisibleRangeChangeRef.current(fromMs, toMs);
          }
        }
      }
    }
  }, [candles, provider, symbol, interval]);

  // Update EMA 20 when indicators change
  useEffect(() => {
    if (!ema20SeriesRef.current || !indicators?.ema_20) return;

    const ema20Data = indicators.ema_20
      .filter((item) => item.ema_20 !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.ema_20 as number,
      }));

    ema20SeriesRef.current.setData(ema20Data);
  }, [indicators]);

  // Update EMA 50 when indicators change
  useEffect(() => {
    if (!ema50SeriesRef.current || !indicators?.ema_50) return;

    const ema50Data = indicators.ema_50
      .filter((item) => item.ema_50 !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.ema_50 as number,
      }));

    ema50SeriesRef.current.setData(ema50Data);
  }, [indicators]);

  // Update Bollinger Bands upper when indicators change
  useEffect(() => {
    if (!bbUpperSeriesRef.current || !indicators?.bb_upper) return;

    const bbUpperData = indicators.bb_upper
      .filter((item) => item.bb_upper !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_upper as number,
      }));

    bbUpperSeriesRef.current.setData(bbUpperData);
  }, [indicators]);

  // Update Bollinger Bands middle when indicators change
  useEffect(() => {
    if (!bbMiddleSeriesRef.current || !indicators?.bb_middle) return;

    const bbMiddleData = indicators.bb_middle
      .filter((item) => item.bb_middle !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_middle as number,
      }));

    bbMiddleSeriesRef.current.setData(bbMiddleData);
  }, [indicators]);

  // Update Bollinger Bands lower when indicators change
  useEffect(() => {
    if (!bbLowerSeriesRef.current || !indicators?.bb_lower) return;

    const bbLowerData = indicators.bb_lower
      .filter((item) => item.bb_lower !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_lower as number,
      }));

    bbLowerSeriesRef.current.setData(bbLowerData);
  }, [indicators]);

  // Update RSI when indicators change
  useEffect(() => {
    if (!rsiSeriesRef.current || !indicators?.rsi_14) return;

    const rsiData = indicators.rsi_14
      .filter((item) => item.rsi_14 !== undefined)
      .map((item) => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.rsi_14 as number,
      }));

    rsiSeriesRef.current.setData(rsiData);
  }, [indicators]);

  // Update signal markers when signals change
  useEffect(() => {
    if (!candleSeriesRef.current || !signals || signals.length === 0) return;

    // Create a map of candle timestamps for validation
    const candleTimestamps = new Set(candles.map((c) => Math.floor(c.timestamp / 1000)));

    const markers: SeriesMarker<Time>[] = signals
      .filter((signal) => signal.action !== 'hold')
      .filter((signal) => {
        // Only include signals that have corresponding candles in the visible range
        const signalTime = Math.floor(signal.timestamp / 1000);
        return candleTimestamps.has(signalTime);
      })
      .map((signal) => ({
        time: Math.floor(signal.timestamp / 1000) as Time,
        position: signal.action === 'buy' ? 'belowBar' : 'aboveBar',
        color: signal.action === 'buy' ? '#26a69a' : '#ef5350',
        shape: signal.action === 'buy' ? 'arrowUp' : 'arrowDown',
        text: `${signal.action.toUpperCase()} @${signal.price.toFixed(4)} (${signal.confidence.toFixed(2)})`,
      }));

    candleSeriesRef.current.setMarkers(markers);
  }, [signals, candles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Main chart with candlesticks, EMAs, and Bollinger Bands */}
      <div style={{ position: 'relative', width: '100%', height: '70%' }}>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 12px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {symbol}
        </div>

        {/* Backfill status overlay */}
        {(backfilling || backfillMessage) && (
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 10,
              zIndex: 1000,
              background: backfilling ? 'rgba(38, 166, 154, 0.9)' : 'rgba(0, 0, 0, 0.8)',
              padding: '8px 12px',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            {backfilling ? 'Loading historical data...' : backfillMessage}
          </div>
        )}

        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* RSI chart */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '30%',
          borderTop: '1px solid #2b2b43',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
            color: '#FFD700',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          RSI (14)
        </div>
        <div ref={rsiContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
