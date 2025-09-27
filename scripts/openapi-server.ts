#!/usr/bin/env bun
import { swagger } from '@elysiajs/swagger';
import { createApp } from '../src/app';
import { getOpenAPIConfig } from '../src/configs/openapi';

// Dedicated server for OpenAPI generation (without compile)
const createOpenAPIServer = () => {
  return createApp()
    .use(swagger(getOpenAPIConfig()));
};

// Start server
const port = parseInt(process.env.PORT || '9999');
const app = createOpenAPIServer();

console.log(`🚀 Starting OpenAPI generation server on port ${port}...`);

const server = Bun.serve({
  port,
  fetch: app.fetch,
  hostname: 'localhost'
});

console.log(`✅ OpenAPI server started at http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/swagger`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/swagger/json`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down OpenAPI server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down OpenAPI server...');
  server.stop();
  process.exit(0);
});
