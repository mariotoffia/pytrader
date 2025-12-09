import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const startTime = Date.now();

/**
 * Register health check route
 */
export async function registerHealthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /health - Service health check
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const uptime = Date.now() - startTime;
    return reply.send({
      status: 'ok',
      service: 'gateway',
      timestamp: Date.now(),
      uptime,
      version: '1.0.0',
    });
  });
}
