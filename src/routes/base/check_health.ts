import { Elysia } from 'elysia';
import { CheckHealthResponse } from './schemas/responses/check_health';

const startTime = Date.now();

export const checkHealthRoute = new Elysia().get(
  '/health',
  () => ({
    status: 'healthy' as const,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000)
  }),
  {
    response: CheckHealthResponse,
    detail: {
      summary: 'Health check',
      description: 'Returns service health status',
      tags: ['Health']
    }
  }
);
