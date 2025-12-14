import {
  CalculateIndicatorsRequest,
  CalculateIndicatorsResponse,
  GenerateSignalsResponse,
  IndicatorResult,
  Signal,
  Interval,
  IndicatorName,
  DataProvider,
} from '@pytrader/shared/types';

import { UpstreamServiceError } from './upstreamServiceError.js';

/**
 * HTTP client for Analytics Service
 */
export class AnalyticsClient {
  constructor(private baseUrl: string) {}

  /**
   * Calculate technical indicators
   */
  async calculateIndicators(
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    from: number,
    to: number,
    indicators: IndicatorName[],
    options?: { requestId?: string }
  ): Promise<IndicatorResult[]> {
    const url = `${this.baseUrl}/internal/indicators`;
    const body: CalculateIndicatorsRequest = {
      provider,
      symbol,
      interval,
      from,
      to,
      indicators,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let upstreamBody: string | undefined;
      try {
        upstreamBody = await response.text();
      } catch {
        // ignore
      }
      throw new UpstreamServiceError(
        `Analytics Service error: ${response.status} ${response.statusText}`,
        { url, status: response.status, statusText: response.statusText, body: upstreamBody },
        options?.requestId
      );
    }

    const data = (await response.json()) as CalculateIndicatorsResponse;
    return data.results;
  }

  /**
   * Generate trading signals
   */
  async generateSignals(
    provider: DataProvider,
    symbol: string,
    interval: Interval,
    from: number,
    to: number,
    strategyId: string,
    options?: { requestId?: string }
  ): Promise<Signal[]> {
    const url = `${this.baseUrl}/internal/signals`;
    // Convert to snake_case for Python API
    const body = {
      provider,
      symbol,
      interval,
      from,
      to,
      strategy_id: strategyId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let upstreamBody: string | undefined;
      try {
        upstreamBody = await response.text();
      } catch {
        // ignore
      }
      throw new UpstreamServiceError(
        `Analytics Service error: ${response.status} ${response.statusText}`,
        { url, status: response.status, statusText: response.statusText, body: upstreamBody },
        options?.requestId
      );
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
