# Bun ElysiaJS Cloudflare Workers Template

A production-ready API template built with Bun, ElysiaJS, and Cloudflare Workers. Ships with automatic OpenAPI documentation generation and type-safe request/response validation.

## Why This Stack

- **Type-safe**: Elysia's type system catches errors at compile time
- **Fast**: Elysia AOT compilation with no runtime overhead
- **Auto-documented**: Define schemas once, get OpenAPI specs automatically

Standard Elysia has [limitations when running on Cloudflare Workers](https://elysiajs.com/integrations/cloudflare-worker.html#limitations) - notably, TypeGen (automatic type generation) doesn't work in the Workers environment. This template solves these issues by generating OpenAPI specifications at build time and serving them as [static assets](https://developers.cloudflare.com/workers/static-assets/) from Cloudflare Workers. All documentation (openapi.json, Swagger UI, Redoc, and Scalar) is pre-generated and bundled as static files, ensuring fast delivery and AOT compilation compatibility.

## Requirements

- [Bun](https://bun.sh/)
- Cloudflare Workers account (for deployment)

## Quick Start

```bash
# Install dependencies
bun install

# Generate OpenAPI spec
bun run generate:openapi

# Start dev server
bun run dev
```

Your API runs at `http://localhost:8787`
Documentation lives at `http://localhost:8787/docs`

## Project Structure

```
src/
├── index.ts              # Cloudflare Workers entry (AOT compiled)
├── app.ts                # App factory
├── config/
│   └── openapi.ts        # OpenAPI configuration
└── routes/
    ├── base/
    │   ├── index.ts      # Route aggregator
    │   ├── echo.ts       # Example endpoint
    │   └── schemas/      # Type definitions
    │       ├── requests/
    │       ├── responses/
    │       └── headers/
    └── docs/             # Documentation routes
```

## Configuration

### OpenAPI Settings

Edit `src/config/openapi.ts` to customize your API documentation:

```typescript
export const getOpenAPIConfig = (): ElysiaSwaggerConfig => {
  return {
    documentation: {
      info: {
        title: 'Your API Name',
        version: '1.0.0',
        description: 'API description'
      },
      servers: [
        { url: 'https://your-domain.workers.dev', description: 'Production' }
      ],
      tags: [
        { name: 'YourTag', description: 'Tag description' }
      ]
    },
    path: '/swagger',
    provider: 'scalar'
  };
};
```

### Cloudflare Workers

Update `wrangler.toml` with your project details:

```toml
name = "your-project-name"
main = "src/index.ts"
compatibility_date = "2025-06-01"
compatibility_flags = ["nodejs_compat"]
```

## Writing Endpoints

This is where it gets good. Define types once, get validation and docs automatically.

### 1. Define Schemas

Create your request/response schemas using Elysia's type system:

```typescript
// src/routes/example/schemas/requests/create_user.ts
import { t } from 'elysia';

export const CreateUserRequest = t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
  age: t.Optional(t.Number({ minimum: 0 }))
});
```

```typescript
// src/routes/example/schemas/responses/create_user.ts
import { t } from 'elysia';

export const CreateUserResponse = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  createdAt: t.String()
});
```

### 2. Create Endpoint

Wire up your schemas to an endpoint:

```typescript
// src/routes/example/create_user.ts
import { Elysia } from 'elysia';
import { CreateUserRequest } from './schemas/requests/create_user';
import { CreateUserResponse } from './schemas/responses/create_user';

export const createUserRoute = new Elysia().post(
  '/users',
  ({ body }) => {
    // TypeScript knows the shape of `body` here
    return {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };
  },
  {
    body: CreateUserRequest,
    response: CreateUserResponse,
    detail: {
      summary: 'Create a new user',
      description: 'Creates a user account with the provided details',
      tags: ['Users']
    }
  }
);
```

### 3. Register Route

Add your route to the router:

```typescript
// src/routes/example/index.ts
import { Elysia } from 'elysia';
import { createUserRoute } from './create_user';

export const exampleRouter = new Elysia()
  .use(createUserRoute);
```

Then register the router in `src/app.ts`:

```typescript
import { exampleRouter } from './routes/example';

export const createApp = (config?: ConstructorParameters<typeof Elysia>[0]) => {
  return new Elysia(config)
    .use(baseRouter)
    .use(exampleRouter)  // Add this
    .use(docsRoute);
};
```

### 4. Regenerate OpenAPI Spec

```bash
bun run generate:openapi
```

That's it. Your endpoint is now:
- Type-checked at compile time
- Validated at runtime
- Documented in OpenAPI/Swagger

## How It Works

The key difference is in two components:

1. **AOT Compilation** (`src/index.ts`):
```typescript
const app = createApp({
  adapter: CloudflareAdapter,
  aot: true  // Ahead-of-time compilation for Cloudflare
});

export default app.compile();
```

2. **Static Documentation Serving** (`src/routes/docs/index.ts`):
```typescript
const getOpenAPISpec = async () => {
  const module = await import('./generated/openapi.json');
  return module.default;
};
```

The OpenAPI spec and all documentation interfaces are pre-generated at build time and served as [static assets](https://developers.cloudflare.com/workers/static-assets/) from Cloudflare Workers. This approach enables both AOT compilation performance and complete API documentation without runtime generation overhead.

## Development

```bash
# Type checking
bun run typecheck

# Run tests
bun run test

# Format code
bun run format

# Lint
bun run lint

# Test OpenAPI freshness
bun run test:openapi
```

The freshness test ensures your OpenAPI spec stays in sync with your routes. It fails if route files are modified after the spec was generated.

## Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy
```

This command:
1. Generates fresh OpenAPI spec
2. Runs freshness tests
3. Deploys to Cloudflare Workers

Configure deployment environments in `wrangler.toml`:

```toml
[env.production]
name = "your-project-production"
```

## Performance Notes

- **Cold start**: ~10ms (thanks to AOT compilation)
- **Request handling**: Sub-millisecond for simple routes
- **Bundle size**: Minimal (Elysia is lean)

The combination of Bun's build speed, Elysia's AOT, and Cloudflare's edge network means your API responds fast from anywhere.

## License

MIT
