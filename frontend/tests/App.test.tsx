import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock the Chart component since it uses TradingView which is complex to test
vi.mock('../src/components/Chart', () => ({
  Chart: () => <div data-testid="mock-chart">Chart Component</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();

    // Mock successful candles fetch
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candles: [] }),
    } as Response);
  });

  it('should render the app with all components', async () => {
    render(<App />);

    // Check for header
    expect(screen.getByText('PyTrader')).toBeInTheDocument();

    // Check for selectors
    expect(screen.getByLabelText('Symbol:')).toBeInTheDocument();
    expect(screen.getByLabelText('Interval:')).toBeInTheDocument();
  });

  it('should show initial symbol and interval', () => {
    render(<App />);

    const symbolSelect = screen.getByLabelText('Symbol:') as HTMLSelectElement;
    const intervalSelect = screen.getByLabelText('Interval:') as HTMLSelectElement;

    expect(symbolSelect.value).toBe('BTC/USDT');
    expect(intervalSelect.value).toBe('1m');
  });

  it('should change symbol when selector is used', async () => {
    const user = userEvent.setup();
    render(<App />);

    const symbolSelect = screen.getByLabelText('Symbol:');
    await user.selectOptions(symbolSelect, 'ETH/USDT');

    const updatedSelect = screen.getByLabelText('Symbol:') as HTMLSelectElement;
    expect(updatedSelect.value).toBe('ETH/USDT');
  });

  it('should change interval when selector is used', async () => {
    const user = userEvent.setup();
    render(<App />);

    const intervalSelect = screen.getByLabelText('Interval:');
    await user.selectOptions(intervalSelect, '5m');

    const updatedSelect = screen.getByLabelText('Interval:') as HTMLSelectElement;
    expect(updatedSelect.value).toBe('5m');
  });

  it('should display candle count', async () => {
    const mockCandles = [
      {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      },
      {
        timestamp: 2000000,
        open: 50500,
        high: 51500,
        low: 49500,
        close: 51000,
        volume: 120,
      },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candles: mockCandles }),
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('2 candles')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<App />);

    expect(screen.getByText('Loading candles...')).toBeInTheDocument();
  });

  it('should show error message on fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Error loading candles')).toBeInTheDocument();
    });
  });

  it('should show "no candles" message when candles array is empty', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candles: [] }),
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No candles available/)).toBeInTheDocument();
    });
  });

  it('should render chart when candles are loaded', async () => {
    const mockCandles = [
      {
        timestamp: 1000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
      },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candles: mockCandles }),
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  it('should have correct header styling', () => {
    render(<App />);

    const header = screen.getByText('PyTrader').parentElement;
    expect(header).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
    });
  });

  it('should fetch candles with correct parameters', async () => {
    render(<App />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('/candles');
    expect(fetchCall).toContain('symbol=BTC%2FUSDT');
    expect(fetchCall).toContain('interval=1m');
  });
});
