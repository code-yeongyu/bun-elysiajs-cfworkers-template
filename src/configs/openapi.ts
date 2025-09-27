import type { ElysiaSwaggerConfig } from '@elysiajs/swagger';

export const getOpenAPIConfig = (): ElysiaSwaggerConfig => {
  return {
    documentation: {
      openapi: '3.0.3',
      info: {
        title: 'Bun ElysiaJS Cloudflare Workers Template',
        version: '1.0.0',
        description: 'API running on Cloudflare Workers',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: '/',
          description: 'Current Domain (dynamically uses current access domain)'
        }
      ],
      tags: [
        { name: 'General', description: 'General endpoints' },
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Echo', description: 'Echo and testing endpoints' }
      ],
      externalDocs: {
        description: 'Find more info here',
        url: 'https://github.com/your-repo/bun-elysiajs-cfworkers-template'
      }
    },
    path: '/swagger',
    provider: 'scalar'
  };
};
