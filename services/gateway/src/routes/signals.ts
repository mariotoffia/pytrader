import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsClient } from '../clients/analyticsClient.js';
import {
  GenerateSignalsRequest,
  GenerateSignalsResponse,
  Interval,
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
    try {
      const body = request.body as GenerateSignalsRequest;

      // Validate required fields
      if (!body.symbol || !body.interval || !body.from || !body.to || !body.strategyId) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: 'Missing required fields: symbol, interval, from, to, strategyId',
        });
      }

      const { symbol, interval, from, to, strategyId } = body;

      // Fetch signals from analytics service
      const signals = await analyticsClient.generateSignals(
        symbol,
        interval as Interval,
        from,
        to,
        strategyId
      );

      const response: GenerateSignalsResponse = { signals };
      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate signals' });
    }
  });
}
