import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GetSymbolsResponse, Symbol } from '@pytrader/shared/types';

/**
 * Register symbol-related routes
 */
export async function registerSymbolRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /symbols - Get list of supported trading symbols
   */
  fastify.get('/symbols', async (request: FastifyRequest, reply: FastifyReply) => {
    // For now, return hardcoded list of supported symbols
    // In production, this could be fetched from market-data service
    const symbols: Symbol[] = [
      {
        symbol: 'BTC/USDT',
        exchange: 'binance',
        type: 'crypto',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
      },
      {
        symbol: 'ETH/USDT',
        exchange: 'binance',
        type: 'crypto',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
      },
      {
        symbol: 'BNB/USDT',
        exchange: 'binance',
        type: 'crypto',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
      },
      {
        symbol: 'SOL/USDT',
        exchange: 'binance',
        type: 'crypto',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
      },
    ];

    const response: GetSymbolsResponse = { symbols };
    return reply.send(response);
  });
}
