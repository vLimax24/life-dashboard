import { S } from "./storage";

export function getStreak(prefix: string): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split("T")[0];
    const val = S.get<number>(prefix + key, 0);
    if (val >= (prefix === "water_" ? 8 : 1)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function getStreakGridData(prefix: string, target: number): { val: number; date: string }[] {
  const today = new Date();
  const cells = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const val = S.get<number>(prefix + dateStr, 0);
    cells.push({ val, date: dateStr });
  }
  return cells;
}
