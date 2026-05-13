import { supabase } from "./supabase";

const TABLE = "kv";

/**
 * Get multiple exact keys in ONE request.
 * Returns a map of key → value (missing keys use their default).
 */
export async function getMany<T>(
  keys: string[],
  def: T
): Promise<Record<string, T>> {
  if (!keys.length) return {};
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key, value")
      .in("key", keys);

    if (error || !data) return Object.fromEntries(keys.map((k) => [k, def]));
    const map: Record<string, T> = Object.fromEntries(keys.map((k) => [k, def]));
    for (const row of data) map[row.key] = row.value as T;
    return map;
  } catch {
    return Object.fromEntries(keys.map((k) => [k, def]));
  }
}

/**
 * Fetch ALL keys that start with a given prefix in ONE request.
 * Returns a map of key → value.
 *
 * Example: getByPrefix("water_") returns
 *   { "water_2026-04-20": 8, "water_2026-04-21": 3, ... }
 */
export async function getByPrefix<T>(prefix: string): Promise<Record<string, T>> {
  try {
    // Use a key range: gte "water_" and lt "water`" (next char after "_" is "`")
    const end =
      prefix.slice(0, -1) +
      String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1);
    const { data, error } = await supabase
      .from(TABLE)
      .select("key, value")
      .gte("key", prefix)
      .lt("key", end);

    if (error || !data) return {};
    const map: Record<string, T> = {};
    for (const row of data) map[row.key] = row.value as T;
    return map;
  } catch {
    return {};
  }
}

/**
 * Build an array of ISO date strings going back `days` days from today.
 * Index 0 = today, index N-1 = oldest.
 */
export function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

/**
 * Get value by key
 */
export async function get<T>(key: string, def: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return def;

    return data.value as T;
  } catch (err) {
    console.error("DB.get failed", err);
    return def;
  }
}

/**
 * Set value (insert or update)
 */
export async function set(key: string, value: unknown): Promise<void> {
  try {
    const { error } = await supabase.from(TABLE).upsert({
      key,
      value,
    });

    if (error) {
      console.error("DB.set failed", error);
    }
  } catch (err) {
    console.error("DB.set failed", err);
  }
}

/**
 * Delete value
 */
export async function del(key: string): Promise<void> {
  try {
    const { error } = await supabase.from(TABLE).delete().eq("key", key);

    if (error) {
      console.error("DB.delete failed", error);
    }
  } catch (err) {
    console.error("DB.delete failed", err);
  }
}

/**
 * Get all keys
 */
export async function keys(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from(TABLE).select("key");

    if (error || !data) return [];

    return data.map((row) => row.key);
  } catch (err) {
    console.error("DB.keys failed", err);
    return [];
  }
}

/**
 * Export full DB
 */
export async function exportDB(): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase.from(TABLE).select("*");

    if (error || !data) return {};

    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  } catch (err) {
    console.error("DB.export failed", err);
    return {};
  }
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
