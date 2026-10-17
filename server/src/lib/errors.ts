export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RESTAURANT_NOT_FOUND'
  | 'TABLE_GROUP_NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'RESTAURANT_EXISTS'
  | 'DUPLICATE_CAPACITY'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

/** An error that is safe to show to the client as-is. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'VALIDATION_ERROR', message, details);
export const unauthorized = (code: ErrorCode = 'UNAUTHORIZED', message = 'Authentication required') =>
  new HttpError(401, code, message);
export const forbidden = (message = 'You are not allowed to perform this action') =>
  new HttpError(403, 'FORBIDDEN', message);
export const notFound = (code: ErrorCode, message: string) => new HttpError(404, code, message);
export const conflict = (code: ErrorCode, message: string, details?: unknown) =>
  new HttpError(409, code, message, details);
