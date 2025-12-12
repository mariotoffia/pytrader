import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketDataClient } from '../clients/marketDataClient.js';
import { PageCandlesRequestSchema } from '@pytrader/shared/schemas';
import { CandlePageDirection, DataProvider, DeleteCandlesRequest, Interval, PageCandlesRequest } from '@pytrader/shared/types';

/**
 * Register market data management routes
 */
export async function registerMarketDataRoutes(
  fastify: FastifyInstance,
  marketDataClient: MarketDataClient
): Promise<void> {
  /**
   * GET /market-data/stats - Get overall market data statistics
   */
  fastify.get('/market-data/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await marketDataClient.getStatistics();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  /**
   * GET /market-data/stats/detailed - Get detailed statistics breakdown
   */
  fastify.get('/market-data/stats/detailed', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await marketDataClient.getDetailedStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch detailed statistics' });
    }
  });

  /**
   * DELETE /market-data/candles - Delete candles with filters
   */
  fastify.delete('/market-data/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const filters: DeleteCandlesRequest = {
        provider: query.provider,
        symbol: query.symbol,
        interval: query.interval,
      };

      // Validate at least one filter is provided
      if (!filters.provider && !filters.symbol && !filters.interval) {
        return reply.status(400).send({
          error: 'At least one filter required: provider, symbol, or interval',
        });
      }

      const result = await marketDataClient.deleteCandles(filters);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete candles' });
    }
  });

  /**
   * GET /market-data/candles/page - Cursor-based paging for candle browsing
   */
  fastify.get('/market-data/candles/page', async (request: FastifyRequest, reply: FastifyReply) => {
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
      const result = await marketDataClient.getCandlesPage(provider, symbol, interval, cursor, direction, limit);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch paged candles' });
    }
  });
}
