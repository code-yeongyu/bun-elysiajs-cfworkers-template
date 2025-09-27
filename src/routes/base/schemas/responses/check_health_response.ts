import { z } from 'zod';

export const CheckHealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number()
});

export type CheckHealthResponse = z.infer<typeof CheckHealthResponseSchema>;
