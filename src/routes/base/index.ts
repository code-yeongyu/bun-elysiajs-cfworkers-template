import { Elysia } from 'elysia';
import { getHelloWorldRoute } from './get_hello_world';
import { pingRoute } from './ping';
import { checkHealthRoute } from './check_health';
import { echoRoute } from './echo';

export const baseRouter = new Elysia()
  .use(getHelloWorldRoute)
  .use(pingRoute)
  .use(checkHealthRoute)
  .use(echoRoute);
