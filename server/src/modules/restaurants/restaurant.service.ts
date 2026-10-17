import { Prisma, type Restaurant, type TableGroup } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError, badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import type { AuthUser } from '../../middleware/auth';
import { computeOccupancy, resolveOccupiedTables, type OccupancySummary, type OccupiedAdjustment } from './occupancy';
import type {
  CreateRestaurantInput,
  ListRestaurantsQuery,
  TableGroupInput,
  UpdateRestaurantInput,
  UpdateTableGroupInput,
} from './restaurant.schemas';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RestaurantWithGroups = Restaurant & { tableGroups: TableGroup[] };

// ---------------------------------------------------------------------------
// Output shaping
// ---------------------------------------------------------------------------

export interface TableGroupDto {
  id: string;
  capacity: number;
  totalTables: number;
  occupiedTables: number;
  freeTables: number;
}

export interface RestaurantDto {
  id: string;
  name: string;
  ownerName: string;
  /** Present only when the requester owns the restaurant. */
  ownerPhone?: string | null;
  street: string;
  city: string;
  location: string | null;
  description: string;
  type: 'MEAT' | 'DAIRY';
  imageUrl: string | null;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  occupancy: OccupancySummary;
  tableGroups: TableGroupDto[];
}

function toTableGroupDto(g: TableGroup): TableGroupDto {
  return {
    id: g.id,
    capacity: g.capacity,
    totalTables: g.totalTables,
    occupiedTables: g.occupiedTables,
    freeTables: g.totalTables - g.occupiedTables,
  };
}

/**
 * The only function that turns a DB row into API output.
 * ownerPhone and ownerId are never exposed to anyone except the owner.
 */
