import { Elysia } from 'elysia';
import { EchoRequest } from './schemas/requests/echo';
import { EchoResponse } from './schemas/responses/echo';
import { EchoHeaders } from './schemas/headers/echo';

export const echoRoute = new Elysia().post(
  '/echo',
  ({ body, headers }) => {
    const contentType = headers['content-type'] || 'application/json';

    if (contentType.includes('application/json')) {
      return body;
    }

    return new Response(String(body), {
      headers: { 'Content-Type': contentType }
    });
  },
  {
    body: EchoRequest,
    headers: EchoHeaders,
    response: EchoResponse,
    detail: {
      summary: 'Echo endpoint',
      description: 'Echoes back the request body',
      tags: ['General']
    }
  }
);
