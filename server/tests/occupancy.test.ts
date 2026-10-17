import { describe, expect, it } from 'vitest';
import { computeOccupancy, resolveOccupiedTables } from '../src/modules/restaurants/occupancy';

describe('computeOccupancy', () => {
  it('applies the spec formulas', () => {
    const s = computeOccupancy([
      { capacity: 4, totalTables: 10, occupiedTables: 8 },
      { capacity: 2, totalTables: 5, occupiedTables: 4 },
    ]);
    expect(s.totalSeats).toBe(50); // 5×2 + 10×4
    expect(s.occupiedSeats).toBe(40); // 4×2 + 8×4
    expect(s.freeSeats).toBe(10);
    expect(s.occupancyPercent).toBe(80);
    expect(s.totalTables).toBe(15);
    expect(s.occupiedTables).toBe(12);
    expect(s.freeTables).toBe(3);
    // sorted ascending by capacity
    expect(s.freeTablesByCapacity).toEqual([
      { capacity: 2, totalTables: 5, occupiedTables: 4, freeTables: 1, freeSeats: 2 },
      { capacity: 4, totalTables: 10, occupiedTables: 8, freeTables: 2, freeSeats: 8 },
    ]);
  });

  it('matches the spec example: two free 4-seat tables + one free 2-seat table = 10 free seats', () => {
    const s = computeOccupancy([
      { capacity: 4, totalTables: 3, occupiedTables: 1 },
      { capacity: 2, totalTables: 2, occupiedTables: 1 },
    ]);
    expect(s.freeSeats).toBe(10);
  });

  it('returns 0% when there are no seats', () => {
    expect(computeOccupancy([]).occupancyPercent).toBe(0);
    expect(computeOccupancy([{ capacity: 4, totalTables: 0, occupiedTables: 0 }]).occupancyPercent).toBe(0);
  });

  it('rounds the percentage', () => {
    const s = computeOccupancy([{ capacity: 1, totalTables: 3, occupiedTables: 1 }]);
    expect(s.occupancyPercent).toBe(33);
    expect(computeOccupancy([{ capacity: 1, totalTables: 3, occupiedTables: 3 }]).occupancyPercent).toBe(100);
  });
});

describe('resolveOccupiedTables', () => {
  it('keeps valid values', () => {
    expect(resolveOccupiedTables(4, 10, 3, 1)).toEqual({ occupiedTables: 3 });
  });

  it('defaults to the previous value, then to 0', () => {
    expect(resolveOccupiedTables(4, 10, undefined, 6)).toEqual({ occupiedTables: 6 });
    expect(resolveOccupiedTables(4, 10, undefined, undefined)).toEqual({ occupiedTables: 0 });
  });

  it('lowers the stored value when total is reduced below it, with a notice', () => {
    const r = resolveOccupiedTables(4, 3, undefined, 5);
    expect(r?.occupiedTables).toBe(3);
    expect(r?.adjustment).toMatchObject({ capacity: 4, requestedOccupiedTables: 5, occupiedTables: 3 });
    // also when the client re-sends the unchanged stored value
    expect(resolveOccupiedTables(4, 3, 5, 5)?.occupiedTables).toBe(3);
  });

  it('rejects a new explicit value larger than the total', () => {
    expect(resolveOccupiedTables(4, 3, 4, 1)).toBeNull();
    expect(resolveOccupiedTables(4, 3, 4, undefined)).toBeNull();
  });
});