export function toRestaurantDto(r: RestaurantWithGroups, viewerId: string): RestaurantDto {
  const isOwner = r.ownerId === viewerId;
  const groups = [...r.tableGroups].sort((a, b) => a.capacity - b.capacity);
  return {
    id: r.id,
    name: r.name,
    ownerName: r.ownerName,
    ...(isOwner && { ownerPhone: r.ownerPhone }),
    street: r.street,
    city: r.city,
    location: r.location,
    description: r.description,
    type: r.type,
    imageUrl: r.imageUrl,
    isOwner,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    occupancy: computeOccupancy(groups),
    tableGroups: groups.map(toTableGroupDto),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const restaurantNotFound = () => notFound('RESTAURANT_NOT_FOUND', 'Restaurant not found');
const groupNotFound = () => notFound('TABLE_GROUP_NOT_FOUND', 'Table group not found');

function assertHasTables(groups: readonly { totalTables: number }[]): void {
  if (groups.reduce((sum, g) => sum + g.totalTables, 0) < 1) {
    throw badRequest('The restaurant must have at least one table', [
      { path: 'tableGroups', message: 'At least one table is required' },
    ]);
  }
}

function occupiedTooHigh(capacity: number, path: string): HttpError {
  return badRequest('occupiedTables cannot exceed totalTables', [
    { path, message: `occupiedTables for capacity ${capacity} cannot exceed totalTables` },
  ]);
}

/** Merges groups that share a capacity (spec: "prevent or merge duplicate capacities"). */
function mergeByCapacity(groups: readonly TableGroupInput[]): TableGroupInput[] {
  const merged = new Map<number, TableGroupInput>();
  for (const g of groups) {
    const prev = merged.get(g.capacity);
    if (!prev) {
      merged.set(g.capacity, { ...g });
      continue;
    }
    prev.totalTables += g.totalTables;
    if (prev.occupiedTables !== undefined || g.occupiedTables !== undefined) {
      prev.occupiedTables = (prev.occupiedTables ?? 0) + (g.occupiedTables ?? 0);
    }
  }
  return [...merged.values()];
}

/**
 * Loads the restaurant inside a transaction, locking its row so concurrent saves by the owner are
 * serialised, and verifies ownership (404 if missing, 403 if owned by someone else).
 */
async function lockOwnedRestaurant(tx: Prisma.TransactionClient, restaurantId: string, user: AuthUser): Promise<void> {
  if (!UUID_RE.test(restaurantId)) throw restaurantNotFound();
  const rows = await tx.$queryRaw<{ ownerId: string }[]>`
    SELECT "ownerId"::text AS "ownerId" FROM "restaurants" WHERE "id" = ${restaurantId}::uuid FOR UPDATE`;
  const row = rows[0];
  if (!row) throw restaurantNotFound();
  if (row.ownerId !== user.id) throw forbidden('You can only edit your own restaurant');
}

async function loadWithGroups(db: Prisma.TransactionClient, id: string): Promise<RestaurantWithGroups> {
  const r = await db.restaurant.findUnique({ where: { id }, include: { tableGroups: true } });
  if (!r) throw restaurantNotFound();
  return r;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listRestaurants(query: ListRestaurantsQuery, viewer: AuthUser): Promise<RestaurantDto[]> {
  const where: Prisma.RestaurantWhereInput = {};
  const and: Prisma.RestaurantWhereInput[] = [];
  if (query.q) and.push({ name: { contains: query.q, mode: 'insensitive' } });
  if (query.city) and.push({ city: { contains: query.city, mode: 'insensitive' } });
  if (query.location) {
    and.push({
      OR: [
        { location: { contains: query.location, mode: 'insensitive' } },
        { city: { contains: query.location, mode: 'insensitive' } },
      ],
    });
  }
  if (query.type) and.push({ type: query.type });
  // A restaurant is only listed once it is complete: created atomically with at least one table.
  and.push({ tableGroups: { some: {} } });
  where.AND = and;

  const rows = await prisma.restaurant.findMany({ where, include: { tableGroups: true } });

  // Occupancy is derived data, so the free-seats filter and computed sorts run in memory.
  let items = rows.map((r) => toRestaurantDto(r, viewer.id));
  if (query.minFreeSeats !== undefined) {
    const min = query.minFreeSeats;
    items = items.filter((r) => r.occupancy.freeSeats >= min);
  }

  const desc = query.sort.startsWith('-');
  const key = desc ? query.sort.slice(1) : query.sort;
  const byName = (a: RestaurantDto, b: RestaurantDto) => a.name.localeCompare(b.name, 'he');
  const compare: Record<string, (a: RestaurantDto, b: RestaurantDto) => number> = {
    name: byName,
    freeSeats: (a, b) => a.occupancy.freeSeats - b.occupancy.freeSeats || byName(a, b),
    occupancy: (a, b) => a.occupancy.occupancyPercent - b.occupancy.occupancyPercent || byName(a, b),
    createdAt: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  };
  const cmp = compare[key] ?? byName;
  items.sort((a, b) => (desc ? -cmp(a, b) : cmp(a, b)));
  return items;
}

export async function getRestaurant(id: string, viewer: AuthUser): Promise<RestaurantDto> {
  if (!UUID_RE.test(id)) throw restaurantNotFound();
  return toRestaurantDto(await loadWithGroups(prisma, id), viewer.id);
}

// ---------------------------------------------------------------------------
// Commands (owner only)
// ---------------------------------------------------------------------------

const restaurantExists = () => conflict('RESTAURANT_EXISTS', 'This account already has a restaurant');

export async function createRestaurant(input: CreateRestaurantInput, user: AuthUser): Promise<RestaurantDto> {
  if (user.restaurantId) throw restaurantExists();

  const groups = mergeByCapacity(input.tableGroups);
  groups.forEach((g, i) => {
    if ((g.occupiedTables ?? 0) > g.totalTables) throw occupiedTooHigh(g.capacity, `tableGroups.${i}.occupiedTables`);
  });
  assertHasTables(groups);

  const { tableGroups: _ignored, ...fields } = input;
  try {
    const created = await prisma.restaurant.create({
      data: {
        ...fields,
        ownerId: user.id,
        tableGroups: {
          create: groups.map((g) => ({
            capacity: g.capacity,
            totalTables: g.totalTables,
            occupiedTables: g.occupiedTables ?? 0,
          })),
        },
      },
      include: { tableGroups: true },
    });
    return toRestaurantDto(created, user.id);
  } catch (err) {
    // ownerId is unique – protects against two simultaneous create requests.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw restaurantExists();
    throw err;
  }
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput, user: AuthUser): Promise<RestaurantDto> {
  return prisma.$transaction(async (tx) => {
    await lockOwnedRestaurant(tx, id, user);
    await tx.restaurant.update({ where: { id }, data: input });
    return toRestaurantDto(await loadWithGroups(tx, id), user.id);
  });
}

export interface TableGroupsResult {
  restaurantId: string;
  tableGroups: TableGroupDto[];
  occupancy: OccupancySummary;
  /** Automatic corrections made by the server (e.g. occupied tables lowered). Show them to the manager. */
  adjustments: OccupiedAdjustment[];
}

/** PUT – replaces the full set of table groups. Groups are matched by capacity so their ids stay stable. */
export async function replaceTableGroups(
  restaurantId: string,
  input: TableGroupInput[],
  user: AuthUser,
): Promise<TableGroupsResult> {
  return prisma.$transaction(async (tx) => {
    await lockOwnedRestaurant(tx, restaurantId, user);
    const existing = await tx.tableGroup.findMany({ where: { restaurantId } });
    const existingByCapacity = new Map(existing.map((g) => [g.capacity, g]));

    const groups = mergeByCapacity(input);
    const adjustments: OccupiedAdjustment[] = [];
    const resolved = groups.map((g, i) => {
      const prev = existingByCapacity.get(g.capacity);
      const r = resolveOccupiedTables(g.capacity, g.totalTables, g.occupiedTables, prev?.occupiedTables);
      if (!r) throw occupiedTooHigh(g.capacity, `tableGroups.${i}.occupiedTables`);
      if (r.adjustment) adjustments.push(r.adjustment);
      return { capacity: g.capacity, totalTables: g.totalTables, occupiedTables: r.occupiedTables };
    });
    assertHasTables(resolved);

    const keep = new Set(resolved.map((g) => g.capacity));
    await tx.tableGroup.deleteMany({ where: { restaurantId, capacity: { notIn: [...keep] } } });
    for (const g of resolved) {
      await tx.tableGroup.upsert({
        where: { restaurantId_capacity: { restaurantId, capacity: g.capacity } },
        create: { restaurantId, ...g },
        update: { totalTables: g.totalTables, occupiedTables: g.occupiedTables },
      });
    }

    const after = await tx.tableGroup.findMany({ where: { restaurantId }, orderBy: { capacity: 'asc' } });
    return {
      restaurantId,
      tableGroups: after.map(toTableGroupDto),
      occupancy: computeOccupancy(after),
      adjustments,
    };
  });
}

/** PATCH – updates a single group (capacity / totalTables / occupiedTables). */
export async function updateTableGroup(
  restaurantId: string,
  groupId: string,
  input: UpdateTableGroupInput,
  user: AuthUser,
): Promise<TableGroupsResult & { tableGroup: TableGroupDto }> {
  return prisma.$transaction(async (tx) => {
    await lockOwnedRestaurant(tx, restaurantId, user);
    if (!UUID_RE.test(groupId)) throw groupNotFound();

    const groups = await tx.tableGroup.findMany({ where: { restaurantId } });
    const group = groups.find((g) => g.id === groupId);
    if (!group) throw groupNotFound();

    const capacity = input.capacity ?? group.capacity;
    if (capacity !== group.capacity && groups.some((g) => g.id !== groupId && g.capacity === capacity)) {
      throw conflict('DUPLICATE_CAPACITY', `A table group with capacity ${capacity} already exists`, {
        path: 'capacity',
      });
    }

    const totalTables = input.totalTables ?? group.totalTables;
    const r = resolveOccupiedTables(capacity, totalTables, input.occupiedTables, group.occupiedTables);
    if (!r) throw occupiedTooHigh(capacity, 'occupiedTables');

    const others = groups.filter((g) => g.id !== groupId);
    assertHasTables([...others, { totalTables }]);

    const updated = await tx.tableGroup.update({
      where: { id: groupId },
      data: { capacity, totalTables, occupiedTables: r.occupiedTables },
    });

    const after = [...others, updated].sort((a, b) => a.capacity - b.capacity);
    return {
      restaurantId,
      tableGroup: toTableGroupDto(updated),
      tableGroups: after.map(toTableGroupDto),
      occupancy: computeOccupancy(after),
      adjustments: r.adjustment ? [r.adjustment] : [],
    };
  });
}
