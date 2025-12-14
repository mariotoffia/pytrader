/**
 * LocalStorage utilities for persisting user preferences
 */

import { DataProvider, Interval } from '@pytrader/shared/types';

export const STORAGE_KEYS = {
  SELECTED_PROVIDER: 'pytrader_selected_provider',
  SELECTED_SYMBOL: 'pytrader_selected_symbol',
  SELECTED_INTERVAL: 'pytrader_selected_interval',
} as const;

/**
 * Get stored provider selection with fallback to default
 * @param defaultProvider - Default provider if none stored (defaults to 'mock')
 */
export function getStoredProvider(defaultProvider: DataProvider = 'mock'): DataProvider {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER);
  if (stored && ['binance', 'coinbase', 'mock'].includes(stored)) {
    return stored as DataProvider;
  }
  return defaultProvider;
}

/**
 * Set stored provider selection
 */
export function setStoredProvider(provider: DataProvider): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, provider);
}

/**
 * Get stored symbol selection with fallback to default
 * @param defaultSymbol - Default symbol if none stored (defaults to 'BTC/USDT')
 */
export function getStoredSymbol(defaultSymbol: string = 'BTC/USDT'): string {
  return localStorage.getItem(STORAGE_KEYS.SELECTED_SYMBOL) || defaultSymbol;
}

/**
 * Set stored symbol selection
 */
export function setStoredSymbol(symbol: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_SYMBOL, symbol);
}

/** with fallback to default
 * @param defaultInterval - Default interval if none stored (defaults to '1m')
 */
export function getStoredInterval(defaultInterval: Interval = '1m'): Interval {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_INTERVAL);
  const validIntervals: Interval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  if (stored && validIntervals.includes(stored as Interval)) {
    return stored as Interval;
  }
  return defaultInterval;
}

/**
 * Set stored interval selection
 */
export function setStoredInterval(interval: Interval): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_INTERVAL, interval);
}

/**
 * Clear all stored preferences
 */
export function clearStoredPreferences(): void {
  localStorage.removeItem(STORAGE_KEYS.SELECTED_PROVIDER);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_SYMBOL);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_INTERVAL);
}
