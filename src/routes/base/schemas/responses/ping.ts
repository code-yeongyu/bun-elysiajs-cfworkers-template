import { t } from 'elysia';

export const PingResponse = t.Object({
  message: t.String(),
  timestamp: t.String()
});