/**
 * Occupancy calculations (spec section 5). Pure functions – no database access.
 *
 *   totalSeats       = Σ totalTables    × capacity
 *   occupiedSeats    = Σ occupiedTables × capacity
 *   freeSeats        = Σ (totalTables − occupiedTables) × capacity
 *   occupancyPercent = occupiedSeats ÷ totalSeats × 100   (0 when there are no seats)
 */

export interface TableCounts {
  capacity: number;
  totalTables: number;
  occupiedTables: number;
}

export interface FreeTablesByCapacity {
  capacity: number;
  totalTables: number;
  occupiedTables: number;
  freeTables: number;
  freeSeats: number;
}

export interface OccupancySummary {
  totalSeats: number;
  occupiedSeats: number;
  freeSeats: number;
  /** Rounded to the nearest whole number, 0–100. */
  occupancyPercent: number;
  totalTables: number;
  occupiedTables: number;
  freeTables: number;
  /** One entry per capacity, ascending by capacity. */
  freeTablesByCapacity: FreeTablesByCapacity[];
}

export function computeOccupancy(groups: readonly TableCounts[]): OccupancySummary {
  const byCapacity = [...groups]
    .sort((a, b) => a.capacity - b.capacity)
    .map((g) => {
      const freeTables = g.totalTables - g.occupiedTables;
      return {
        capacity: g.capacity,
        totalTables: g.totalTables,
        occupiedTables: g.occupiedTables,
        freeTables,
        freeSeats: freeTables * g.capacity,
      };
    });

  let totalSeats = 0;
  let occupiedSeats = 0;
  let totalTables = 0;
  let occupiedTables = 0;
  for (const g of byCapacity) {
    totalSeats += g.totalTables * g.capacity;
    occupiedSeats += g.occupiedTables * g.capacity;
    totalTables += g.totalTables;
    occupiedTables += g.occupiedTables;
  }

  return {
    totalSeats,
    occupiedSeats,
    freeSeats: totalSeats - occupiedSeats,
    occupancyPercent: totalSeats === 0 ? 0 : Math.round((occupiedSeats / totalSeats) * 100),
    totalTables,
    occupiedTables,
    freeTables: totalTables - occupiedTables,
    freeTablesByCapacity: byCapacity,
  };
}

export interface OccupiedAdjustment {
  capacity: number;
  requestedOccupiedTables: number;
  occupiedTables: number;
  message: string;
}

/**
 * Resolves the occupied-tables value for a group being saved.
 *
 * Rule (spec section 5): occupiedTables must stay within 0..totalTables. When the manager reduces
 * totalTables below the current occupied count, the occupied count is lowered to the new total and a
 * notice is returned. An explicit *new* occupied value larger than totalTables is invalid (returns null).
 *
 * @param requested     occupied value sent by the client (undefined = not sent)
 * @param previous      occupied value currently stored (undefined = new group)
 */
export function resolveOccupiedTables(
  capacity: number,
  totalTables: number,
  requested: number | undefined,
  previous: number | undefined,
): { occupiedTables: number; adjustment?: OccupiedAdjustment } | null {
  const candidate = requested ?? previous ?? 0;
  if (candidate <= totalTables) return { occupiedTables: candidate };

  // Only the "kept the old occupied value but lowered the total" case is auto-adjusted.
  const isUnchangedOldValue = previous !== undefined && candidate === previous;
  if (!isUnchangedOldValue) return null;

  return {
    occupiedTables: totalTables,
    adjustment: {
      capacity,
      requestedOccupiedTables: candidate,
      occupiedTables: totalTables,
      message: `Occupied tables for capacity ${capacity} were reduced from ${candidate} to ${totalTables} because the total number of tables was lowered.`,
    },
  };
}
