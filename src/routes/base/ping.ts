import { Elysia } from 'elysia';
import { PingHeaders } from './schemas/headers/ping';
import { PingResponse } from './schemas/responses/ping';

export const pingRoute = new Elysia().get(
  '/ping',
  ({ headers }) => {
    const accept = headers.accept || 'application/json';
    const response = {
      message: 'pong',
      timestamp: new Date().toISOString()
    };

    if (accept.includes('text/plain')) {
      return new Response(`${response.message} at ${response.timestamp}`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return response;
  },
  {
    headers: PingHeaders,
    response: PingResponse,
    detail: {
      summary: 'Ping endpoint',
      description: 'Returns pong with timestamp',
      tags: ['General']
    }
  }
);
