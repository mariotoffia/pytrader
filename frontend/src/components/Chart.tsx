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
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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

    // Create Bollinger Bands upper line series
    const bbUpperSeries = chart.addLineSeries({
      color: '#9C27B0',
      lineWidth: 1,
      title: 'BB Upper',
      priceLineVisible: false,
      lastValueVisible: false,
      lineStyle: 2, // Dashed line
    });

    // Create Bollinger Bands middle line series
    const bbMiddleSeries = chart.addLineSeries({
      color: '#9C27B0',
      lineWidth: 1,
      title: 'BB Middle',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Create Bollinger Bands lower line series
    const bbLowerSeries = chart.addLineSeries({
      color: '#9C27B0',
      lineWidth: 1,
      title: 'BB Lower',
      priceLineVisible: false,
      lastValueVisible: false,
      lineStyle: 2, // Dashed line
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    bbUpperSeriesRef.current = bbUpperSeries;
    bbMiddleSeriesRef.current = bbMiddleSeries;
    bbLowerSeriesRef.current = bbLowerSeries;

    // Create RSI chart
    if (rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        width: rsiContainerRef.current.clientWidth,
        height: rsiContainerRef.current.clientHeight,
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

      // Create RSI line series
      const rsiSeries = rsiChart.addLineSeries({
        color: '#FFD700',
        lineWidth: 2,
        title: 'RSI',
        priceLineVisible: false,
        lastValueVisible: true,
      });

      // Add horizontal lines for RSI levels (30 and 70)
      rsiChart.applyOptions({
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
      });

      rsiChartRef.current = rsiChart;
      rsiSeriesRef.current = rsiSeries;

      // Synchronize time scales
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange && timeRange.from != null && timeRange.to != null && rsiChart) {
          try {
            rsiChart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            // Ignore errors when range is invalid
          }
        }
      });

      rsiChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const timeRange = rsiChart.timeScale().getVisibleRange();
        if (timeRange && timeRange.from != null && timeRange.to != null && chart) {
          try {
            chart.timeScale().setVisibleRange(timeRange);
          } catch (error) {
            // Ignore errors when range is invalid
          }
        }
      });
    }

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
          height: rsiContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
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

  // Update Bollinger Bands upper when indicators change
  useEffect(() => {
    if (!bbUpperSeriesRef.current || !indicators?.bb_upper) return;

    const bbUpperData = indicators.bb_upper
      .filter(item => item.bb_upper !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_upper as number,
      }));

    bbUpperSeriesRef.current.setData(bbUpperData);
  }, [indicators]);

  // Update Bollinger Bands middle when indicators change
  useEffect(() => {
    if (!bbMiddleSeriesRef.current || !indicators?.bb_middle) return;

    const bbMiddleData = indicators.bb_middle
      .filter(item => item.bb_middle !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_middle as number,
      }));

    bbMiddleSeriesRef.current.setData(bbMiddleData);
  }, [indicators]);

  // Update Bollinger Bands lower when indicators change
  useEffect(() => {
    if (!bbLowerSeriesRef.current || !indicators?.bb_lower) return;

    const bbLowerData = indicators.bb_lower
      .filter(item => item.bb_lower !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.bb_lower as number,
      }));

    bbLowerSeriesRef.current.setData(bbLowerData);
  }, [indicators]);

  // Update RSI when indicators change
  useEffect(() => {
    if (!rsiSeriesRef.current || !indicators?.rsi_14) return;

    const rsiData = indicators.rsi_14
      .filter(item => item.rsi_14 !== undefined)
      .map(item => ({
        time: Math.floor(item.timestamp / 1000) as Time,
        value: item.rsi_14 as number,
      }));

    rsiSeriesRef.current.setData(rsiData);
  }, [indicators]);

  // Update signal markers when signals change
  useEffect(() => {
    if (!candleSeriesRef.current || !signals || signals.length === 0) return;

    // Create a map of candle timestamps for validation
    const candleTimestamps = new Set(
      candles.map(c => Math.floor(c.timestamp / 1000))
    );

    const markers: SeriesMarker<Time>[] = signals
      .filter(signal => signal.action !== 'hold')
      .filter(signal => {
        // Only include signals that have corresponding candles in the visible range
        const signalTime = Math.floor(signal.timestamp / 1000);
        return candleTimestamps.has(signalTime);
      })
      .map(signal => ({
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
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* RSI chart */}
      <div style={{ position: 'relative', width: '100%', height: '30%', borderTop: '1px solid #2b2b43' }}>
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
