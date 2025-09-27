import { t } from 'elysia';

export const PingHeaders = t.Object({
  accept: t.Optional(t.String())
}, { additionalProperties: true });