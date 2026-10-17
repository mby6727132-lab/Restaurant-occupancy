import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, auth, createManager, createUser, resetDb, type TestUser } from './helpers';

let guest: TestUser;

/** Restaurant fixtures with known free seats. */
beforeAll(async () => {
  await resetDb();
  // free seats: 2×2 + 4×4 = 20 (nothing occupied); 0% occupancy
  await createManager({
    name: 'Pasta Basta',
    city: 'תל אביב',
    location: 'מרכז',
    type: 'DAIRY',
    tableGroups: [
      { capacity: 2, totalTables: 2 },
      { capacity: 4, totalTables: 4 },
    ],
  });
  // free seats: 4×1 = 4 of 40; 90% occupancy
  await createManager({
    name: 'Burger Bar',
    city: 'חיפה',
    location: 'צפון',
    type: 'MEAT',
    tableGroups: [{ capacity: 4, totalTables: 10, occupiedTables: 9 }],
  });
  // free seats: 0 of 12; 100% occupancy
  await createManager({
    name: 'Steak House',
    city: 'תל אביב',
    location: 'נמל',
    type: 'MEAT',
    tableGroups: [{ capacity: 6, totalTables: 2, occupiedTables: 2 }],
  });
  guest = await createUser('Guest');
});
afterAll(() => prisma.$disconnect());

const names = (body: { items: { name: string }[] }) => body.items.map((r) => r.name);

async function search(query: Record<string, string | number>) {
  const res = await api().get('/api/restaurants').query(query).set(auth(guest));
  expect(res.status).toBe(200);
  return res.body;
}

describe('GET /api/restaurants – list, search and filters', () => {
  it('lists all restaurants sorted by name by default, with computed occupancy and total', async () => {
    const body = await search({});
    expect(body.total).toBe(3);
    expect(names(body)).toEqual(['Burger Bar', 'Pasta Basta', 'Steak House']);
    const burger = body.items[0];
    expect(burger.occupancy).toMatchObject({ totalSeats: 40, freeSeats: 4, occupancyPercent: 90, freeTables: 1 });
  });

  it('never includes the private phone number of other owners', async () => {
    const res = await api().get('/api/restaurants').set(auth(guest));
    for (const r of res.body.items) {
      expect(r).not.toHaveProperty('ownerPhone');
      expect(r).not.toHaveProperty('ownerId');
    }
    expect(JSON.stringify(res.body)).not.toContain('050-1234567');
  });

  it('searches by name (case-insensitive, partial)', async () => {
    expect(names(await search({ q: 'burg' }))).toEqual(['Burger Bar']);
    expect(names(await search({ q: 'HOUSE' }))).toEqual(['Steak House']);
    expect((await search({ q: 'nothing-matches' })).total).toBe(0);
  });

  it('filters by city', async () => {
    expect(names(await search({ city: 'תל אביב' }))).toEqual(['Pasta Basta', 'Steak House']);
  });

  it('filters by location (matches the location field or the city)', async () => {
    expect(names(await search({ location: 'צפון' }))).toEqual(['Burger Bar']);
    expect(names(await search({ location: 'חיפה' }))).toEqual(['Burger Bar']);
  });

  it('filters by type (case-insensitive value)', async () => {
    expect(names(await search({ type: 'MEAT' }))).toEqual(['Burger Bar', 'Steak House']);
    expect(names(await search({ type: 'dairy' }))).toEqual(['Pasta Basta']);
  });

  it('filters by minimum free seats', async () => {
    expect(names(await search({ minFreeSeats: 5 }))).toEqual(['Pasta Basta']);
    expect(names(await search({ minFreeSeats: 4 }))).toEqual(['Burger Bar', 'Pasta Basta']);
    expect((await search({ minFreeSeats: 0 })).total).toBe(3);
  });

  it('combines filters', async () => {
    expect(names(await search({ type: 'MEAT', city: 'תל אביב' }))).toEqual(['Steak House']);
    expect(names(await search({ type: 'MEAT', minFreeSeats: 1 }))).toEqual(['Burger Bar']);
  });

  it('sorts by free seats and occupancy', async () => {
    expect(names(await search({ sort: '-freeSeats' }))).toEqual(['Pasta Basta', 'Burger Bar', 'Steak House']);
    expect(names(await search({ sort: 'occupancy' }))).toEqual(['Pasta Basta', 'Burger Bar', 'Steak House']);
    expect(names(await search({ sort: '-name' }))).toEqual(['Steak House', 'Pasta Basta', 'Burger Bar']);
  });

  it('ignores empty query parameters', async () => {
    expect((await search({ q: '', type: '', minFreeSeats: '' })).total).toBe(3);
  });

  it.each([
    ['invalid type', { type: 'VEGAN' }],
    ['negative minFreeSeats', { minFreeSeats: -1 }],
    ['non-numeric minFreeSeats', { minFreeSeats: 'many' }],
    ['unknown sort', { sort: 'rating' }],
  ])('returns 400 for %s', async (_name, query) => {
    const res = await api().get('/api/restaurants').query(query).set(auth(guest));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('managers see all restaurants too, with their own marked isOwner', async () => {
    const { user } = await createManager({ name: 'Mine', tableGroups: [{ capacity: 2, totalTables: 1 }] });
    const res = await api().get('/api/restaurants').set(auth(user));
    expect(res.body.total).toBe(4);
    const mine = res.body.items.find((r: { name: string }) => r.name === 'Mine');
    expect(mine.isOwner).toBe(true);
    expect(res.body.items.filter((r: { isOwner: boolean }) => r.isOwner)).toHaveLength(1);
  });
});
