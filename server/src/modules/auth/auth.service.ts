import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { conflict, unauthorized } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import type { AuthUser } from '../../middleware/auth';
import type { LoginInput, RegisterInput } from './auth.schemas';

export type UserRole = 'USER' | 'MANAGER';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isManager: boolean;
  restaurantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** The single place that shapes user output – never includes passwordHash. */
export function toPublicUser(user: AuthUser): PublicUser {
  const isManager = user.restaurantId !== null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: isManager ? 'MANAGER' : 'USER',
    isManager,
    restaurantId: user.restaurantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const emailExists = () =>
  conflict('EMAIL_EXISTS', 'An account with this email already exists. Please log in instead.', {
    suggestion: 'login',
  });

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Shared by register and login: issues a JWT and shapes the user output. */
function createSession(user: AuthUser): AuthResult {
  return { token: signToken(user.id), user: toPublicUser(user) };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw emailExists();

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, passwordHash },
    });
    return createSession({ ...user, restaurantId: null });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw emailExists();
    throw err;
  }
}

let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('dummy-password-for-timing'));

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { restaurant: { select: { id: true } } },
  });
  // Same message (and similar timing) for unknown email and wrong password, so accounts can't be enumerated.
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');

  return createSession({ ...user, restaurantId: user.restaurant?.id ?? null });
}
