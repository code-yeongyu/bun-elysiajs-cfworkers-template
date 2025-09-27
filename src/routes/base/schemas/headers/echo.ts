import { t } from 'elysia';

export const EchoHeaders = t.Object({
  'content-type': t.Optional(t.String())
}, { additionalProperties: true });