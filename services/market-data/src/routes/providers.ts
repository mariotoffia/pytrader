/**
 * Provider Discovery API routes
 *
 * Endpoints for discovering provider capabilities and status
 */

import { FastifyInstance } from 'fastify';
import { ConfigManager } from '../config/configManager.js';
import { ProviderManager } from '../providers/providerManager.js';
import { DataProvider } from '@pytrader/shared/types';

export async function registerProviderRoutes(
  fastify: FastifyInstance,
  configManager: ConfigManager,
  providerManager: ProviderManager
): Promise<void> {
  /**
   * GET /internal/providers
   * List all providers with their status
   */
  fastify.get('/internal/providers', async (_request, reply) => {
    try {
      const config = configManager.getConfig();
      const statuses = providerManager.getProviderStatuses(config.providers);

      return reply.status(200).send({
        providers: statuses,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error retrieving provider statuses');
      return reply.status(500).send({
        error: 'Failed to retrieve provider statuses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /internal/providers/:provider/tickers
   * Get configured tickers for a specific provider from config.json
   */
  fastify.get<{ Params: { provider: string } }>(
    '/internal/providers/:provider/tickers',
    async (request, reply) => {
      const { provider } = request.params;

      // Validate provider name
      if (!['binance', 'coinbase', 'mock'].includes(provider)) {
        return reply.status(404).send({
          error: 'Provider not found',
          message: `Provider '${provider}' is not supported. Valid providers: binance, coinbase, mock`,
        });
      }

      try {
        // Return only configured symbols from config.json
        const config = configManager.getConfig();
        const providerConfig = config.providers[provider as DataProvider];
        const symbols = providerConfig?.symbols || [];

        return reply.status(200).send({
          provider,
          tickers: symbols,
        });
      } catch (error) {
        fastify.log.error({ error, provider }, 'Error retrieving provider tickers');
        return reply.status(500).send({
          error: 'Failed to retrieve provider tickers',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /internal/providers/:provider/intervals
   * Get configured intervals for a specific provider from config.json
   */
  fastify.get<{ Params: { provider: string } }>(
    '/internal/providers/:provider/intervals',
    async (request, reply) => {
      const { provider } = request.params;

      // Validate provider name
      if (!['binance', 'coinbase', 'mock'].includes(provider)) {
        return reply.status(404).send({
          error: 'Provider not found',
          message: `Provider '${provider}' is not supported. Valid providers: binance, coinbase, mock`,
        });
      }

      try {
        // Return only configured intervals from config.json
        const config = configManager.getConfig();
        const providerConfig = config.providers[provider as DataProvider];
        const intervals = providerConfig?.intervals || [];

        return reply.status(200).send({
          provider,
          intervals: intervals,
        });
      } catch (error) {
        fastify.log.error({ error, provider }, 'Error retrieving provider intervals');
        return reply.status(500).send({
          error: 'Failed to retrieve provider intervals',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /internal/providers/:provider/status
   * Get status for a specific provider
   */
  fastify.get<{ Params: { provider: string } }>(
    '/internal/providers/:provider/status',
    async (request, reply) => {
      const { provider } = request.params;

      // Validate provider name
      if (!['binance', 'coinbase', 'mock'].includes(provider)) {
        return reply.status(404).send({
          error: 'Provider not found',
          message: `Provider '${provider}' is not supported. Valid providers: binance, coinbase, mock`,
        });
      }

      try {
        const config = configManager.getConfig();
        const statuses = providerManager.getProviderStatuses(config.providers);
        const providerStatus = statuses.find((s) => s.name === provider);

        if (!providerStatus) {
          return reply.status(404).send({
            error: 'Provider status not found',
            message: `Status for provider '${provider}' could not be retrieved`,
          });
        }

        return reply.status(200).send(providerStatus);
      } catch (error) {
        fastify.log.error({ error, provider }, 'Error retrieving provider status');
        return reply.status(500).send({
          error: 'Failed to retrieve provider status',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  fastify.log.info('Provider discovery routes registered');
}
