// Editable site content. Every group is stored as one JSON document in the
// `site_settings` table. Anything an admin has not changed falls back to the
// defaults below, so a fresh database (or a missing table) still renders a full site.

export interface GeneralSettings {
  siteName: string;
  siteNameEn: string;
  tagline: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  address: string;
  mapUrl: string;
  website: string;
  workingHours: string;
}

export interface SocialSettings {
  facebook: string;
  youtube: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  whatsapp: string;
}

export interface CardText { title: string; desc: string }

export interface HomeSettings {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroMotto: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  institutionsTitle: string;
  institutionsSubtitle: string;
  featuresTitle: string;
  featuresSubtitle: string;
  bannerText: string;
  bannerSubtext: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  showNotices: boolean;
  showEvents: boolean;
  showTopAlumni: boolean;
  showMemories: boolean;
  showTestimonials: boolean;
  /** Cards of the "everything in one place" section; the icon follows the position. */
  features: CardText[];
  /** The three "how to join" steps. */
  steps: CardText[];
}

export interface AboutSettings {
  heroTitle: string;
  heroSubtitle: string;
  mission: string;
  vision: string;
  values: string;
  systemTitle: string;
  /** Paragraphs separated by a blank line. */
  systemText: string;
  showDeveloper: boolean;
}

export interface FooterSettings {
  about: string;
  copyright: string;
  showDeveloperCredit: boolean;
}

export interface NavSettings {
  /** Menu label overrides keyed by link / group id. */
  labels: Record<string, string>;
  /** Ids of links or groups that are hidden. */
  hidden: string[];
}

export interface InstitutionOverride {
  name?: string;
  nameBn?: string;
  desc?: string;
  established?: string;
  phoneDisplay?: string;
  email?: string;
  mapUrl?: string;
  address?: string;
  hidden?: boolean;
}

export interface InstitutionsSettings {
  items: Record<string, InstitutionOverride>;
}

export interface SiteSettings {
  general: GeneralSettings;
  social: SocialSettings;
  home: HomeSettings;
  about: AboutSettings;
  footer: FooterSettings;
  nav: NavSettings;
  institutions: InstitutionsSettings;
}

