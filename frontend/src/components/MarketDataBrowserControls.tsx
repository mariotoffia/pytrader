import type { Interval } from '../types';

interface MarketDataBrowserControlsProps {
  providers: string[];
  symbols: string[];
  intervals: Interval[];
  selectedProvider: string;
  selectedSymbol: string;
  selectedInterval: Interval;
  startTimeLocal: string;
  statsLoading: boolean;
  loadingInitial: boolean;
  canLoad: boolean;
  onProviderChange: (provider: string) => void;
  onSymbolChange: (symbol: string) => void;
  onIntervalChange: (interval: Interval) => void;
  onStartTimeChange: (value: string) => void;
  onLoad: () => void;
}

export function MarketDataBrowserControls({
  providers,
  symbols,
  intervals,
  selectedProvider,
  selectedSymbol,
  selectedInterval,
  startTimeLocal,
  statsLoading,
  loadingInitial,
  canLoad,
  onProviderChange,
  onSymbolChange,
  onIntervalChange,
  onStartTimeChange,
  onLoad,
}: MarketDataBrowserControlsProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: '#1e222d',
        borderRadius: '4px',
        border: '1px solid #2b2b43',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ flex: '1 1 180px' }}>
        <label
          style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
        >
          Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => onProviderChange(e.target.value)}
          disabled={statsLoading}
          style={{
            width: '100%',
            padding: '8px',
            background: '#131722',
            color: '#fff',
            border: '1px solid #2b2b43',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {providers.length === 0 && <option value="">No providers</option>}
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: '1 1 220px' }}>
        <label
          style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
        >
          Symbol
        </label>
        <select
          value={selectedSymbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          disabled={statsLoading || symbols.length === 0}
          style={{
            width: '100%',
            padding: '8px',
            background: '#131722',
            color: '#fff',
            border: '1px solid #2b2b43',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {symbols.length === 0 && <option value="">No symbols</option>}
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: '0 0 120px' }}>
        <label
          style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
        >
          Interval
        </label>
        <select
          value={selectedInterval}
          onChange={(e) => onIntervalChange(e.target.value as Interval)}
          disabled={statsLoading || intervals.length === 0}
          style={{
            width: '100%',
            padding: '8px',
            background: '#131722',
            color: '#fff',
            border: '1px solid #2b2b43',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {intervals.length === 0 && <option value="">No intervals</option>}
          {intervals.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: '0 0 220px' }}>
        <label
          style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
        >
          Start time
        </label>
        <input
          type="datetime-local"
          value={startTimeLocal}
          onChange={(e) => onStartTimeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            background: '#131722',
            color: '#fff',
            border: '1px solid #2b2b43',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <button
        onClick={onLoad}
        disabled={!canLoad || statsLoading || loadingInitial}
        style={{
          padding: '8px 16px',
          background: canLoad && !statsLoading && !loadingInitial ? '#2962ff' : '#2b2b43',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: canLoad && !statsLoading && !loadingInitial ? 'pointer' : 'not-allowed',
          opacity: canLoad && !statsLoading && !loadingInitial ? 1 : 0.5,
          height: '36px',
        }}
      >
        {loadingInitial ? 'Loading…' : 'Load'}
      </button>
    </div>
  );
}
