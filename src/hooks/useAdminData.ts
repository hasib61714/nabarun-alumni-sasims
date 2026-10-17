import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertOf<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateOf<T extends TableName> = Database["public"]["Tables"][T]["Update"];

interface Result { error: { message: string } | null }
interface LooseTable {
  select(columns: string): {
    order(column: string, opts: { ascending: boolean }): {
      order(column: string, opts: { ascending: boolean }): { range(from: number, to: number): PromiseLike<Result & { data: unknown[] | null }> };
    };
  };
  insert(values: unknown): PromiseLike<Result>;
  update(values: unknown): { eq(column: string, value: unknown): PromiseLike<Result>; in(column: string, values: unknown[]): PromiseLike<Result> };
  delete(): { eq(column: string, value: unknown): PromiseLike<Result> };
}

// The table name is chosen at runtime, so go through a small, explicit interface
// instead of the (very large) union of generated builder types.
const PAGE_SIZE = 1000;
const table = (name: TableName) => supabase.from(name) as unknown as LooseTable;

const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export function useAdminRows<T extends TableName>(name: T, orderBy: string, ascending = false) {
  return useQuery({
    queryKey: ["admin", name],
    queryFn: async () => {
      // the API returns at most 1000 rows per request: read every page, in a stable order
      const rows: unknown[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await table(name).select("*").order(orderBy, { ascending }).order("id", { ascending: true }).range(from, from + PAGE_SIZE - 1);
        fail(error);
        rows.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
      }
      return rows as Row<T>[];
    },
  });
}

export function useRowMutations<T extends TableName>(name: T, idColumn = "id") {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", name] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "counts"] }),
      name === "memories" ? queryClient.invalidateQueries({ queryKey: ["memories"] }) : Promise.resolve(),
    ]);
  };

  const create = useMutation({
    mutationFn: async (values: InsertOf<T>) => fail((await table(name).insert(values)).error),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateOf<T> }) => fail((await table(name).update(values).eq(idColumn, id)).error),
    onSuccess: refresh,
  });
  const updateMany = useMutation({
    mutationFn: async ({ ids, values }: { ids: string[]; values: UpdateOf<T> }) => fail((await table(name).update(values).in(idColumn, ids)).error),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => fail((await table(name).delete().eq(idColumn, id)).error),
    onSuccess: refresh,
  });
  return { create, update, updateMany, remove };
}

/** Runs a mutation, shows a success or error toast, and tells you whether it worked. */
export async function attempt(promise: Promise<unknown>, success?: string): Promise<boolean> {
  try {
    await promise;
    if (success) toast.success(success);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "কিছু একটা সমস্যা হয়েছে");
    return false;
  }
}

export interface AdminCounts {
  pendingStudents: number;
  pendingMemories: number;
  pendingTestimonials: number;
  pendingDonations: number;
  unreadMessages: number;
}

const countOf = async (query: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
  const { count, error } = await query;
  fail(error);
  return count ?? 0;
};

/** Numbers shown as badges in the admin navigation. */
export function useAdminCounts(enabled = true) {
  return useQuery({
    queryKey: ["admin", "counts"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AdminCounts> => {
      const head = { count: "exact", head: true } as const;
      const [pendingStudents, pendingMemories, pendingTestimonials, pendingDonations, unreadMessages] = await Promise.all([
        countOf(supabase.from("student_profiles").select("user_id", head).or("is_approved.is.null,is_approved.eq.false")),
        countOf(supabase.from("memories").select("id", head).eq("status", "pending")),
        countOf(supabase.from("testimonials").select("id", head).or("is_approved.is.null,is_approved.eq.false")),
        countOf(supabase.from("donations").select("id", head).eq("status", "pending")),
        countOf(supabase.from("contact_messages").select("id", head).or("is_read.is.null,is_read.eq.false")),
      ]);
      return { pendingStudents, pendingMemories, pendingTestimonials, pendingDonations, unreadMessages };
    },
  });
}
