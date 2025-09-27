import { Elysia } from 'elysia';
import { baseRouter } from './routes/base';
import { docsRoute } from './routes/docs';

export const createApp = (config?: ConstructorParameters<typeof Elysia>[0]) => {
  return new Elysia(config)
    .use(baseRouter)
    .use(docsRoute);
};