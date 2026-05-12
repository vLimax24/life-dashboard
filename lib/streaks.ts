import { DB } from "./db";

export async function getStreak(prefix: string): Promise<number> {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split("T")[0];
    const val = await DB.get<number>(prefix + key, 0);
    if (val >= (prefix === "water_" ? 8 : 1)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
    if (streak > 365) break; // safety
  }
  return streak;
}

export async function getStreakGridData(
  prefix: string,
  target: number,
): Promise<{ val: number; date: string }[]> {
  const today = new Date();
  const cells = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const val = await DB.get<number>(prefix + dateStr, 0);
    cells.push({ val, date: dateStr });
  }
  return cells;
}
