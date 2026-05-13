import * as DB from "@/lib/db";

/**
 * Compute current streak from a pre-fetched prefix map.
 */
export function computeStreak(
  map: Record<string, number>,
  prefix: string,
  target: number
): number {
  let streak = 0;
  const d = new Date();
  while (streak <= 365) {
    const key = prefix + d.toISOString().split("T")[0];
    const val = map[key] ?? 0;
    if (val >= target) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Compute streak grid data from a pre-fetched prefix map (91 days).
 */
export function computeStreakGridData(
  map: Record<string, number>,
  prefix: string
): { val: number; date: string }[] {
  const today = new Date();
  const cells: { val: number; date: string }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    cells.push({ val: map[prefix + date] ?? 0, date });
  }
  return cells;
}

/**
 * Fetch streak for a prefix with a SINGLE DB request.
 */
export async function getStreak(prefix: string, target = 1): Promise<number> {
  const map = await DB.getByPrefix<number>(prefix);
  return computeStreak(map, prefix, target);
}

/**
 * Fetch streak grid data for a prefix with a SINGLE DB request.
 */
export async function getStreakGridData(
  prefix: string,
  _target: number
): Promise<{ val: number; date: string }[]> {
  const map = await DB.getByPrefix<number>(prefix);
  return computeStreakGridData(map, prefix);
}