export type SettingsKey = keyof SiteSettings;
export const SETTINGS_KEYS: SettingsKey[] = ["general", "social", "home", "about", "footer", "nav", "institutions"];

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: "নবারুণ অ্যালামনাই",
    siteNameEn: "Nabarun Alumni",
    tagline: "নবারুণ এডুকেশন ফ্যামিলি",
    email: "info.nabarun@gmail.com",
    phone: "+8801741919462",
    phoneDisplay: "+880 1741 919462",
    address: "শেরপুর, বাংলাদেশ",
    mapUrl: "",
    website: "https://www.nabarun.com.bd",
    workingHours: "",
  },
  social: { facebook: "", youtube: "", instagram: "", linkedin: "", twitter: "", whatsapp: "" },
  home: {
    heroBadge: "নবারুণ এডুকেশন ফ্যামিলি",
    heroTitle: "ছাত্রদের সংযোগ, ঐতিহ্যের সংরক্ষণ",
    heroSubtitle:
      "নবারুণ পাবলিক স্কুল, বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুল ও নবারুণ কোচিং সেন্টারের ছাত্র-ছাত্রীদের তথ্য ব্যবস্থাপনা ও প্রাক্তন ছাত্র নেটওয়ার্ক প্ল্যাটফর্ম।",
    heroMotto: "We are Nabarun, We are Champion.",
    primaryCtaLabel: "যোগ দিন",
    primaryCtaLink: "/register",
    secondaryCtaLabel: "প্রাক্তন ছাত্র দেখুন",
    secondaryCtaLink: "/alumni",
    institutionsTitle: "নবারুণ এডুকেশন ফ্যামিলি",
    institutionsSubtitle: "তিনটি প্রতিষ্ঠানের সমন্বয়ে গড়ে ওঠা একটি শিক্ষা পরিবার।",
    featuresTitle: "সবকিছু এক জায়গায়",
    featuresSubtitle: "প্রাক্তন ছাত্র ও বর্তমান ছাত্রদের তথ্য, স্মৃতি ও যোগাযোগের সম্পূর্ণ আধুনিক ব্যবস্থা।",
    bannerText: "We are Nabarun, We are Champion.",
    bannerSubtext: "একতা, শৃঙ্খলা ও শ্রেষ্ঠত্ব — আমাদের পরিচয়।",
    ctaTitle: "আজই যোগ দিন!",
    ctaText: "রেজিস্টার করুন, অ্যাডমিনের যাচাইয়ের পর নবারুণ পরিবারের প্রাক্তন ছাত্র নেটওয়ার্কে সংযুক্ত হন।",
    ctaButton: "অ্যাকাউন্ট তৈরি করুন",
    showNotices: true,
    showEvents: true,
    showTopAlumni: true,
    showMemories: true,
    showTestimonials: true,
    features: [
      { title: "প্রাক্তন ছাত্র নেটওয়ার্ক", desc: "সকল ব্যাচের গ্র্যাজুয়েটদের সাথে সংযুক্ত থাকুন।" },
      { title: "একাডেমিক রেকর্ড", desc: "SSC, HSC এবং অন্যান্য ফলাফল ডিজিটালভাবে সংরক্ষণ করুন।" },
      { title: "সাফল্য ও অর্জন", desc: "পুরস্কার, সম্মাননা এবং পেশাগত মাইলফলক তুলে ধরুন।" },
      { title: "ব্যাচ পরিসংখ্যান", desc: "বছর ও পেশা অনুযায়ী প্রাক্তন ছাত্রদের চিত্র।" },
      { title: "স্মার্ট অনুসন্ধান", desc: "নাম, রোল, ব্যাচ বা পেশা দিয়ে প্রাক্তন ছাত্র খুঁজুন।" },
      { title: "যাচাইকৃত ও নিরাপদ", desc: "অ্যাডমিন যাচাইয়ের পরই প্রোফাইল প্রকাশিত হয় — ভুয়া অ্যাকাউন্টের সুযোগ নেই।" },
    ],
    steps: [
      { title: "রেজিস্টার করুন", desc: "নাম, ব্যাচ, রোল ও যোগাযোগের তথ্যসহ আবেদন জমা দিন।" },
      { title: "অ্যাডমিন যাচাই করবেন", desc: "আপনার তথ্য মিলিয়ে দেখে অ্যাডমিন অ্যাকাউন্ট অনুমোদন করবেন।" },
      { title: "প্রোফাইল সাজান", desc: "অনুমোদনের পর ছবি, অর্জন, পেশা ও স্মৃতি সবার সাথে শেয়ার করুন।" },
    ],
  },
  about: {
    heroTitle: "নবারুণ এডুকেশন ফ্যামিলি",
    heroSubtitle: "শিক্ষায় শ্রেষ্ঠত্ব, সফল প্রাক্তন ছাত্র এবং আগামীর নেতা তৈরির প্রতিশ্রুতি।",
    mission: "আমাদের প্রতিষ্ঠানের প্রতিটি ছাত্রের যাত্রাপথকে ডিজিটালভাবে সংরক্ষণ ও উদযাপন করা।",
    vision: "সবচেয়ে সংযুক্ত ও সহায়ক প্রাক্তন ছাত্র নেটওয়ার্ক তৈরি করা, যা বর্তমান ও ভবিষ্যৎ ছাত্রদের ক্ষমতায়ন করে।",
    values: "শ্রেষ্ঠত্ব, সততা, সম্প্রদায় এবং আজীবন শিক্ষা আমাদের সবকিছুর পথপ্রদর্শক।",
    systemTitle: "এই প্ল্যাটফর্ম সম্পর্কে",
    systemText:
      "নবারুণ এডুকেশন ফ্যামিলির অধীনে নবারুণ পাবলিক স্কুল, বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুল এবং নবারুণ কোচিং সেন্টার অন্তর্ভুক্ত।\n\n" +
      "এই স্মার্ট অ্যালামনাই ও স্টুডেন্ট ইনফরমেশন ম্যানেজমেন্ট সিস্টেম (SASIMS) অতীত ও বর্তমান ছাত্রদের মধ্যে সেতুবন্ধন তৈরির একটি ডিজিটাল প্ল্যাটফর্ম।\n\n" +
      "রেজিস্ট্রেশনের পর অ্যাডমিন প্রতিটি আবেদন যাচাই করেন, যাতে ভুয়া অ্যাকাউন্ট না থাকে। অনুমোদনের পর ছাত্ররা নিজেদের প্রোফাইল সাজাতে, স্মৃতি লিখতে এবং মাতৃ প্রতিষ্ঠানের সাথে যুক্ত থাকতে পারেন।",
    showDeveloper: true,
  },
  footer: {
    about: "নবারুণ এডুকেশন ফ্যামিলির প্রাক্তন ও বর্তমান ছাত্র-ছাত্রীদের তথ্য ও স্মৃতির ডিজিটাল ঠিকানা। প্রজন্ম থেকে প্রজন্মের সংযোগ।",
    copyright: "নবারুণ এডুকেশন ফ্যামিলি। সর্বস্বত্ব সংরক্ষিত।",
    showDeveloperCredit: true,
  },
  nav: { labels: {}, hidden: [] },
  institutions: { items: {} },
};

const isCardList = (value: unknown): value is { title: string; desc: string }[] =>
  Array.isArray(value) && value.every((c) => c && typeof c === "object" && typeof (c as CardText).title === "string" && typeof (c as CardText).desc === "string");

function mergeGroup<T extends object>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return defaults;
  const out = { ...defaults } as Record<string, unknown>;
  const source = stored as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback)) continue;
    if ((key === "features" || key === "steps") && !isCardList(value)) continue;
    out[key] = value;
  }
  return out as T;
}

/** `rows` is the raw content of the site_settings table. */
export function buildSettings(rows: { key: string; value: unknown }[] | null | undefined): SiteSettings {
  const byKey = new Map((rows ?? []).map((r) => [r.key, r.value]));
  const next = { ...DEFAULT_SETTINGS } as Record<SettingsKey, unknown>;
  for (const key of SETTINGS_KEYS) {
    next[key] = mergeGroup(DEFAULT_SETTINGS[key] as object, byKey.get(key));
  }
  return next as unknown as SiteSettings;
}

/** Only links that are safe to put in an href; anything else becomes "". */
export function safeHref(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  return "";
}

export const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Digits only (plus a leading +) so the value works in a tel: link. */
export const telHref = (phone: string) => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
};

export const paragraphs = (text: string) =>
  text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
