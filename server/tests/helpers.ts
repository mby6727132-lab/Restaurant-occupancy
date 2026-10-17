import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const app = createApp();
export const api = () => request(app);

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "table_groups", "restaurants", "users" CASCADE');
}

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

/** Registers and logs in a fresh user. */
export async function createUser(fullName = 'Test User'): Promise<TestUser> {
  counter += 1;
  const email = `user${counter}_${Date.now()}@example.com`;
  const password = 'Password123!';
  const reg = await api().post('/api/auth/register').send({ fullName, email, password });
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const login = await api().post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`login failed: ${login.status}`);
  return { id: reg.body.user.id, email, password, token: login.body.token };
}

export const auth = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

export function restaurantPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'פסטה בסטה',
    ownerName: 'דנה לוי',
    ownerPhone: '050-1234567',
    street: 'דיזנגוף 100',
    city: 'תל אביב',
    location: 'מרכז',
    description: 'מסעדה איטלקית חלבית',
    type: 'DAIRY',
    imageUrl: 'https://example.com/pasta.jpg',
    tableGroups: [
      { capacity: 2, totalTables: 5 },
      { capacity: 4, totalTables: 10 },
    ],
    ...overrides,
  };
}

/** Creates a user that owns a restaurant. */
export async function createManager(overrides: Record<string, unknown> = {}) {
  const user = await createUser('Manager');
  const res = await api().post('/api/restaurants').set(auth(user)).send(restaurantPayload(overrides));
  if (res.status !== 201) throw new Error(`create restaurant failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { user, restaurant: res.body.restaurant as { id: string; tableGroups: { id: string; capacity: number }[] } };
}
