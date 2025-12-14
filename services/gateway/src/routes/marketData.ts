import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MarketDataClient } from '../clients/marketDataClient.js';
import { UpstreamServiceError } from '../clients/upstreamServiceError.js';
import {
  PageCandlesRequestSchema,
  MultiProviderConfigSchema,
  BackfillRequestSchema,
} from '@pytrader/shared/schemas';
import {
  CandlePageDirection,
  DataProvider,
  DeleteCandlesRequest,
  Interval,
  PageCandlesRequest,
  MultiProviderConfig,
  BackfillRequest,
} from '@pytrader/shared/types';

/**
 * Register market data management routes
 */
export async function registerMarketDataRoutes(
  fastify: FastifyInstance,
  marketDataClient: MarketDataClient
): Promise<void> {
  function upstreamToGatewayStatus(upstreamStatus: number): number {
    if (upstreamStatus === 0) return 503;
    if (upstreamStatus >= 400 && upstreamStatus < 500) return upstreamStatus;
    return 502;
  }

  function sendMarketDataUpstreamError(
    requestId: string,
    reply: FastifyReply,
    error: UpstreamServiceError,
    message: string
  ): FastifyReply {
    fastify.log.error({ requestId, upstream: error.upstream, err: error }, 'Market-data upstream error');
    return reply.status(upstreamToGatewayStatus(error.upstream.status)).send({
      error: message,
      upstreamStatus: error.upstream.status,
      upstreamBody: error.upstream.body?.slice(0, 2000),
      requestId,
    });
  }

  const validProviders = new Set<DataProvider>(['binance', 'coinbase', 'mock']);

  /**
   * GET /market-data/stats - Get overall market data statistics
   */
  fastify.get('/market-data/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
    try {
      const stats = await marketDataClient.getStatistics();
      return reply.send(stats);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch statistics');
      return reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  /**
   * GET /market-data/stats/detailed - Get detailed statistics breakdown
   */
  fastify.get(
    '/market-data/stats/detailed',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.header('x-request-id', _request.id);
      try {
        const stats = await marketDataClient.getDetailedStats();
        return reply.send(stats);
      } catch (error) {
        if (error instanceof UpstreamServiceError) {
          return sendMarketDataUpstreamError(_request.id, reply, error, 'Market data service error');
        }

        fastify.log.error({ requestId: _request.id, err: error }, 'Failed to fetch detailed statistics');
        return reply.status(500).send({ error: 'Failed to fetch detailed statistics' });
      }
    }
  );

  /**
   * DELETE /market-data/candles - Delete candles with filters
   */
  fastify.delete('/market-data/candles', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
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
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to delete candles');
      return reply.status(500).send({ error: 'Failed to delete candles' });
    }
  });

  /**
   * GET /market-data/candles/page - Cursor-based paging for candle browsing
   */
  fastify.get('/market-data/candles/page', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
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
      const result = await marketDataClient.getCandlesPage(
        provider,
        symbol,
        interval,
        cursor,
        direction,
        limit
      );
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch paged candles');
      return reply.status(500).send({ error: 'Failed to fetch paged candles' });
    }
  });

  /**
   * GET /market-data/config - Get current multi-provider configuration
   */
  fastify.get('/market-data/config', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', _request.id);
    try {
      const config = await marketDataClient.getConfig();
      return reply.send(config);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(_request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: _request.id, err: error }, 'Failed to fetch configuration');
      return reply.status(500).send({ error: 'Failed to fetch configuration' });
    }
  });

  /**
   * PUT /market-data/config - Update multi-provider configuration
   */
  fastify.put('/market-data/config', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
    try {
      const validationResult = MultiProviderConfigSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid configuration',
          details: validationResult.error.format(),
        });
      }

      const result = await marketDataClient.updateConfig(
        validationResult.data as MultiProviderConfig
      );
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to update configuration');
      return reply.status(500).send({ error: 'Failed to update configuration' });
    }
  });

  /**
   * POST /market-data/config/reload - Reload configuration from file
   */
  fastify.post(
    '/market-data/config/reload',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.header('x-request-id', _request.id);
      try {
        const result = await marketDataClient.reloadConfig();
        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamServiceError) {
          return sendMarketDataUpstreamError(_request.id, reply, error, 'Market data service error');
        }

        fastify.log.error({ requestId: _request.id, err: error }, 'Failed to reload configuration');
        return reply.status(500).send({ error: 'Failed to reload configuration' });
      }
    }
  );

  /**
   * GET /market-data/providers - Get all provider statuses
   */
  fastify.get('/market-data/providers', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', _request.id);
    try {
      const result = await marketDataClient.getProviders();
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(_request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: _request.id, err: error }, 'Failed to fetch provider statuses');
      return reply.status(500).send({ error: 'Failed to fetch provider statuses' });
    }
  });

  /**
   * GET /market-data/providers/:provider/tickers - Get supported tickers for a provider
   */
  fastify.get(
    '/market-data/providers/:provider/tickers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header('x-request-id', request.id);
      try {
        const { provider } = request.params as { provider: string };
        if (!validProviders.has(provider as DataProvider)) {
          return reply.status(404).send({
            error: 'Provider not found',
            message: `Provider '${provider}' is not supported`,
          });
        }

        const result = await marketDataClient.getProviderTickers(provider as DataProvider);
        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamServiceError) {
          return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
        }

        fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch provider tickers');
        return reply.status(500).send({ error: 'Failed to fetch provider tickers' });
      }
    }
  );

  /**
   * GET /market-data/providers/:provider/intervals - Get supported intervals for a provider
   */
  fastify.get(
    '/market-data/providers/:provider/intervals',
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header('x-request-id', request.id);
      try {
        const { provider } = request.params as { provider: string };
        if (!validProviders.has(provider as DataProvider)) {
          return reply.status(404).send({
            error: 'Provider not found',
            message: `Provider '${provider}' is not supported`,
          });
        }

        const result = await marketDataClient.getProviderIntervals(provider as DataProvider);
        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamServiceError) {
          return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
        }

        fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch provider intervals');
        return reply.status(500).send({ error: 'Failed to fetch provider intervals' });
      }
    }
  );

  /**
   * GET /market-data/providers/:provider/status - Get specific provider status
   */
  fastify.get(
    '/market-data/providers/:provider/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.header('x-request-id', request.id);
      try {
        const { provider } = request.params as { provider: string };
        if (!validProviders.has(provider as DataProvider)) {
          return reply.status(404).send({
            error: 'Provider not found',
            message: `Provider '${provider}' is not supported`,
          });
        }

        const result = await marketDataClient.getProviderStatus(provider as DataProvider);
        return reply.send(result);
      } catch (error) {
        if (error instanceof UpstreamServiceError) {
          return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
        }

        fastify.log.error({ requestId: request.id, err: error }, 'Failed to fetch provider status');
        return reply.status(500).send({ error: 'Failed to fetch provider status' });
      }
    }
  );

  /**
   * POST /market-data/backfill - Trigger manual backfill
   */
  fastify.post('/market-data/backfill', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
    try {
      const validationResult = BackfillRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid backfill request',
          details: validationResult.error.format(),
        });
      }

      const result = await marketDataClient.backfill(validationResult.data as BackfillRequest);
      return reply.send(result);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        return sendMarketDataUpstreamError(request.id, reply, error, 'Market data service error');
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to trigger backfill');
      return reply.status(500).send({ error: 'Failed to trigger backfill' });
    }
  });
}
