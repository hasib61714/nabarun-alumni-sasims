import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { downloadJSON, todayStamp } from "@/lib/export";

type TableName = keyof Database["public"]["Tables"];

export const BACKUP_TABLES: TableName[] = [
  "student_profiles", "memories", "testimonials", "notices", "events", "gallery_photos",
  "donations", "donation_campaigns", "contact_messages",
];

const PAGE = 1000;

/** Reads a whole table, page by page (the API returns at most 1000 rows per request). */
async function fetchAll(table: TableName): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("*").order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Downloads every important table as one JSON file. Photos and videos stay in storage; the file keeps their links. */
export async function downloadBackup(): Promise<Record<string, number>> {
  const data: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) data[table] = await fetchAll(table);
  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
  downloadJSON(`nabarun-backup-${todayStamp()}.json`, { app: "nabarun-alumni-sasims", exported_at: new Date().toISOString(), counts, data });
  return counts;
}
