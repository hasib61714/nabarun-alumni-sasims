import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { institutions as baseInstitutions, type Institution } from "@/data/institutions";
import { buildSettings, DEFAULT_SETTINGS, telHref, type SettingsKey, type SiteSettings } from "@/lib/siteSettings";

const CACHE_KEY = "site-settings-cache-v1";
type Row = { key: string; value: unknown };

// The last settings we saw are kept in this browser so a returning visitor never
// sees the default text flash before the edited text arrives.
function readCache(): Row[] | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(rows: Row[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows)); } catch { /* storage unavailable */ }
}

export function useSiteSettings(): { settings: SiteSettings; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<Row[]> => {
      const { data: rows, error } = await supabase.from("site_settings").select("key, value");
      // A database that has not had the settings migration yet simply uses the defaults.
      if (error) return readCache() ?? [];
      writeCache(rows ?? []);
      return rows ?? [];
    },
    initialData: readCache,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const settings = useMemo(() => buildSettings(data), [data]);
  return { settings, loading: isLoading };
}

export function useSaveSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: SettingsKey; value: object }) => {
      const { error } = await supabase.from("site_settings").upsert({ key, value: value as Json }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

export function useResetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: SettingsKey) => {
      const { error } = await supabase.from("site_settings").delete().eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

/** The three institutions with the admin's edits applied; hidden ones are dropped. */
export function useInstitutions(): Institution[] {
  const { settings } = useSiteSettings();
  return useMemo(
    () =>
      baseInstitutions
        .filter((i) => !settings.institutions.items[i.id]?.hidden)
        .map((i) => {
          const o = settings.institutions.items[i.id] ?? {};
          const phoneDisplay = o.phoneDisplay ?? i.phoneDisplay;
          return {
            ...i,
            name: o.name || i.name,
            nameBn: o.nameBn || i.nameBn,
            desc: o.desc ?? i.desc,
            established: o.established ?? i.established,
            phoneDisplay,
            phone: o.phoneDisplay ? telHref(o.phoneDisplay).replace(/^tel:/, "") : i.phone,
            email: o.email || i.email,
            mapUrl: o.mapUrl ?? i.mapUrl,
            address: o.address ?? i.address,
          };
        }),
    [settings.institutions],
  );
}

export { DEFAULT_SETTINGS };
