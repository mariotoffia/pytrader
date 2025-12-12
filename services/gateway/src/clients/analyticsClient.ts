import {
  CalculateIndicatorsRequest,
  CalculateIndicatorsResponse,
  GenerateSignalsRequest,
  GenerateSignalsResponse,
  IndicatorResult,
  Signal,
  Interval,
  IndicatorName,
} from '@pytrader/shared/types';

/**
 * HTTP client for Analytics Service
 */
export class AnalyticsClient {
  constructor(private baseUrl: string) {}

  /**
   * Calculate technical indicators
   */
  async calculateIndicators(
    symbol: string,
    interval: Interval,
    from: number,
    to: number,
    indicators: IndicatorName[]
  ): Promise<IndicatorResult[]> {
    const url = `${this.baseUrl}/internal/indicators`;
    const body: CalculateIndicatorsRequest = {
      symbol,
      interval,
      from,
      to,
      indicators,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Analytics Service error: ${response.statusText}`);
    }

    const data = (await response.json()) as CalculateIndicatorsResponse;
    return data.results;
  }

  /**
   * Generate trading signals
   */
  async generateSignals(
    symbol: string,
    interval: Interval,
    from: number,
    to: number,
    strategyId: string
  ): Promise<Signal[]> {
    const url = `${this.baseUrl}/internal/signals`;
    // Convert to snake_case for Python API
    const body = {
      symbol,
      interval,
      from,
      to,
      strategy_id: strategyId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Analytics Service error: ${response.statusText}`);
    }

    const data = (await response.json()) as GenerateSignalsResponse;
    return data.signals;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
