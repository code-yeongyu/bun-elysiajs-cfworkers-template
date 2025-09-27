import { t } from 'elysia';

export const CheckHealthResponse = t.Object({
  status: t.Literal('healthy'),
  timestamp: t.String(),
  uptime: t.Number()
});