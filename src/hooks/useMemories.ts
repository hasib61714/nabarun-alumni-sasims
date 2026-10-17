import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toMemory, type Memory } from "@/lib/memories";

export const PAGE_SIZE = 9;

export interface MemoryFilters {
  search: string;
  category: string;
  batch: string;
}

/** Characters that would change the meaning of a PostgREST filter string. */
const cleanSearch = (q: string) => q.replace(/[,()%*\\]/g, " ").trim();

export function usePublicMemories(filters: MemoryFilters) {
  return useInfiniteQuery({
    queryKey: ["memories", "public", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from("memories")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("approved_at", { ascending: false, nullsFirst: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (filters.category !== "all") query = query.eq("category", filters.category);
      if (filters.batch !== "all") query = query.eq("batch_year", Number(filters.batch));
      const q = cleanSearch(filters.search);
      if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%,author_name.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(toMemory);
    },
    getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined),
  });
}

export function useMemoryBatches() {
  return useQuery({
    queryKey: ["memories", "batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("batch_year").eq("status", "approved").not("batch_year", "is", null);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.batch_year as number))].sort((a, b) => b - a);
    },
    staleTime: 5 * 60_000,
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: ["memories", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data ? toMemory(data) : null;
    },
  });
}

export function useRecentMemories(limit = 3, excludeId?: string) {
  return useQuery({
    queryKey: ["memories", "recent", limit, excludeId],
    queryFn: async () => {
      let query = supabase
        .from("memories")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("approved_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (excludeId) query = query.neq("id", excludeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(toMemory) as Memory[];
    },
    staleTime: 60_000,
  });
}

/** The signed-in user's own memories, newest first (any status). */
export function useMyMemories(userId: string | undefined) {
  return useQuery({
    queryKey: ["memories", "mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toMemory);
    },
  });
}
