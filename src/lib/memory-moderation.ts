import { supabase } from "@/integrations/supabase/client";
import type { Memory, MemoryStatus } from "@/lib/memories";

/**
 * Changes a memory's status only if it has not been edited since the admin looked at it.
 * Without the check, an admin could approve text the author changed a moment ago, unseen.
 */
export async function moderateMemory(
  memory: Pick<Memory, "id" | "updated_at">,
  values: { status: MemoryStatus; rejection_reason?: string | null },
): Promise<void> {
  const { data, error } = await supabase
    .from("memories")
    .update(values)
    .eq("id", memory.id)
    .eq("updated_at", memory.updated_at)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("এই স্মৃতিটি এইমাত্র বদলে গেছে বা মুছে গেছে। তালিকা নতুন করে লোড হয়েছে — আবার দেখে নিন।");
  }
}
