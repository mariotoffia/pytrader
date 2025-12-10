import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntervalSelector } from '../../src/components/IntervalSelector';
import { Interval } from '../../src/types';

describe('IntervalSelector', () => {
  it('should render with initial value', () => {
    const mockOnChange = vi.fn();
    render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Interval:') as HTMLSelectElement;
    expect(select.value).toBe('1m');
  });

  it('should render all available intervals', () => {
    const mockOnChange = vi.fn();
    render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(8);
    expect(options[0]).toHaveTextContent('1m');
    expect(options[1]).toHaveTextContent('5m');
    expect(options[2]).toHaveTextContent('15m');
    expect(options[3]).toHaveTextContent('30m');
    expect(options[4]).toHaveTextContent('1h');
    expect(options[5]).toHaveTextContent('4h');
    expect(options[6]).toHaveTextContent('1d');
    expect(options[7]).toHaveTextContent('1w');
  });

  it('should call onChange when interval is selected', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();

    render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Interval:');
    await user.selectOptions(select, '5m');

    expect(mockOnChange).toHaveBeenCalledWith('5m');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should update value when prop changes', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Interval:') as HTMLSelectElement;
    expect(select.value).toBe('1m');

    rerender(<IntervalSelector value="5m" onChange={mockOnChange} />);
    expect(select.value).toBe('5m');
  });

  it('should handle different interval types', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();

    render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Interval:');

    // Test selecting hourly interval
    await user.selectOptions(select, '1h');
    expect(mockOnChange).toHaveBeenCalledWith('1h');

    // Test selecting daily interval
    await user.selectOptions(select, '1d');
    expect(mockOnChange).toHaveBeenCalledWith('1d');

    // Test selecting weekly interval
    await user.selectOptions(select, '1w');
    expect(mockOnChange).toHaveBeenCalledWith('1w');
  });

  it('should have correct select element attributes', () => {
    const mockOnChange = vi.fn();
    render(<IntervalSelector value="1m" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Interval:');
    expect(select).toHaveAttribute('id', 'interval-select');
  });
});
