import { useState } from 'react';
import { useMarketDataManagement } from '../hooks/useMarketDataManagement';
import config from '../config';

export function MarketDataMgmt() {
  const { stats, loading, error, deleteCandles, refetch } = useMarketDataManagement({
    gatewayUrl: config.gatewayUrl,
  });

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedInterval, setSelectedInterval] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteType, setDeleteType] = useState<'provider' | 'interval' | 'both' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extract unique values for filters
  const providers = Array.from(new Set(stats.map((s) => s.provider))).sort();
  const intervals = Array.from(new Set(stats.map((s) => s.interval))).sort();
  const symbols = Array.from(new Set(stats.map((s) => s.symbol))).sort();

  // Calculate totals
  const totalCandles = stats.reduce((sum, s) => sum + s.count, 0);

  const handleDelete = (type: 'provider' | 'interval' | 'both') => {
    setDeleteType(type);
    setConfirmDelete(true);
  };

  const executeDelete = async () => {
    if (!deleteType) return;

    try {
      setIsDeleting(true);
      setSuccessMessage(null);

      let filters = {};
      if (deleteType === 'provider') {
        filters = { provider: selectedProvider };
      } else if (deleteType === 'interval') {
        filters = { interval: selectedInterval };
      } else if (deleteType === 'both') {
        filters = { provider: selectedProvider, interval: selectedInterval };
      }

      const result = await deleteCandles(filters);
      setSuccessMessage(`Successfully deleted ${result.deletedCount} candles`);
      setConfirmDelete(false);
      setDeleteType(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Filter stats based on selections
  const filteredStats = stats.filter((s) => {
    if (selectedProvider && s.provider !== selectedProvider) return false;
    if (selectedInterval && s.interval !== selectedInterval) return false;
    if (selectedSymbol && s.symbol !== selectedSymbol) return false;
    return true;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#131722',
        padding: '24px',
        gap: '24px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', marginBottom: '8px' }}>
          Market Data Management
        </h1>
        <p style={{ margin: 0, color: '#787b86', fontSize: '14px' }}>
          Manage stored market data by provider, symbol, and interval
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(38, 166, 154, 0.1)',
            border: '1px solid #26a69a',
            borderRadius: '4px',
            color: '#26a69a',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid #ef5350',
            borderRadius: '4px',
            color: '#ef5350',
            fontSize: '14px',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Statistics Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '16px',
            background: '#1e222d',
            borderRadius: '4px',
            border: '1px solid #2b2b43',
          }}
        >
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>
            Total Candles
          </div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
            {totalCandles.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#1e222d',
            borderRadius: '4px',
            border: '1px solid #2b2b43',
          }}
        >
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>Providers</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>{providers.length}</div>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#1e222d',
            borderRadius: '4px',
            border: '1px solid #2b2b43',
          }}
        >
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>Symbols</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>{symbols.length}</div>
        </div>
        <div
          style={{
            padding: '16px',
            background: '#1e222d',
            borderRadius: '4px',
            border: '1px solid #2b2b43',
          }}
        >
          <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '4px' }}>Intervals</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>{intervals.length}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div
        style={{
          padding: '16px',
          background: '#1e222d',
          borderRadius: '4px',
          border: '1px solid #2b2b43',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px' }}>Filters & Actions</h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Provider Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
            >
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
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
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Interval Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
            >
              Interval
            </label>
            <select
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(e.target.value)}
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
              <option value="">All Intervals</option>
              {intervals.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label
              style={{ display: 'block', color: '#787b86', fontSize: '12px', marginBottom: '4px' }}
            >
              Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
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
              <option value="">All Symbols</option>
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delete Actions */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleDelete('provider')}
            disabled={!selectedProvider || loading || isDeleting}
            style={{
              padding: '8px 16px',
              background: selectedProvider && !loading && !isDeleting ? '#ef5350' : '#2b2b43',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: selectedProvider && !loading && !isDeleting ? 'pointer' : 'not-allowed',
              opacity: selectedProvider && !loading && !isDeleting ? 1 : 0.5,
            }}
          >
            Delete All ({selectedProvider || 'Provider'})
          </button>

          <button
            onClick={() => handleDelete('interval')}
            disabled={!selectedInterval || loading || isDeleting}
            style={{
              padding: '8px 16px',
              background: selectedInterval && !loading && !isDeleting ? '#ef5350' : '#2b2b43',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: selectedInterval && !loading && !isDeleting ? 'pointer' : 'not-allowed',
              opacity: selectedInterval && !loading && !isDeleting ? 1 : 0.5,
            }}
          >
            Delete All ({selectedInterval || 'Interval'})
          </button>

          <button
            onClick={() => handleDelete('both')}
            disabled={!selectedProvider || !selectedInterval || loading || isDeleting}
            style={{
              padding: '8px 16px',
              background:
                selectedProvider && selectedInterval && !loading && !isDeleting
                  ? '#ef5350'
                  : '#2b2b43',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor:
                selectedProvider && selectedInterval && !loading && !isDeleting
                  ? 'pointer'
                  : 'not-allowed',
              opacity: selectedProvider && selectedInterval && !loading && !isDeleting ? 1 : 0.5,
            }}
          >
            Delete ({selectedProvider || 'Provider'} + {selectedInterval || 'Interval'})
          </button>

          <button
            onClick={refetch}
            disabled={loading || isDeleting}
            style={{
              padding: '8px 16px',
              background: '#2962ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: loading || isDeleting ? 'not-allowed' : 'pointer',
              opacity: loading || isDeleting ? 0.5 : 1,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1e222d',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #2b2b43',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px' }}>
              Confirm Deletion
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#d1d4dc', fontSize: '14px' }}>
              Are you sure you want to delete candles? This action cannot be undone.
            </p>
            <div style={{ color: '#787b86', fontSize: '12px', marginBottom: '16px' }}>
              {deleteType === 'provider' && `Provider: ${selectedProvider}`}
              {deleteType === 'interval' && `Interval: ${selectedInterval}`}
              {deleteType === 'both' &&
                `Provider: ${selectedProvider}, Interval: ${selectedInterval}`}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteType(null);
                }}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  background: '#2b2b43',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  background: '#ef5350',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div
        style={{
          background: '#1e222d',
          borderRadius: '4px',
          border: '1px solid #2b2b43',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#131722', borderBottom: '1px solid #2b2b43' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Provider
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Symbol
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Interval
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Candles
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Oldest
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#787b86',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Newest
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: '24px', textAlign: 'center', color: '#787b86' }}
                  >
                    Loading statistics...
                  </td>
                </tr>
              )}
              {!loading && filteredStats.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: '24px', textAlign: 'center', color: '#787b86' }}
                  >
                    No data available
                  </td>
                </tr>
              )}
              {!loading &&
                filteredStats.map((stat, idx) => (
                  <tr
                    key={`${stat.provider}-${stat.symbol}-${stat.interval}`}
                    style={{
                      borderBottom: idx < filteredStats.length - 1 ? '1px solid #2b2b43' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#d1d4dc', fontSize: '14px' }}>
                      {stat.provider}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#d1d4dc', fontSize: '14px' }}>
                      {stat.symbol}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#d1d4dc', fontSize: '14px' }}>
                      {stat.interval}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#d1d4dc',
                        fontSize: '14px',
                        textAlign: 'right',
                      }}
                    >
                      {stat.count.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#787b86', fontSize: '12px' }}>
                      {formatTimestamp(stat.oldestTimestamp)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#787b86', fontSize: '12px' }}>
                      {formatTimestamp(stat.newestTimestamp)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
