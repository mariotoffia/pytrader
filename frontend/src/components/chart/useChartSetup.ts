import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { createChart } from 'lightweight-charts';

export function useChartSetup(options: {
  chartContainerRef: RefObject<HTMLDivElement>;
  rsiContainerRef: RefObject<HTMLDivElement>;
  onVisibleRangeChangeRef: RefObject<((range: { from: number; to: number }) => void) | undefined>;
  handleVisibleRangeChangeRef: RefObject<(fromMs: number, toMs: number) => Promise<void>>;
}) {
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
    if (!options.chartContainerRef.current) return;

    // Create chart
    const chart = createChart(options.chartContainerRef.current, {
      width: options.chartContainerRef.current.clientWidth,
      height: options.chartContainerRef.current.clientHeight,
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
    if (options.rsiContainerRef.current) {
      const rsiChart = createChart(options.rsiContainerRef.current, {
        width: options.rsiContainerRef.current.clientWidth,
        height: options.rsiContainerRef.current.clientHeight,
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

      const syncSourceRef = { current: null as 'main' | 'rsi' | null };

      const emitVisibleRangeChange = (timeRange: { from: Time; to: Time }) => {
        const fromMs = typeof timeRange.from === 'number' ? timeRange.from * 1000 : null;
        const toMs = typeof timeRange.to === 'number' ? timeRange.to * 1000 : null;
        if (fromMs == null || toMs == null) return;

        options.onVisibleRangeChangeRef.current?.({ from: fromMs, to: toMs });
        void options.handleVisibleRangeChangeRef.current?.(fromMs, toMs);
      };

      // Synchronize time scales (main <-> RSI) and detect missing data for backfill.
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (syncSourceRef.current === 'rsi') return;
        const timeRange = chart.timeScale().getVisibleRange();
        if (!timeRange || timeRange.from == null || timeRange.to == null) return;

        syncSourceRef.current = 'main';
        try {
          rsiChart.timeScale().setVisibleRange(timeRange);
        } catch {
          // Ignore errors when range is invalid
        }
        setTimeout(() => {
          if (syncSourceRef.current === 'main') syncSourceRef.current = null;
        }, 0);

        emitVisibleRangeChange(timeRange);
      });

      rsiChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (syncSourceRef.current === 'main') return;
        const timeRange = rsiChart.timeScale().getVisibleRange();
        if (!timeRange || timeRange.from == null || timeRange.to == null) return;

        syncSourceRef.current = 'rsi';
        try {
          chart.timeScale().setVisibleRange(timeRange);
        } catch {
          // Ignore errors when range is invalid
        }
        setTimeout(() => {
          if (syncSourceRef.current === 'rsi') syncSourceRef.current = null;
        }, 0);

        emitVisibleRangeChange(timeRange);
      });
    }

    // Handle window resize
    const handleResize = () => {
      if (options.chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: options.chartContainerRef.current.clientWidth,
          height: options.chartContainerRef.current.clientHeight,
        });
      }
      if (options.rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: options.rsiContainerRef.current.clientWidth,
          height: options.rsiContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      rsiChartRef.current?.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      candleSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbMiddleSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, []);

  return {
    chartRef,
    rsiChartRef,
    candleSeriesRef,
    ema20SeriesRef,
    ema50SeriesRef,
    bbUpperSeriesRef,
    bbMiddleSeriesRef,
    bbLowerSeriesRef,
    rsiSeriesRef,
  };
}
