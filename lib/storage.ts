// storage.ts — thin wrapper kept for any legacy imports;
// all real I/O goes through lib/db.ts (IndexedDB).
export { DB, getToday } from "./db";

/**
 * One-time migration: copy every key from localStorage into IndexedDB,
 * then mark done so we never repeat.
 * Call this once from a top-level useEffect.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("__migrated_to_idb")) return;

  const { DB } = await import("./db");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === "__migrated_to_idb") continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      const parsed = JSON.parse(raw);
      await DB.set(key, parsed);
    } catch {}
  }
  localStorage.setItem("__migrated_to_idb", "1");
}
