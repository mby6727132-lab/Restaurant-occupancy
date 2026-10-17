import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { unauthorized } from '../lib/errors';
import { verifyToken } from '../lib/jwt';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  restaurantId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Requires a valid `Authorization: Bearer <JWT>` header.
 * The user is re-loaded from the database on every request, so tokens of deleted users stop working
 * and the manager status is always current.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header) throw unauthorized('UNAUTHORIZED', 'Missing Authorization header');

  const [scheme, token, ...extra] = header.split(' ');
  if (scheme !== 'Bearer' || !token || extra.length > 0) {
    throw unauthorized('INVALID_TOKEN', 'Authorization header must be: Bearer <token>');
  }

  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw unauthorized('TOKEN_EXPIRED', 'Token has expired');
    throw unauthorized('INVALID_TOKEN', 'Invalid token');
  }
  if (!UUID_RE.test(userId)) throw unauthorized('INVALID_TOKEN', 'Invalid token');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      restaurant: { select: { id: true } },
    },
  });
  if (!user) throw unauthorized('INVALID_TOKEN', 'User no longer exists');

  const { restaurant, ...rest } = user;
  req.user = { ...rest, restaurantId: restaurant?.id ?? null };
  next();
}

/** Narrowing helper for handlers mounted behind requireAuth. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
