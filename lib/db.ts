import { supabase } from "./supabase";

const TABLE = "kv";

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
