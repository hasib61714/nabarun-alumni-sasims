import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" }) : "";

export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("bn-BD", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

export const timeAgo = (iso: string | null | undefined) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: bn }) : "";

export const formatNumber = (n: number) => n.toLocaleString("bn-BD");
export const formatTaka = (n: number) => `৳${n.toLocaleString("bn-BD")}`;

export const initialsOf = (name: string | null | undefined, fallback = "?") =>
  (name || "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || fallback;

export function excerpt(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
