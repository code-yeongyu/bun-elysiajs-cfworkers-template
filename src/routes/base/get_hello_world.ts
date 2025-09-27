import { Elysia } from 'elysia';
import { GetHelloWorldResponse } from './schemas/responses/get_hello_world';

export const getHelloWorldRoute = new Elysia().get(
  '/hello',
  () => ({
    message: 'Hello World!'
  }),
  {
    response: GetHelloWorldResponse,
    detail: {
      summary: 'Get Hello World',
      description: 'Returns a hello world message',
      tags: ['General']
    }
  }
);
