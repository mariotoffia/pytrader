interface SymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  symbols?: string[];
}

const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'];

export function SymbolSelector({ value, onChange, symbols }: SymbolSelectorProps) {
  const availableSymbols = symbols && symbols.length > 0 ? symbols : DEFAULT_SYMBOLS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label htmlFor="symbol-select" style={{ color: '#787b86', fontSize: '11px', textTransform: 'uppercase' }}>
        Symbol
      </label>
      <select
        id="symbol-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        {availableSymbols.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
