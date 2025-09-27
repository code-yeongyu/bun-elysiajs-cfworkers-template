import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { createApp } from './app';

const app = createApp({
  adapter: CloudflareAdapter,
  aot: true
});

export default app.compile();