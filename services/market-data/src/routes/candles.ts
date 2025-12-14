import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CandleRepository } from '../storage/repository.js';
import {
  GetCandlesRequestSchema,
  GetCandlesResponseSchema,
  PageCandlesRequestSchema,
  PageCandlesResponseSchema,
} from '@pytrader/shared/schemas';
import {
  CandlePageDirection,
  DataProvider,
  GetCandlesRequest,
  Interval,
  PageCandlesRequest,
  PageCandlesResponse,
} from '@pytrader/shared/types';

/**
 * Register candle-related routes
 */
export async function registerCandleRoutes(
  fastify: FastifyInstance,
  repository: CandleRepository
): Promise<void> {
  /**
   * GET /internal/candles - Get historical candles for a specific provider
   */
  fastify.get('/internal/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query parameters
      const query = request.query as Record<string, string>;
      const params: GetCandlesRequest = {
        provider: query.provider as DataProvider,
        symbol: query.symbol,
        interval: query.interval as Interval,
        from: parseInt(query.from, 10),
        to: parseInt(query.to, 10),
      };

      const validationResult = GetCandlesRequestSchema.safeParse(params);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid request parameters',
          details: validationResult.error.format(),
        });
      }

      const { provider, symbol, interval, from, to } = validationResult.data;

      // Query candles from repository for specific provider
      const candles = repository.getCandlesByProviderAndRange(provider, symbol, interval, from, to);

      // Validate response
      const response = { candles };
      const responseValidation = GetCandlesResponseSchema.safeParse(response);
      if (!responseValidation.success) {
        fastify.log.error({ error: responseValidation.error }, 'Invalid response data');
        return reply.status(500).send({ error: 'Internal server error' });
      }

      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * GET /internal/candles/page - Cursor-based paging for candle browsing
   */
  fastify.get('/internal/candles/page', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const params: PageCandlesRequest = {
        provider: query.provider as DataProvider,
        symbol: query.symbol,
        interval: query.interval as Interval,
        cursor: parseInt(query.cursor, 10),
        direction: query.direction as CandlePageDirection | undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
      };

      const validationResult = PageCandlesRequestSchema.safeParse(params);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid request parameters',
          details: validationResult.error.format(),
        });
      }

      const { provider, symbol, interval, cursor, direction, limit } = validationResult.data;
      const candles = repository.getCandlesPage(
        provider,
        symbol,
        interval,
        cursor,
        direction,
        limit
      );

      const nextCursor = candles.length > 0 ? candles[candles.length - 1].timestamp + 1 : null;
      const prevCursor = candles.length > 0 ? candles[0].timestamp - 1 : null;

      const response: PageCandlesResponse = { candles, nextCursor, prevCursor };
      const responseValidation = PageCandlesResponseSchema.safeParse(response);
      if (!responseValidation.success) {
        fastify.log.error({ error: responseValidation.error }, 'Invalid response data');
        return reply.status(500).send({ error: 'Internal server error' });
      }

      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * GET /internal/latest-candle - Get latest candle for a symbol/interval
   */
  fastify.get('/internal/latest-candle', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const symbol = query.symbol;
      const interval = query.interval as Interval;

      if (!symbol || !interval) {
        return reply.status(400).send({
          error: 'Missing required parameters: symbol, interval',
        });
      }

      const candle = repository.getLatestCandle(symbol, interval);
      if (!candle) {
        return reply.status(404).send({
          error: 'No candles found',
        });
      }

      return reply.send({ candle });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * GET /internal/candles/stats - Get overall statistics
   */
  fastify.get('/internal/candles/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = repository.getStatistics();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  /**
   * GET /internal/candles/stats/detailed - Get detailed statistics breakdown
   */
  fastify.get(
    '/internal/candles/stats/detailed',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = repository.getDetailedStats();
        return reply.send({ stats });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * DELETE /internal/candles - Delete candles with filters
   */
  fastify.delete('/internal/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const { provider, symbol, interval } = query;

      // Require at least one filter
      if (!provider && !symbol && !interval) {
        return reply.status(400).send({
          error: 'At least one filter required: provider, symbol, or interval',
        });
      }

      const deleted = repository.deleteCandles({ provider, symbol, interval });

      fastify.log.info({ deleted, provider, symbol, interval }, 'Deleted candles');

      return reply.send({
        success: true,
        deletedCount: deleted,
        filters: { provider, symbol, interval },
        timestamp: Date.now(),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete candles' });
    }
  });
}
