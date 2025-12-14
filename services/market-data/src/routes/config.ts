/**
 * Configuration API routes
 *
 * Endpoints for managing multi-provider configuration at runtime
 */

import { FastifyInstance } from 'fastify';
import { ConfigManager } from '../config/configManager.js';
import { ProviderManager } from '../providers/providerManager.js';
import { MultiProviderConfigSchema } from '@pytrader/shared/schemas';

export async function registerConfigRoutes(
  fastify: FastifyInstance,
  configManager: ConfigManager,
  providerManager: ProviderManager
): Promise<void> {
  /**
   * GET /internal/config
   * Retrieve current configuration
   */
  fastify.get('/internal/config', async (_request, reply) => {
    try {
      const config = configManager.getConfig();
      return reply.status(200).send(config);
    } catch (error) {
      fastify.log.error({ error }, 'Error retrieving configuration');
      return reply.status(500).send({
        error: 'Failed to retrieve configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /internal/config
   * Update configuration
   * Validates, saves to file, and applies to ProviderManager
   */
  fastify.put('/internal/config', async (request, reply) => {
    try {
      // Validate request body
      const validationResult = MultiProviderConfigSchema.safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Invalid configuration',
          details: validationResult.error.format(),
        });
      }

      const newConfig = validationResult.data;

      // Update configuration (saves to file)
      await configManager.updateConfig(newConfig);

      // Apply configuration to providers
      fastify.log.info('Applying updated configuration to providers...');
      await providerManager.applyConfiguration(newConfig.providers);
      fastify.log.info('Configuration applied successfully');

      return reply.status(200).send({
        success: true,
        config: newConfig,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error updating configuration');
      return reply.status(500).send({
        error: 'Failed to update configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /internal/config/reload
   * Reload configuration from file and apply to providers
   */
  fastify.post('/internal/config/reload', async (_request, reply) => {
    try {
      // Reload from file
      const config = configManager.reloadConfig();

      // Apply configuration to providers
      fastify.log.info('Applying reloaded configuration to providers...');
      await providerManager.applyConfiguration(config.providers);
      fastify.log.info('Reloaded configuration applied successfully');

      return reply.status(200).send({
        success: true,
        config,
      });
    } catch (error) {
      fastify.log.error({ error }, 'Error reloading configuration');
      return reply.status(500).send({
        error: 'Failed to reload configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.log.info('Configuration routes registered');
}
