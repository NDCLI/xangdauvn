import type { FuelPrice, FuelType } from './fuel-types';

export type PriceChange = {
  fuel: FuelType;
  previous: number | null;
  current: number | null;
  delta: number;
  percent: number;
  direction: 'up' | 'down' | 'stable' | 'new';
};

export function comparePrices(current: FuelPrice, previous: FuelPrice): PriceChange[] {
  const changes: PriceChange[] = [];
  const keys = Object.keys({ ...current, ...previous }) as FuelType[];
  for (const k of keys) {
    const cur = (current as any)[k] ?? null;
    const prev = (previous as any)[k] ?? null;
    if (cur === null && prev === null) continue;
    const delta = (cur ?? 0) - (prev ?? 0);
    const percent = prev ? Math.round((delta / prev) * 10000) / 100 : 0;
    const direction: PriceChange['direction'] = cur === null ? 'new' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
    if (direction !== 'stable') {
      changes.push({ fuel: k, previous: prev, current: cur, delta, percent, direction });
    }
  }
  return changes;
}

export function hasSignificantChange(changes: PriceChange[], threshold = 0) {
  return changes.some(c => Math.abs(c.delta) >= threshold);
}
