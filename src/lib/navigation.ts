import { BookOpen, CalendarDays, Camera, Contact, GraduationCap, HandHeart, Home, Images, Info, Landmark, Megaphone, Network, Search, Users, type LucideIcon } from "lucide-react";
import type { NavSettings } from "./siteSettings";

export interface NavLinkDef {
  id: string;
  label: string;
  path: string;
  desc: string;
  icon: LucideIcon;
}

export interface NavGroupDef {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavLinkDef[];
}

export type NavEntry = NavLinkDef | NavGroupDef;
export const isGroup = (entry: NavEntry): entry is NavGroupDef => "items" in entry;

/** The full menu. Admins can rename or hide entries (site settings → menu). */
export const NAV: NavEntry[] = [
  { id: "home", label: "হোম", path: "/", desc: "প্রথম পাতা", icon: Home },
  {
    id: "about-group",
    label: "পরিচিতি",
    icon: Info,
    items: [
      { id: "about", label: "আমাদের সম্পর্কে", path: "/about", desc: "লক্ষ্য, ভিশন ও আমাদের গল্প", icon: Info },
      { id: "institutions", label: "প্রতিষ্ঠানসমূহ", path: "/about#institutions", desc: "নবারুণ পরিবারের তিন প্রতিষ্ঠান", icon: Landmark },
    ],
  },
  {
    id: "alumni-group",
    label: "অ্যালামনাই",
    icon: Users,
    items: [
      { id: "alumni", label: "প্রাক্তন ছাত্র", path: "/alumni", desc: "ব্যাচ অনুযায়ী প্রোফাইল", icon: GraduationCap },
      { id: "directory", label: "ডিরেক্টরি", path: "/directory", desc: "পেশা ও অবস্থান অনুযায়ী খুঁজুন", icon: Network },
      { id: "search", label: "অনুসন্ধান", path: "/search", desc: "নাম, রোল বা ব্যাচ দিয়ে খুঁজুন", icon: Search },
    ],
  },
  {
    id: "media-group",
    label: "স্মৃতি ও গ্যালারি",
    icon: Images,
    items: [
      { id: "memories", label: "স্মৃতির পাতা", path: "/memories", desc: "ছাত্রদের লেখা ও ভিডিও", icon: BookOpen },
      { id: "gallery", label: "গ্যালারি", path: "/gallery", desc: "ছবির সংগ্রহ", icon: Camera },
    ],
  },
  {
    id: "activity-group",
    label: "কার্যক্রম",
    icon: Megaphone,
    items: [
      { id: "events", label: "ইভেন্ট", path: "/events", desc: "আসন্ন ও অতীত অনুষ্ঠান", icon: CalendarDays },
      { id: "notices", label: "নোটিশ", path: "/notices", desc: "সর্বশেষ ঘোষণা", icon: Megaphone },
      { id: "donations", label: "অনুদান", path: "/donations", desc: "প্রতিষ্ঠানের পাশে দাঁড়ান", icon: HandHeart },
    ],
  },
  { id: "contact", label: "যোগাযোগ", path: "/contact", desc: "আমাদের সাথে কথা বলুন", icon: Contact },
];

/** Every individual link, flattened (used by the footer and the admin editor). */
export const ALL_LINKS: NavLinkDef[] = NAV.flatMap((e) => (isGroup(e) ? e.items : [e]));

/** The menu after the admin's renamed and hidden entries are applied. */
export function applyNavSettings(nav: NavSettings): NavEntry[] {
  const hidden = new Set(nav.hidden);
  const label = (id: string, fallback: string) => nav.labels[id]?.trim() || fallback;
  const out: NavEntry[] = [];
  for (const entry of NAV) {
    if (hidden.has(entry.id)) continue;
    if (isGroup(entry)) {
      const items = entry.items.filter((i) => !hidden.has(i.id)).map((i) => ({ ...i, label: label(i.id, i.label) }));
      if (items.length === 0) continue;
      out.push({ ...entry, label: label(entry.id, entry.label), items });
    } else {
      out.push({ ...entry, label: label(entry.id, entry.label) });
    }
  }
  return out;
}

export function isPathActive(pathname: string, path: string) {
  const base = path.split("#")[0];
  if (path.includes("#")) return false;
  return pathname === base || (base !== "/" && pathname.startsWith(`${base}/`));
}
