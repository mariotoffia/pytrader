import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from '../../src/routes/health.js';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerHealthRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 OK with status healthy', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        status: 'ok',
        service: 'gateway',
        timestamp: expect.any(Number),
        uptime: expect.any(Number),
        version: '1.0.0',
      });
    });

    it('should return current timestamp', async () => {
      const before = Date.now();
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });
      const after = Date.now();

      const body = response.json();
      expect(body.timestamp).toBeGreaterThanOrEqual(before);
      expect(body.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
