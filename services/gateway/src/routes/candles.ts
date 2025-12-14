import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketDataClient } from '../clients/marketDataClient.js';
import { UpstreamServiceError } from '../clients/upstreamServiceError.js';
import { GetCandlesRequestSchema } from '@pytrader/shared/schemas';
import {
  GetCandlesRequest,
  GetCandlesResponse,
  Interval,
  DataProvider,
} from '@pytrader/shared/types';

/**
 * Register candle-related routes
 */
export async function registerCandleRoutes(
  fastify: FastifyInstance,
  marketDataClient: MarketDataClient
): Promise<void> {
  /**
   * GET /candles - Get historical candles for a specific provider (proxied to market-data service)
   */
  fastify.get('/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
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

      // Fetch candles from market-data service
      const candles = await marketDataClient.getCandles(provider, symbol, interval, from, to);

      const response: GetCandlesResponse = { candles };
      return reply.send(response);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        fastify.log.error(
          { requestId: request.id, upstream: error.upstream, err: error },
          'Market-data upstream error'
        );
        const status =
          error.upstream.status === 0
            ? 503
            : error.upstream.status >= 400 && error.upstream.status < 500
              ? error.upstream.status
              : 502;
        return reply.status(status).send({
          error: 'Market data service error',
          upstreamStatus: error.upstream.status,
          upstreamBody: error.upstream.body?.slice(0, 2000),
          requestId: request.id,
        });
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch candles');
      return reply.status(500).send({ error: 'Failed to fetch candles' });
    }
  });
}
