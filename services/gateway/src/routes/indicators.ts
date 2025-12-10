import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsClient } from '../clients/analyticsClient.js';
import {
  CalculateIndicatorsRequest,
  CalculateIndicatorsResponse,
  Interval,
  IndicatorName,
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
    try {
      const body = request.body as CalculateIndicatorsRequest;

      // Validate required fields
      if (!body.symbol || !body.interval || !body.from || !body.to || !body.indicators) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: 'Missing required fields: symbol, interval, from, to, indicators',
        });
      }

      const { symbol, interval, from, to, indicators } = body;

      // Fetch indicators from analytics service
      const results = await analyticsClient.calculateIndicators(
        symbol,
        interval as Interval,
        from,
        to,
        indicators as IndicatorName[]
      );

      const response: CalculateIndicatorsResponse = { results };
      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to calculate indicators' });
    }
  });
}
