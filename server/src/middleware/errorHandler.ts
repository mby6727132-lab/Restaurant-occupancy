import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/errors';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
}

interface BodyParserError {
  type: string;
  status?: number;
  expose: boolean;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return typeof err === 'object' && err !== null && 'type' in err && 'expose' in err;
}

/** Central error handler. Never leaks stack traces, SQL or secrets to the client. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // Errors raised by express.json() (malformed JSON, payload too large, ...).
  if (isBodyParserError(err)) {
    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 400;
    const malformed = err.type === 'entity.parse.failed';
    res.status(status).json({
      error: {
        code: malformed ? 'INVALID_JSON' : 'VALIDATION_ERROR',
        message: malformed ? 'Malformed JSON body' : 'Invalid request body',
      },
    });
    return;
  }

  // Unique-constraint race (e.g. two simultaneous registrations with the same email).
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'The data conflicts with an existing record' } });
    return;
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
