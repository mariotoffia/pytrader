import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerSymbolRoutes } from '../../src/routes/symbols.js';

describe('Symbol Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerSymbolRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /symbols', () => {
    it('should return hardcoded list of supported symbols', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/symbols',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.symbols).toBeDefined();
      expect(Array.isArray(body.symbols)).toBe(true);
      expect(body.symbols.length).toBeGreaterThan(0);
    });

    it('should return symbols with correct structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/symbols',
      });

      const body = response.json();

      expect(body.symbols[0]).toHaveProperty('symbol');
      expect(body.symbols[0]).toHaveProperty('exchange');
      expect(body.symbols[0]).toHaveProperty('type');
      expect(body.symbols[0]).toHaveProperty('baseAsset');
      expect(body.symbols[0]).toHaveProperty('quoteAsset');
    });

    it('should include BTC/USDT in symbol list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/symbols',
      });

      const body = response.json();
      const btcSymbol = body.symbols.find((s: any) => s.symbol === 'BTC/USDT');

      expect(btcSymbol).toBeDefined();
      expect(btcSymbol.baseAsset).toBe('BTC');
      expect(btcSymbol.quoteAsset).toBe('USDT');
    });
  });
});
