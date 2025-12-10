import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, SeriesMarker, Time } from 'lightweight-charts';
import { OHLCVCandle, Signal } from '../types';
import { IndicatorData } from '../hooks/useIndicators';

interface ChartProps {
  candles: OHLCVCandle[];
  symbol: string;
  indicators?: IndicatorData;
  signals?: Signal[];
}

export function Chart({ candles, symbol, indicators, signals }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create EMA 20 line series
    const ema20Series = chart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      title: 'EMA 20',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Create EMA 50 line series
    const ema50Series = chart.addLineSeries({
      color: '#FF6D00',
      lineWidth: 2,
      title: 'EMA 50',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Update candles when data changes
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
  }, [candles]);

  // Update EMA 20 when indicators change
  useEffect(() => {
    if (!ema20SeriesRef.current || !indicators?.ema_20) return;

    const ema20Data = indicators.ema_20
      .filter(item => item.ema_20 !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.ema_20 as number,
      }));

    ema20SeriesRef.current.setData(ema20Data);
  }, [indicators]);

  // Update EMA 50 when indicators change
  useEffect(() => {
    if (!ema50SeriesRef.current || !indicators?.ema_50) return;

    const ema50Data = indicators.ema_50
      .filter(item => item.ema_50 !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.ema_50 as number,
      }));

    ema50SeriesRef.current.setData(ema50Data);
  }, [indicators]);

  // Update signal markers when signals change
  useEffect(() => {
    if (!candleSeriesRef.current || !signals || signals.length === 0) return;

    const markers: SeriesMarker<Time>[] = signals
      .filter(signal => signal.action !== 'hold')
      .map(signal => ({
        time: Math.floor(signal.timestamp / 1000) as Time,
        position: signal.action === 'buy' ? 'belowBar' : 'aboveBar',
        color: signal.action === 'buy' ? '#26a69a' : '#ef5350',
        shape: signal.action === 'buy' ? 'arrowUp' : 'arrowDown',
        text: `${signal.action.toUpperCase()} (${signal.confidence.toFixed(2)})`,
      }));

    candleSeriesRef.current.setMarkers(markers);
  }, [signals]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
