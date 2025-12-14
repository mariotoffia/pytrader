import { DataProvider, ProviderConfig, ProviderStatus, Interval } from '@pytrader/shared/types';
import { MultiSelect } from './MultiSelect';

interface ProviderConfigCardProps {
  provider: DataProvider;
  config: ProviderConfig;
  status: ProviderStatus | null;
  availableSymbols: string[];
  availableIntervals: Interval[];
  onChange: (config: ProviderConfig) => void;
  disabled?: boolean;
}

/**
 * Card component for editing individual provider configuration
 */
export function ProviderConfigCard({
  provider,
  config,
  status,
  availableSymbols,
  availableIntervals,
  onChange,
  disabled = false,
}: ProviderConfigCardProps) {
  const handleEnabledChange = (enabled: boolean) => {
    onChange({ ...config, enabled });
  };

  const handleSymbolsChange = (symbols: string[]) => {
    onChange({ ...config, symbols });
  };

  const handleIntervalsChange = (intervals: string[]) => {
    onChange({ ...config, intervals: intervals as Interval[] });
  };

  const handleBackfillChange = (backfillOnStartup: boolean) => {
    onChange({ ...config, backfillOnStartup });
  };

  // Determine status indicator
  const getStatusIndicator = () => {
    if (!status) {
      return { color: '#9ca3af', text: 'Unknown' };
    }
    if (status.errorState) {
      return { color: '#ef4444', text: `Error: ${status.errorState}` };
    }
    if (status.connected) {
      return { color: '#10b981', text: 'Connected' };
    }
    if (status.enabled) {
      return { color: '#f59e0b', text: 'Enabled (Not Connected)' };
    }
    return { color: '#6b7280', text: 'Disabled' };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <div className="provider-card">
      <div className="provider-header">
        <div className="provider-title-row">
          <h3 className="provider-name">{provider.toUpperCase()}</h3>
          <div className="status-indicator" style={{ color: statusIndicator.color }}>
            <span className="status-dot" style={{ backgroundColor: statusIndicator.color }} />
            {statusIndicator.text}
          </div>
        </div>

        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            disabled={disabled}
          />
          <span className="toggle-slider" />
          <span className="toggle-label">{config.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      {config.enabled && (
        <div className="provider-body">
          <MultiSelect
            label="Symbols"
            options={availableSymbols.map((symbol) => ({ value: symbol, label: symbol }))}
            selected={config.symbols}
            onChange={handleSymbolsChange}
            disabled={disabled}
          />

          <MultiSelect
            label="Intervals"
            options={availableIntervals.map((interval) => ({ value: interval, label: interval }))}
            selected={config.intervals}
            onChange={handleIntervalsChange}
            disabled={disabled}
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.backfillOnStartup}
              onChange={(e) => handleBackfillChange(e.target.checked)}
              disabled={disabled}
            />
            <span>Backfill historical data on startup</span>
          </label>

          {status && status.subscriptions.length > 0 && (
            <div className="active-subscriptions">
              <h4>Active Subscriptions</h4>
              <ul>
                {status.subscriptions.map((sub, idx) => (
                  <li key={idx}>
                    {sub.symbol} - {sub.interval}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .provider-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          background-color: #ffffff;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .provider-header {
          margin-bottom: 1rem;
        }

        .provider-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .provider-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
        }

        .toggle-switch {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .toggle-switch input[type="checkbox"] {
          display: none;
        }

        .toggle-slider {
          position: relative;
          width: 44px;
          height: 24px;
          background-color: #d1d5db;
          border-radius: 12px;
          transition: background-color 0.2s;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          left: 2px;
          top: 2px;
          background-color: #ffffff;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle-switch input[type="checkbox"]:checked + .toggle-slider {
          background-color: #3b82f6;
        }

        .toggle-switch input[type="checkbox"]:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-switch input[type="checkbox"]:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-label {
          font-weight: 500;
          color: #374151;
        }

        .provider-body {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .checkbox-label span {
          color: #374151;
        }

        .active-subscriptions {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }

        .active-subscriptions h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .active-subscriptions ul {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .active-subscriptions li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
