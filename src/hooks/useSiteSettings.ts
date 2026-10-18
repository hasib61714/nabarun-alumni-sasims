import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { institutions as baseInstitutions, type Institution } from "@/data/institutions";
import { useLang, type Lang } from "@/lib/i18n";
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

/** Settings in the visitor's language, or in `forceLang` (the admin editor edits one language at a time). */
export function useSiteSettings(forceLang?: Lang): { settings: SiteSettings; loading: boolean } {
  const { lang: visitorLang } = useLang();
  const lang = forceLang ?? visitorLang;
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
  const settings = useMemo(() => buildSettings(data, lang), [data, lang]);
  return { settings, loading: isLoading };
}

export function useSaveSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, lang = "bn" }: { key: SettingsKey; value: object; lang?: Lang }) => {
      const { error } = await supabase.from("site_settings").upsert({ key: lang === "en" ? `${key}_en` : key, value: value as Json }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

export function useResetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, lang = "bn" }: { key: SettingsKey; lang?: Lang }) => {
      const { error } = await supabase.from("site_settings").delete().eq("key", lang === "en" ? `${key}_en` : key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

export interface LocalizedInstitution extends Institution {
  /** Name in the visitor's language. */
  title: string;
  /** The name in the other language (shown smaller). */
  subtitle: string;
}

/** The three institutions with the admin's edits applied, in the visitor's language; hidden ones are dropped. */
export function useInstitutions(): LocalizedInstitution[] {
  const { settings } = useSiteSettings();
  const { lang } = useLang();
  return useMemo(
    () =>
      baseInstitutions
        .filter((i) => !settings.institutions.items[i.id]?.hidden)
        .map((i) => {
          const o = settings.institutions.items[i.id] ?? {};
          const phoneDisplay = o.phoneDisplay ?? i.phoneDisplay;
          const en = lang === "en";
          const name = o.name || i.name;
          const nameBn = o.nameBn || i.nameBn;
          return {
            ...i,
            name,
            nameBn,
            title: en ? name : nameBn,
            subtitle: en ? nameBn : name,
            desc: o.desc ?? (en ? i.descEn : i.desc),
            established: o.established ?? i.established,
            phoneDisplay,
            phone: o.phoneDisplay ? telHref(o.phoneDisplay).replace(/^tel:/, "") : i.phone,
            email: o.email || i.email,
            mapUrl: o.mapUrl ?? i.mapUrl,
            address: o.address ?? i.address,
          };
        }),
    [settings.institutions, lang],
  );
}

export { DEFAULT_SETTINGS };
