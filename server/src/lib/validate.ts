import type { z, ZodTypeAny } from 'zod';
import { badRequest } from './errors';

/** Parses `data` with `schema`, throwing a 400 HttpError with field-level details on failure. */
export function parseOrThrow<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw badRequest('Invalid request data', details);
  }
  return result.data;
}
