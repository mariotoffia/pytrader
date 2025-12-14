import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsClient, UpstreamServiceError } from '../clients/analyticsClient.js';
import {
  CalculateIndicatorsRequest,
  CalculateIndicatorsResponse,
  Interval,
  IndicatorName,
  DataProvider,
} from '@pytrader/shared/types';

/**
 * Register indicator-related routes
 */
export async function registerIndicatorRoutes(
  fastify: FastifyInstance,
  analyticsClient: AnalyticsClient
): Promise<void> {
  /**
   * POST /indicators - Calculate technical indicators (proxied to analytics service)
   */
  fastify.post('/indicators', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
    try {
      const body = request.body as CalculateIndicatorsRequest;

      // Validate required fields
      if (
        !body.provider ||
        !body.symbol ||
        !body.interval ||
        !body.from ||
        !body.to ||
        !body.indicators
      ) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: 'Missing required fields: provider, symbol, interval, from, to, indicators',
        });
      }

      const { provider, symbol, interval, from, to, indicators } = body;

      // Fetch indicators from analytics service
      const results = await analyticsClient.calculateIndicators(
        provider as DataProvider,
        symbol,
        interval as Interval,
        from,
        to,
        indicators as IndicatorName[],
        { requestId: request.id }
      );

      const response: CalculateIndicatorsResponse = { results };
      return reply.send(response);
    } catch (error) {
      if (error instanceof UpstreamServiceError) {
        fastify.log.error(
          { requestId: request.id, upstream: error.upstream, err: error },
          'Analytics upstream error'
        );
        return reply.status(502).send({
          error: 'Analytics service error',
          upstreamStatus: error.upstream.status,
          upstreamBody: error.upstream.body?.slice(0, 2000),
          requestId: request.id,
        });
      }

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to calculate indicators');
      return reply.status(500).send({ error: 'Failed to calculate indicators' });
    }
  });
}
