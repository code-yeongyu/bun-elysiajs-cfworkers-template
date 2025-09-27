import { Elysia } from 'elysia';

const docsRoute = new Elysia({ prefix: '/docs' })
  .get('/', () => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/docs/scalar.html'
      }
    });
  })
  .get('/scalar', () => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/docs/scalar.html'
      }
    });
  })
  .get('/redoc', () => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/docs/redoc.html'
      }
    });
  })
  .get('/swagger', () => {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/docs/swagger.html'
      }
    });
  });

export { docsRoute };