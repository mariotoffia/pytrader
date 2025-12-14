/**
 * Backfill API routes
 *
 * Endpoint for manually triggering historical data backfill
 */

import { FastifyInstance } from 'fastify';
import { ProviderManager } from '../providers/providerManager.js';
import { CandleRepository } from '../storage/repository.js';
import { BackfillRequestSchema } from '@pytrader/shared/schemas';
import { BackfillRequest, BackfillResponse, DataProvider } from '@pytrader/shared/types';
import { normalizeCandle } from '../normalizer.js';

export async function registerBackfillRoutes(
  fastify: FastifyInstance,
  providerManager: ProviderManager,
  repository: CandleRepository
): Promise<void> {
  /**
   * POST /internal/backfill
   * Manual backfill for specific provider/symbol/interval
   */
  fastify.post<{ Body: BackfillRequest }>('/internal/backfill', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = BackfillRequestSchema.safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid backfill request',
          details: validationResult.error.format(),
        });
      }

      const backfillRequest = validationResult.data;

      // Calculate time range
      let from: number;
      let to: number;

      if (backfillRequest.hours !== undefined) {
        // Use hours to calculate range
        const now = Date.now();
        from = now - backfillRequest.hours * 60 * 60 * 1000;
        to = now;
      } else if (backfillRequest.from !== undefined && backfillRequest.to !== undefined) {
        // Use provided from/to
        from = backfillRequest.from;
        to = backfillRequest.to;
      } else {
        // This should not happen due to Zod validation, but TypeScript needs it
        return reply.status(400).send({
          error: 'Invalid time range',
          message: 'Must provide either (from AND to) OR hours',
        });
      }

      // Get provider instance
      const provider = providerManager.getProvider(backfillRequest.provider as DataProvider);

      if (!provider) {
        return reply.status(404).send({
          error: 'Provider not found',
          message: `Provider '${backfillRequest.provider}' not found`,
        });
      }

      // Check if provider is connected
      if (!provider.isConnected()) {
        return reply.status(503).send({
          error: 'Provider not connected',
          message: `Provider '${backfillRequest.provider}' is not currently connected`,
        });
      }

      // Perform backfill
      fastify.log.info(
        `Backfilling ${backfillRequest.provider} ${backfillRequest.symbol} ${backfillRequest.interval} from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`
      );

      const rawCandles = await provider.getHistoricalCandles(
        backfillRequest.symbol,
        backfillRequest.interval,
        from,
        to
      );

      // Normalize and insert candles
      const candles = rawCandles.map(normalizeCandle);
      const candlesInserted = repository.insertCandles(candles);

      const duration = Date.now() - startTime;

      const response: BackfillResponse = {
        success: true,
        provider: backfillRequest.provider,
        symbol: backfillRequest.symbol,
        interval: backfillRequest.interval,
        candlesInserted,
        candlesFetched: rawCandles.length,
        timeRange: { from, to },
        duration,
      };

      fastify.log.info(
        `Backfill complete: ${candlesInserted} candles inserted (${rawCandles.length} fetched) in ${duration}ms`
      );

      return reply.status(200).send(response);
    } catch (error) {
      const duration = Date.now() - startTime;

      fastify.log.error({ error }, 'Error during backfill');

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        return reply.status(429).send({
          error: 'Rate limit exceeded',
          message: 'Provider rate limit exceeded. Please try again later.',
        });
      }

      return reply.status(500).send({
        error: 'Backfill failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
    }
  });

  fastify.log.info('Backfill routes registered');
}
