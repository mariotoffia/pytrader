import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsClient, UpstreamServiceError } from '../clients/analyticsClient.js';
import {
  GenerateSignalsRequest,
  GenerateSignalsResponse,
  Interval,
  DataProvider,
} from '@pytrader/shared/types';

/**
 * Register signal-related routes
 */
export async function registerSignalRoutes(
  fastify: FastifyInstance,
  analyticsClient: AnalyticsClient
): Promise<void> {
  /**
   * POST /signals - Generate trading signals (proxied to analytics service)
   */
  fastify.post('/signals', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('x-request-id', request.id);
    try {
      const body = request.body as GenerateSignalsRequest;

      // Validate required fields
      if (
        !body.provider ||
        !body.symbol ||
        !body.interval ||
        !body.from ||
        !body.to ||
        !body.strategyId
      ) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: 'Missing required fields: provider, symbol, interval, from, to, strategyId',
        });
      }

      const { provider, symbol, interval, from, to, strategyId } = body;

      // Fetch signals from analytics service
      const signals = await analyticsClient.generateSignals(
        provider as DataProvider,
        symbol,
        interval as Interval,
        from,
        to,
        strategyId,
        { requestId: request.id }
      );

      const response: GenerateSignalsResponse = { signals };
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

      fastify.log.error({ requestId: request.id, err: error }, 'Failed to generate signals');
      return reply.status(500).send({ error: 'Failed to generate signals' });
    }
  });
}
