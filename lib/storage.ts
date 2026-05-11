export const S = {
  get: <T>(key: string, def: T): T => {
    if (typeof window === "undefined") return def;
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : def;
    } catch {
      return def;
    }
  },
  set: (key: string, value: unknown): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export const TODAY = new Date().toISOString().split("T")[0];

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
