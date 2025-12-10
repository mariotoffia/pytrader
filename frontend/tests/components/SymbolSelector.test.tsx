import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymbolSelector } from '../../src/components/SymbolSelector';

describe('SymbolSelector', () => {
  it('should render with initial value', () => {
    const mockOnChange = vi.fn();
    render(<SymbolSelector value="BTC/USDT" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Symbol:') as HTMLSelectElement;
    expect(select.value).toBe('BTC/USDT');
  });

  it('should render all available symbols', () => {
    const mockOnChange = vi.fn();
    render(<SymbolSelector value="BTC/USDT" onChange={mockOnChange} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('BTC/USDT');
    expect(options[1]).toHaveTextContent('ETH/USDT');
    expect(options[2]).toHaveTextContent('BNB/USDT');
    expect(options[3]).toHaveTextContent('SOL/USDT');
  });

  it('should call onChange when symbol is selected', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();

    render(<SymbolSelector value="BTC/USDT" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Symbol:');
    await user.selectOptions(select, 'ETH/USDT');

    expect(mockOnChange).toHaveBeenCalledWith('ETH/USDT');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should update value when prop changes', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(<SymbolSelector value="BTC/USDT" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Symbol:') as HTMLSelectElement;
    expect(select.value).toBe('BTC/USDT');

    rerender(<SymbolSelector value="ETH/USDT" onChange={mockOnChange} />);
    expect(select.value).toBe('ETH/USDT');
  });

  it('should have correct select element attributes', () => {
    const mockOnChange = vi.fn();
    render(<SymbolSelector value="BTC/USDT" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Symbol:');
    expect(select).toHaveAttribute('id', 'symbol-select');
  });
});
