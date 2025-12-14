import { useState, useEffect } from 'react';
import { DataProvider, MultiProviderConfig, ProviderConfig } from '@pytrader/shared/types';
import { useConfig } from '../hooks/useConfig';
import { useProviderCapabilities } from '../hooks/useProviderCapabilities';
import { ProviderConfigCard } from '../components/ProviderConfigCard';

/**
 * Configuration Management Page
 * Allows users to configure provider settings, symbols, and intervals
 */
export function ConfigManagement() {
  const { config, loading: configLoading, error: configError, updateConfig, reloadConfig } = useConfig();
  const { capabilities, statuses, loading: capabilitiesLoading } = useProviderCapabilities();

  // Local state for editing (allows cancel without saving)
  const [editedConfig, setEditedConfig] = useState<MultiProviderConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize edited config when config loads
  useEffect(() => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config))); // Deep clone
      setHasChanges(false);
    }
  }, [config]);

  const handleProviderConfigChange = (provider: DataProvider, newConfig: ProviderConfig) => {
    if (!editedConfig) return;

    setEditedConfig({
      ...editedConfig,
      providers: {
        ...editedConfig.providers,
        [provider]: newConfig,
      },
    });
    setHasChanges(true);
  };

  const handleBackfillHoursChange = (hours: number) => {
    if (!editedConfig) return;

    setEditedConfig({
      ...editedConfig,
      defaultBackfillHours: hours,
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    setSaveStatus('saving');
    setSaveError(null);

    const success = await updateConfig(editedConfig);

    if (success) {
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setSaveError('Failed to save configuration. Please check the console for details.');
    }
  };

  const handleReload = async () => {
    if (!confirm('Reload configuration from file? Any unsaved changes will be lost.')) {
      return;
    }

    const success = await reloadConfig();

    if (success) {
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setSaveError('Failed to reload configuration.');
    }
  };

  const handleCancel = () => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config)));
      setHasChanges(false);
      setSaveStatus('idle');
      setSaveError(null);
    }
  };

  if (configLoading || capabilitiesLoading) {
    return (
      <div className="config-page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="config-page">
        <div className="error-state">
          <h2>Error Loading Configuration</h2>
          <p>{configError}</p>
        </div>
      </div>
    );
  }

  if (!editedConfig) {
    return (
      <div className="config-page">
        <div className="error-state">
          <p>No configuration available</p>
        </div>
      </div>
    );
  }

  const providers: DataProvider[] = ['binance', 'coinbase', 'mock'];

  return (
    <div className="config-page">
      <div className="config-header">
        <h1>Configuration Management</h1>
        <p className="config-subtitle">
          Manage provider settings, symbols, and intervals for market data collection
        </p>
      </div>

      {/* Global Settings */}
      <div className="global-settings-card">
        <h2>Global Settings</h2>
        <div className="settings-row">
          <label>
            Config Version:
            <input type="text" value={editedConfig.version} disabled />
          </label>
          <label>
            Default Backfill Hours:
            <input
              type="number"
              min="1"
              max="168"
              value={editedConfig.defaultBackfillHours}
              onChange={(e) => handleBackfillHoursChange(parseInt(e.target.value, 10))}
            />
          </label>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="providers-grid">
        {providers.map((provider) => (
          <ProviderConfigCard
            key={provider}
            provider={provider}
            config={editedConfig.providers[provider]}
            status={statuses[provider]}
            availableSymbols={capabilities[provider]?.supportedTickers || []}
            availableIntervals={capabilities[provider]?.supportedIntervals || []}
            onChange={(newConfig) => handleProviderConfigChange(provider, newConfig)}
            disabled={saveStatus === 'saving'}
          />
        ))}
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        {saveStatus === 'success' && (
          <div className="status-message success">Configuration saved successfully!</div>
        )}
        {saveStatus === 'error' && (
          <div className="status-message error">{saveError || 'Failed to save configuration'}</div>
        )}

        <div className="action-buttons">
          <button
            onClick={handleReload}
            disabled={saveStatus === 'saving'}
            className="btn btn-secondary"
          >
            Reload from File
          </button>
          <button
            onClick={handleCancel}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="btn btn-primary"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="unsaved-warning">
          <strong>⚠️ Unsaved Changes</strong> - Remember to save your configuration changes
        </div>
      )}

      <style>{`
        .config-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .config-header {
          margin-bottom: 2rem;
        }

        .config-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }

        .config-subtitle {
          margin: 0;
          font-size: 1rem;
          color: #6b7280;
        }

        .global-settings-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .global-settings-card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .settings-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .settings-row label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .settings-row input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .settings-row input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .action-bar {
          position: sticky;
          bottom: 0;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .status-message {
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .status-message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .status-message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.5rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .unsaved-warning {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          background-color: #fef3c7;
          color: #92400e;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #fbbf24;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state h2 {
          color: #dc2626;
        }

        .error-state p {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
