import { formatDistanceToNow } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import { localeOf, type Lang } from "./i18n";

// Every formatter takes an optional language; the dashboards are Bengali only and use the default.
export const formatDate = (iso: string | null | undefined, lang: Lang = "bn") =>
  iso ? new Date(iso).toLocaleDateString(localeOf(lang), { year: "numeric", month: "long", day: "numeric" }) : "";

export const formatDateTime = (iso: string | null | undefined, lang: Lang = "bn") =>
  iso
    ? new Date(iso).toLocaleString(localeOf(lang), { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

export const timeAgo = (iso: string | null | undefined, lang: Lang = "bn") =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: lang === "en" ? enUS : bn }) : "";

export const formatNumber = (n: number, lang: Lang = "bn") => n.toLocaleString(localeOf(lang));
export const formatTaka = (n: number, lang: Lang = "bn") => `৳${n.toLocaleString(localeOf(lang))}`;

export const initialsOf = (name: string | null | undefined, fallback = "?") =>
  (name || "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || fallback;

export function excerpt(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
