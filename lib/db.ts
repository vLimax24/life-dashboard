import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "meindash";
const DB_VERSION = 1;
const STORE = "kv";

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
  return _db;
}

export const DB = {
  async get<T>(key: string, def: T): Promise<T> {
    if (typeof window === "undefined") return def;
    try {
      const db = await getDB();
      const val = await db.get(STORE, key);
      return val !== undefined ? (val as T) : def;
    } catch {
      return def;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const db = await getDB();
      await db.put(STORE, value, key);
    } catch {}
  },

  async delete(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const db = await getDB();
      await db.delete(STORE, key);
    } catch {}
  },

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const db = await getDB();
      await db.clear(STORE);
    } catch {}
  },

  async keys(): Promise<string[]> {
    if (typeof window === "undefined") return [];
    try {
      const db = await getDB();
      return (await db.getAllKeys(STORE)) as string[];
    } catch {
      return [];
    }
  },
};

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
