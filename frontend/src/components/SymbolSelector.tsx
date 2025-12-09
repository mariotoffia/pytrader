interface SymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'];

export function SymbolSelector({ value, onChange }: SymbolSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label htmlFor="symbol-select" style={{ fontWeight: 'bold', color: '#fff' }}>
        Symbol:
      </label>
      <select
        id="symbol-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #2b2b43',
          background: '#1e222d',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {SYMBOLS.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
