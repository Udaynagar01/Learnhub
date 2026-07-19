import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export function parseObjectId(value, label = 'id') {
  return objectIdSchema.parse(value, { errorMap: () => ({ message: `Invalid ${label}` }) });
}
