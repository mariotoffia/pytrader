import { useState } from 'react';
import { Chart } from './components/Chart';
import { SymbolSelector } from './components/SymbolSelector';
import { IntervalSelector } from './components/IntervalSelector';
import { useCandles } from './hooks/useCandles';
import { Interval } from './types';

const GATEWAY_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/stream';

function App() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [interval, setInterval] = useState<Interval>('1m');

  const { candles, loading, error, isConnected } = useCandles({
    symbol,
    interval,
    gatewayUrl: GATEWAY_URL,
    wsUrl: WS_URL,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
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
          <h1 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>PyTrader</h1>
          <SymbolSelector value={symbol} onChange={setSymbol} />
          <IntervalSelector value={interval} onChange={setInterval} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
        {loading && (
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
            Loading candles...
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

        {!loading && !error && candles.length > 0 && <Chart candles={candles} symbol={symbol} />}

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

export default App;
