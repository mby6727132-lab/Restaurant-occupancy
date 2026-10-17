import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, auth, createManager, createUser, resetDb, restaurantPayload } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('authentication is required for restaurant routes', () => {
  it.each([
    ['get', '/api/restaurants'],
    ['get', `/api/restaurants/${MISSING_ID}`],
    ['post', '/api/restaurants'],
    ['patch', `/api/restaurants/${MISSING_ID}`],
    ['put', `/api/restaurants/${MISSING_ID}/table-groups`],
    ['patch', `/api/restaurants/${MISSING_ID}/table-groups/${MISSING_ID}`],
  ] as const)('%s %s → 401 without token', async (method, url) => {
    const res = await api()[method](url).send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/restaurants', () => {
  it('creates the restaurant with table groups and turns the same account into a manager', async () => {
    const user = await createUser();
    const res = await api().post('/api/restaurants').set(auth(user)).send(restaurantPayload());
    expect(res.status).toBe(201);
    const r = res.body.restaurant;
    expect(r).toMatchObject({
      name: 'פסטה בסטה',
      type: 'DAIRY',
      city: 'תל אביב',
      isOwner: true,
      ownerPhone: '050-1234567',
    });
    expect(r).not.toHaveProperty('ownerId');
    expect(r.tableGroups).toHaveLength(2);
    expect(r.occupancy).toMatchObject({ totalSeats: 50, occupiedSeats: 0, freeSeats: 50, occupancyPercent: 0 });

    const me = await api().get('/api/auth/me').set(auth(user));
    expect(me.body.user).toMatchObject({ role: 'MANAGER', isManager: true, restaurantId: r.id });
  });

  it('allows optional fields to be omitted', async () => {
    const user = await createUser();
    const payload = restaurantPayload();
    delete (payload as Record<string, unknown>).ownerPhone;
    delete (payload as Record<string, unknown>).imageUrl;
    delete (payload as Record<string, unknown>).location;
    const res = await api().post('/api/restaurants').set(auth(user)).send(payload);
    expect(res.status).toBe(201);
    expect(res.body.restaurant).toMatchObject({ ownerPhone: null, imageUrl: null, location: null });
  });

  it('returns 409 when the account already has a restaurant', async () => {
    const { user } = await createManager();
    const res = await api().post('/api/restaurants').set(auth(user)).send(restaurantPayload({ name: 'Second' }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RESTAURANT_EXISTS');
    expect(await prisma.restaurant.count()).toBe(1);
  });

  it('merges duplicate capacities', async () => {
    const user = await createUser();
    const res = await api()
      .post('/api/restaurants')
      .set(auth(user))
      .send(
        restaurantPayload({
          tableGroups: [
            { capacity: 4, totalTables: 3 },
            { capacity: 4, totalTables: 2, occupiedTables: 1 },
          ],
        }),
      );
    expect(res.status).toBe(201);
    expect(res.body.restaurant.tableGroups).toHaveLength(1);
    expect(res.body.restaurant.tableGroups[0]).toMatchObject({ capacity: 4, totalTables: 5, occupiedTables: 1 });
  });

  it.each([
    ['missing name', { name: undefined }, 'name'],
    ['blank ownerName', { ownerName: '  ' }, 'ownerName'],
    ['missing street', { street: undefined }, 'street'],
    ['missing city', { city: undefined }, 'city'],
    ['missing description', { description: undefined }, 'description'],
    ['invalid type', { type: 'VEGAN' }, 'type'],
    ['invalid phone', { ownerPhone: 'call me' }, 'ownerPhone'],
    ['invalid imageUrl', { imageUrl: 'javascript:alert(1)' }, 'imageUrl'],
    ['no table groups', { tableGroups: [] }, 'tableGroups'],
    ['missing table groups', { tableGroups: undefined }, 'tableGroups'],
    ['zero capacity', { tableGroups: [{ capacity: 0, totalTables: 2 }] }, 'tableGroups.0.capacity'],
    ['negative tables', { tableGroups: [{ capacity: 2, totalTables: -1 }] }, 'tableGroups.0.totalTables'],
    ['fractional tables', { tableGroups: [{ capacity: 2, totalTables: 1.5 }] }, 'tableGroups.0.totalTables'],
    ['occupied > total', { tableGroups: [{ capacity: 2, totalTables: 2, occupiedTables: 3 }] }, 'tableGroups.0.occupiedTables'],
    ['zero tables overall', { tableGroups: [{ capacity: 2, totalTables: 0 }] }, 'tableGroups'],
    ['unknown field (ownerId)', { ownerId: MISSING_ID }, ''],
  ])('returns 400 for %s and saves nothing', async (_name, override, path) => {
    const user = await createUser();
    const res = await api().post('/api/restaurants').set(auth(user)).send(restaurantPayload(override));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(path);
    expect(await prisma.restaurant.count()).toBe(0);
  });
});

describe('GET /api/restaurants/:id', () => {
  it('returns details, groups and occupancy to any logged-in user, without the private phone', async () => {
    const { restaurant } = await createManager();
    const guest = await createUser('Guest');
    const res = await api().get(`/api/restaurants/${restaurant.id}`).set(auth(guest));
    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({ id: restaurant.id, isOwner: false, ownerName: 'דנה לוי' });
    expect(res.body.restaurant).not.toHaveProperty('ownerPhone');
    expect(res.body.restaurant).not.toHaveProperty('ownerId');
    expect(JSON.stringify(res.body)).not.toContain('050-1234567');
    expect(res.body.restaurant.occupancy.totalSeats).toBe(50);
  });

  it('includes the phone for the owner', async () => {
    const { user, restaurant } = await createManager();
    const res = await api().get(`/api/restaurants/${restaurant.id}`).set(auth(user));
    expect(res.body.restaurant).toMatchObject({ isOwner: true, ownerPhone: '050-1234567' });
  });

  it('a manager can view other restaurants (but they are not marked as theirs)', async () => {
    const a = await createManager({ name: 'A' });
    const b = await createManager({ name: 'B' });
    const res = await api().get(`/api/restaurants/${b.restaurant.id}`).set(auth(a.user));
    expect(res.status).toBe(200);
    expect(res.body.restaurant.isOwner).toBe(false);
    expect(res.body.restaurant).not.toHaveProperty('ownerPhone');
  });

  it('returns 404 for unknown or malformed ids', async () => {
    const u = await createUser();
    const missing = await api().get(`/api/restaurants/${MISSING_ID}`).set(auth(u));
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('RESTAURANT_NOT_FOUND');
    expect((await api().get('/api/restaurants/not-a-uuid').set(auth(u))).status).toBe(404);
  });
});

describe('PATCH /api/restaurants/:id', () => {
  it('lets the owner edit details', async () => {
    const { user, restaurant } = await createManager();
    const res = await api()
      .patch(`/api/restaurants/${restaurant.id}`)
      .set(auth(user))
      .send({ name: 'שם חדש', type: 'MEAT', ownerPhone: null, imageUrl: '' });
    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({ name: 'שם חדש', type: 'MEAT', ownerPhone: null, imageUrl: null });
    // untouched fields stay
    expect(res.body.restaurant.city).toBe('תל אביב');
    expect(res.body.restaurant.location).toBe('מרכז');
  });

  it('returns 403 for a regular user', async () => {
    const { restaurant } = await createManager();
    const guest = await createUser();
    const res = await api().patch(`/api/restaurants/${restaurant.id}`).set(auth(guest)).send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it("returns 403 for another manager and leaves the restaurant unchanged", async () => {
    const a = await createManager({ name: 'A' });
    const b = await createManager({ name: 'B' });
    const res = await api().patch(`/api/restaurants/${b.restaurant.id}`).set(auth(a.user)).send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    const stored = await prisma.restaurant.findUniqueOrThrow({ where: { id: b.restaurant.id } });
    expect(stored.name).toBe('B');
  });

  it('returns 404 for an unknown restaurant', async () => {
    const { user } = await createManager();
    const res = await api().patch(`/api/restaurants/${MISSING_ID}`).set(auth(user)).send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it.each([
    ['empty body', {}],
    ['blank name', { name: '' }],
    ['invalid type', { type: 'PAREVE' }],
    ['changing the owner', { ownerId: MISSING_ID }],
    ['table groups through this route', { tableGroups: [] }],
  ])('returns 400 for %s', async (_name, body) => {
    const { user, restaurant } = await createManager();
    const res = await api().patch(`/api/restaurants/${restaurant.id}`).set(auth(user)).send(body);
    expect(res.status).toBe(400);
  });
});

describe('restaurants cannot be deleted', () => {
  it('has no DELETE route', async () => {
    const { user, restaurant } = await createManager();
    const res = await api().delete(`/api/restaurants/${restaurant.id}`).set(auth(user));
    expect(res.status).toBe(404);
    expect(await prisma.restaurant.count()).toBe(1);
  });
});

describe('PUT /api/restaurants/:id/table-groups', () => {
  it('replaces the groups, keeps ids for unchanged capacities and recalculates occupancy', async () => {
    const { user, restaurant } = await createManager();
    const id4 = restaurant.tableGroups.find((g) => g.capacity === 4)!.id;

    const res = await api()
      .put(`/api/restaurants/${restaurant.id}/table-groups`)
      .set(auth(user))
      .send({
        tableGroups: [
          { capacity: 4, totalTables: 3, occupiedTables: 1 },
          { capacity: 6, totalTables: 2, occupiedTables: 2 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.tableGroups.map((g: { capacity: number }) => g.capacity)).toEqual([4, 6]); // capacity 2 removed
    expect(res.body.tableGroups[0].id).toBe(id4);
    // total 3×4 + 2×6 = 24; occupied 1×4 + 2×6 = 16; free 2×4 = 8
    expect(res.body.occupancy).toMatchObject({ totalSeats: 24, occupiedSeats: 16, freeSeats: 8, occupancyPercent: 67 });
    expect(res.body.adjustments).toEqual([]);
  });

  it('allows changing tables while tables are occupied and clamps occupied when total drops below it', async () => {
    const { user, restaurant } = await createManager();
    const url = `/api/restaurants/${restaurant.id}/table-groups`;
    await api()
      .put(url)
      .set(auth(user))
      .send({ tableGroups: [{ capacity: 4, totalTables: 10, occupiedTables: 8 }] });

    // Manager lowers total to 5 and re-sends the stored occupied value (8)
    const res = await api()
      .put(url)
      .set(auth(user))
      .send({ tableGroups: [{ capacity: 4, totalTables: 5, occupiedTables: 8 }] });
    expect(res.status).toBe(200);
    expect(res.body.tableGroups[0]).toMatchObject({ totalTables: 5, occupiedTables: 5, freeTables: 0 });
    expect(res.body.adjustments).toHaveLength(1);
    expect(res.body.adjustments[0]).toMatchObject({ capacity: 4, requestedOccupiedTables: 8, occupiedTables: 5 });
    expect(res.body.occupancy.occupancyPercent).toBe(100);
  });

  it('keeps the stored occupied value when it is omitted', async () => {
    const { user, restaurant } = await createManager();
    const url = `/api/restaurants/${restaurant.id}/table-groups`;
    await api().put(url).set(auth(user)).send({ tableGroups: [{ capacity: 4, totalTables: 10, occupiedTables: 4 }] });
    const res = await api().put(url).set(auth(user)).send({ tableGroups: [{ capacity: 4, totalTables: 12 }] });
    expect(res.body.tableGroups[0]).toMatchObject({ totalTables: 12, occupiedTables: 4 });
  });

  it('returns 400 for a new occupied value above the total, and changes nothing', async () => {
    const { user, restaurant } = await createManager();
    const res = await api()
      .put(`/api/restaurants/${restaurant.id}/table-groups`)
      .set(auth(user))
      .send({ tableGroups: [{ capacity: 4, totalTables: 2, occupiedTables: 3 }] });
    expect(res.status).toBe(400);
    expect(await prisma.tableGroup.count({ where: { restaurantId: restaurant.id } })).toBe(2);
  });

  it.each([
    ['empty list', { tableGroups: [] }],
    ['no tables at all', { tableGroups: [{ capacity: 4, totalTables: 0 }] }],
    ['negative occupied', { tableGroups: [{ capacity: 4, totalTables: 2, occupiedTables: -1 }] }],
    ['missing body', {}],
  ])('returns 400 for %s', async (_name, body) => {
    const { user, restaurant } = await createManager();
    const res = await api().put(`/api/restaurants/${restaurant.id}/table-groups`).set(auth(user)).send(body);
    expect(res.status).toBe(400);
  });

  it('returns 403 for a non-owner and 404 for an unknown restaurant', async () => {
    const { restaurant } = await createManager();
    const other = await createUser();
    const body = { tableGroups: [{ capacity: 2, totalTables: 1 }] };
    expect((await api().put(`/api/restaurants/${restaurant.id}/table-groups`).set(auth(other)).send(body)).status).toBe(403);
    expect((await api().put(`/api/restaurants/${MISSING_ID}/table-groups`).set(auth(other)).send(body)).status).toBe(404);
  });
});

describe('PATCH /api/restaurants/:id/table-groups/:groupId', () => {
  it('updates occupied tables and returns the new occupancy summary', async () => {
    const { user, restaurant } = await createManager();
    const g4 = restaurant.tableGroups.find((g) => g.capacity === 4)!;
    const res = await api()
      .patch(`/api/restaurants/${restaurant.id}/table-groups/${g4.id}`)
      .set(auth(user))
      .send({ occupiedTables: 8 });
    expect(res.status).toBe(200);
    expect(res.body.tableGroup).toMatchObject({ id: g4.id, capacity: 4, totalTables: 10, occupiedTables: 8, freeTables: 2 });
    expect(res.body.occupancy).toMatchObject({ totalSeats: 50, occupiedSeats: 32, freeSeats: 18, occupancyPercent: 64 });

    // visible to guests
    const guest = await createUser();
    const detail = await api().get(`/api/restaurants/${restaurant.id}`).set(auth(guest));
    expect(detail.body.restaurant.occupancy.freeSeats).toBe(18);
  });

  it('clamps occupied tables when total is lowered below it, with an adjustment notice', async () => {
    const { user, restaurant } = await createManager();
    const g4 = restaurant.tableGroups.find((g) => g.capacity === 4)!;
    const url = `/api/restaurants/${restaurant.id}/table-groups/${g4.id}`;
    await api().patch(url).set(auth(user)).send({ occupiedTables: 8 });
    const res = await api().patch(url).set(auth(user)).send({ totalTables: 6 });
    expect(res.status).toBe(200);
    expect(res.body.tableGroup).toMatchObject({ totalTables: 6, occupiedTables: 6 });
    expect(res.body.adjustments[0]).toMatchObject({ requestedOccupiedTables: 8, occupiedTables: 6 });
  });

  it('can change the capacity, but not to one used by another group', async () => {
    const { user, restaurant } = await createManager();
    const g4 = restaurant.tableGroups.find((g) => g.capacity === 4)!;
    const url = `/api/restaurants/${restaurant.id}/table-groups/${g4.id}`;
    const ok = await api().patch(url).set(auth(user)).send({ capacity: 6 });
    expect(ok.status).toBe(200);
    expect(ok.body.occupancy.totalSeats).toBe(5 * 2 + 10 * 6);
    const dup = await api().patch(url).set(auth(user)).send({ capacity: 2 });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_CAPACITY');
  });

  it.each([
    ['occupied above total', { occupiedTables: 11 }],
    ['negative occupied', { occupiedTables: -1 }],
    ['zero capacity', { capacity: 0 }],
    ['empty body', {}],
    ['string number', { occupiedTables: '3' }],
  ])('returns 400 for %s', async (_name, body) => {
    const { user, restaurant } = await createManager();
    const g4 = restaurant.tableGroups.find((g) => g.capacity === 4)!;
    const res = await api().patch(`/api/restaurants/${restaurant.id}/table-groups/${g4.id}`).set(auth(user)).send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 when the change would leave the restaurant with no tables', async () => {
    const { user, restaurant } = await createManager({ tableGroups: [{ capacity: 4, totalTables: 2 }] });
    const g = restaurant.tableGroups[0]!;
    const res = await api()
      .patch(`/api/restaurants/${restaurant.id}/table-groups/${g.id}`)
      .set(auth(user))
      .send({ totalTables: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a group of another restaurant or an unknown group', async () => {
    const a = await createManager({ name: 'A' });
    const b = await createManager({ name: 'B' });
    const bGroup = b.restaurant.tableGroups[0]!;
    const cross = await api()
      .patch(`/api/restaurants/${a.restaurant.id}/table-groups/${bGroup.id}`)
      .set(auth(a.user))
      .send({ occupiedTables: 1 });
    expect(cross.status).toBe(404);
    expect(cross.body.error.code).toBe('TABLE_GROUP_NOT_FOUND');
    const unknown = await api()
      .patch(`/api/restaurants/${a.restaurant.id}/table-groups/${MISSING_ID}`)
      .set(auth(a.user))
      .send({ occupiedTables: 1 });
    expect(unknown.status).toBe(404);
  });

  it("returns 403 when a manager edits another restaurant's group", async () => {
    const a = await createManager({ name: 'A' });
    const b = await createManager({ name: 'B' });
    const bGroup = b.restaurant.tableGroups[0]!;
    const res = await api()
      .patch(`/api/restaurants/${b.restaurant.id}/table-groups/${bGroup.id}`)
      .set(auth(a.user))
      .send({ occupiedTables: 1 });
    expect(res.status).toBe(403);
    const stored = await prisma.tableGroup.findUniqueOrThrow({ where: { id: bGroup.id } });
    expect(stored.occupiedTables).toBe(0);
  });
});

describe('database constraints', () => {
  it('rejects invalid table counts even when bypassing the API', async () => {
    const { restaurant } = await createManager();
    const g = restaurant.tableGroups[0]!;
    await expect(prisma.tableGroup.update({ where: { id: g.id }, data: { occupiedTables: 999 } })).rejects.toThrow();
    await expect(prisma.tableGroup.update({ where: { id: g.id }, data: { capacity: 0 } })).rejects.toThrow();
    await expect(prisma.tableGroup.update({ where: { id: g.id }, data: { totalTables: -1 } })).rejects.toThrow();
  });
});
