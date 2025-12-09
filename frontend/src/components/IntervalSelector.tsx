import { Interval } from '../types';

interface IntervalSelectorProps {
  value: Interval;
  onChange: (interval: Interval) => void;
}

const INTERVALS: Interval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

export function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label htmlFor="interval-select" style={{ fontWeight: 'bold', color: '#fff' }}>
        Interval:
      </label>
      <select
        id="interval-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Interval)}
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
        {INTERVALS.map((interval) => (
          <option key={interval} value={interval}>
            {interval}
          </option>
        ))}
      </select>
    </div>
  );
}
