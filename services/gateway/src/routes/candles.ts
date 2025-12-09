import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketDataClient } from '../clients/marketDataClient.js';
import { GetCandlesRequestSchema } from '@pytrader/shared/schemas';
import { GetCandlesRequest, GetCandlesResponse, Interval } from '@pytrader/shared/types';

/**
 * Register candle-related routes
 */
export async function registerCandleRoutes(
  fastify: FastifyInstance,
  marketDataClient: MarketDataClient
): Promise<void> {
  /**
   * GET /candles - Get historical candles (proxied to market-data service)
   */
  fastify.get('/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query parameters
      const query = request.query as Record<string, string>;
      const params: GetCandlesRequest = {
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

      const { symbol, interval, from, to } = validationResult.data;

      // Fetch candles from market-data service
      const candles = await marketDataClient.getCandles(symbol, interval, from, to);

      const response: GetCandlesResponse = { candles };
      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch candles' });
    }
  });
}
