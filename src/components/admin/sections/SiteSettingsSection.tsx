import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ExternalLink, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/FormDialog";
import { useConfirm } from "@/components/common/use-confirm";
import { attempt } from "@/hooks/useAdminData";
import { useResetSetting, useSaveSetting, useSiteSettings } from "@/hooks/useSiteSettings";
import { institutions as baseInstitutions } from "@/data/institutions";
import { NAV, isGroup } from "@/lib/navigation";
import { DEFAULT_SETTINGS, safeHref, telHref, type CardText, type InstitutionOverride, type SettingsKey, type SiteSettings } from "@/lib/siteSettings";
import { SectionHeader } from "../AdminCommon";

type FieldKind = "text" | "textarea" | "switch" | "link" | "url" | "email";
interface FieldDef {
  name: string;
  label: string;
  kind?: FieldKind;
  hint?: string;
  rows?: number;
  max?: number;
  wide?: boolean;
}
type Values = Record<string, string | boolean>;

const validLink = (kind: FieldKind | undefined, v: string) => {
  if (!v) return true;
  if (kind === "link") return safeHref(v) !== ""; // /path, https://, mailto:, tel:
  if (kind === "url") return /^https?:\/\//i.test(v);
  if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return true;
};
const linkError = (kind?: FieldKind) =>
  kind === "email" ? "সঠিক ইমেইল দিন" : kind === "link" ? "/পাতা, https://… বা mailto: দিয়ে শুরু করুন" : "https:// দিয়ে শুরু হওয়া লিংক দিন";

/** Save / reset bar shared by every tab. */
function SaveBar({ dirty, saving, onReset, resetting, showReset }: { dirty: boolean; saving: boolean; onReset: () => void; resetting: boolean; showReset: boolean }) {
  return (
    <div className="sticky bottom-20 z-10 mt-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-elevated backdrop-blur lg:bottom-4">
      <Button type="submit" disabled={!dirty || saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সংরক্ষণ করুন
      </Button>
      {showReset && (
        <Button type="button" variant="ghost" onClick={onReset} disabled={resetting} className="gap-2 text-muted-foreground">
          <RotateCcw className="h-4 w-4" /> মূল লেখায় ফিরুন
        </Button>
      )}
      <span className="ml-auto text-xs text-muted-foreground">{dirty ? "অসংরক্ষিত পরিবর্তন আছে" : "সব সংরক্ষিত"}</span>
    </div>
  );
}

interface GroupFormProps {
  groupKey: SettingsKey;
  fields: FieldDef[];
  current: Values;
  /** The whole stored group, so fields edited elsewhere (e.g. the home cards) are kept. */
  base: object;
  /** Fields derived from the form values just before saving. */
  derive?: (values: Values) => Values;
  isCustomised: boolean;
}

/** One settings group rendered from a list of field definitions. */
function GroupForm({ groupKey, fields, current, base, derive, isCustomised }: GroupFormProps) {
  const confirm = useConfirm();
  const save = useSaveSetting();
  const reset = useResetSetting();
  const form = useForm<Values>({ defaultValues: current });
  const { register, control, handleSubmit, setError, formState: { errors, isDirty } } = form;
  const snapshot = JSON.stringify(current);
  const { reset: resetForm } = form;
  useEffect(() => { resetForm(JSON.parse(snapshot) as Values); }, [snapshot, resetForm]);

  const submit = handleSubmit(async (values) => {
    let bad = false;
    for (const f of fields) {
      const v = values[f.name];
      if (typeof v === "string" && !validLink(f.kind, v.trim())) { setError(f.name, { message: linkError(f.kind) }); bad = true; }
    }
    if (bad) return;
    const clean: Values = {};
    for (const f of fields) { const v = values[f.name]; clean[f.name] = typeof v === "string" ? v.trim() : v; }
    const ok = await attempt(save.mutateAsync({ key: groupKey, value: { ...base, ...clean, ...(derive?.(clean) ?? {}) } }), "সংরক্ষিত হয়েছে — ওয়েবসাইটে এখনই দেখা যাবে");
    if (ok) form.reset(clean);
  });

  const onReset = async () => {
    const ok = await confirm({ title: "মূল লেখায় ফিরবেন?", description: "এই অংশের সব পরিবর্তন মুছে ওয়েবসাইট আগের ডিফল্ট লেখায় ফিরে যাবে।", confirmLabel: "ফিরুন", destructive: true });
    if (ok) await attempt(reset.mutateAsync(groupKey), "ডিফল্ট লেখা ফিরিয়ে আনা হয়েছে");
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const error = errors[f.name]?.message as string | undefined;
          if (f.kind === "switch") {
            return (
              <div key={f.name} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 sm:col-span-2">
                <div><p className="text-sm font-medium" id={`sw-${groupKey}-${f.name}`}>{f.label}</p>{f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}</div>
                <Controller name={f.name} control={control} render={({ field }) => (
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} aria-labelledby={`sw-${groupKey}-${f.name}`} />
                )} />
              </div>
            );
          }
          return (
            <Field key={f.name} label={f.label} hint={f.hint} error={error} className={f.wide || f.kind === "textarea" ? "sm:col-span-2" : undefined}>
              {f.kind === "textarea"
                ? <Textarea rows={f.rows ?? 3} maxLength={f.max ?? 2000} {...register(f.name)} />
                : <Input maxLength={f.max ?? 300} inputMode={f.kind === "url" || f.kind === "link" ? "url" : f.kind === "email" ? "email" : undefined} {...register(f.name)} />}
            </Field>
          );
        })}
      </div>
      <SaveBar dirty={isDirty} saving={save.isPending} onReset={onReset} resetting={reset.isPending} showReset={isCustomised} />
    </form>
  );
}


/** Titles and texts of the home page's feature cards and "how to join" steps. */
function CardsEditor({ home, isCustomised }: { home: SiteSettings["home"]; isCustomised: boolean }) {
  const save = useSaveSetting();
  const [features, setFeatures] = useState<CardText[]>(home.features);
  const [steps, setSteps] = useState<CardText[]>(home.steps);
  useEffect(() => { setFeatures(home.features); setSteps(home.steps); }, [home.features, home.steps]);
  const dirty = JSON.stringify({ features, steps }) !== JSON.stringify({ features: home.features, steps: home.steps });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await attempt(save.mutateAsync({ key: "home", value: { ...home, features, steps } }), "সংরক্ষিত হয়েছে");
  };
  const edit = (list: CardText[], set: (v: CardText[]) => void, i: number, patch: Partial<CardText>) => set(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const group = (title: string, hint: string, list: CardText[], set: (v: CardText[]) => void) => (
    <section className="mb-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
      <div className="space-y-3">
        {list.map((c, i) => (
          <div key={i} className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_2fr]">
            <Input aria-label={`${title} ${i + 1} — শিরোনাম`} placeholder="শিরোনাম (খালি রাখলে কার্ডটি লুকানো থাকবে)" maxLength={60} value={c.title} onChange={(e) => edit(list, set, i, { title: e.target.value })} />
            <Input aria-label={`${title} ${i + 1} — বর্ণনা`} placeholder="বর্ণনা" maxLength={200} value={c.desc} onChange={(e) => edit(list, set, i, { desc: e.target.value })} />
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <form onSubmit={submit}>
      {group("সুবিধার কার্ড", "“সবকিছু এক জায়গায়” অংশের ৬টি কার্ড। আইকন কার্ডের ক্রম অনুযায়ী বসে।", features, setFeatures)}
      {group("যুক্ত হওয়ার ধাপ", "“তিন ধাপে নবারুণ পরিবারে” অংশের ৩টি ধাপ।", steps, setSteps)}
      <SaveBar dirty={dirty} saving={save.isPending} onReset={() => undefined} resetting={false} showReset={false} />
      {isCustomised && <p className="mt-2 text-xs text-muted-foreground">সব হোম পেজ লেখা ডিফল্টে ফেরাতে “হোম পেজ” ট্যাবের “মূল লেখায় ফিরুন” ব্যবহার করুন।</p>}
    </form>
  );
}

const GENERAL: FieldDef[] = [
  { name: "siteName", label: "ওয়েবসাইটের নাম (বাংলা)", max: 80 },
  { name: "siteNameEn", label: "ওয়েবসাইটের নাম (ইংরেজি)", max: 80 },
  { name: "tagline", label: "ট্যাগলাইন / প্রতিষ্ঠানের নাম", max: 120, wide: true },
  { name: "email", label: "ইমেইল", kind: "email" },
  { name: "phoneDisplay", label: "ফোন নম্বর", hint: "যেমন +880 1741 919462", max: 40 },
  { name: "address", label: "ঠিকানা", kind: "textarea", rows: 2, max: 300 },
  { name: "mapUrl", label: "Google Maps লিংক", kind: "url", hint: "ঠিকানায় ক্লিক করলে এই লিংক খুলবে" },
  { name: "website", label: "ওয়েবসাইট", kind: "url" },
  { name: "workingHours", label: "সময়সূচি", hint: "ঐচ্ছিক — যেমন: শনি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা", max: 120 },
];
const SOCIAL: FieldDef[] = [
  { name: "facebook", label: "Facebook পেজ", kind: "url", hint: "খালি রাখলে ওয়েবসাইটে আইকন দেখাবে না" },
  { name: "youtube", label: "YouTube চ্যানেল", kind: "url" },
  { name: "instagram", label: "Instagram", kind: "url" },
  { name: "linkedin", label: "LinkedIn", kind: "url" },
  { name: "twitter", label: "X (Twitter)", kind: "url" },
  { name: "whatsapp", label: "WhatsApp লিংক", kind: "url", hint: "যেমন https://wa.me/8801XXXXXXXXX" },
];
const HOME: FieldDef[] = [
  { name: "heroBadge", label: "ব্যানারের ছোট ব্যাজ", max: 80 },
  { name: "heroTitle", label: "মূল শিরোনাম", kind: "textarea", rows: 2, max: 150 },
  { name: "heroMotto", label: "স্লোগান", hint: "খালি রাখলে দেখাবে না", max: 120 },
  { name: "heroSubtitle", label: "ব্যানারের বর্ণনা", kind: "textarea", rows: 3, max: 400 },
  { name: "primaryCtaLabel", label: "প্রধান বাটনের লেখা", max: 40 },
  { name: "primaryCtaLink", label: "প্রধান বাটনের লিংক", kind: "link", hint: "যেমন /register" },
  { name: "secondaryCtaLabel", label: "দ্বিতীয় বাটনের লেখা", hint: "খালি রাখলে বাটন থাকবে না", max: 40 },
  { name: "secondaryCtaLink", label: "দ্বিতীয় বাটনের লিংক", kind: "link" },
  { name: "institutionsTitle", label: "প্রতিষ্ঠান অংশের শিরোনাম", max: 100 },
  { name: "institutionsSubtitle", label: "প্রতিষ্ঠান অংশের বর্ণনা", max: 200 },
  { name: "featuresTitle", label: "সুবিধা অংশের শিরোনাম", max: 100 },
  { name: "featuresSubtitle", label: "সুবিধা অংশের বর্ণনা", max: 250 },
  { name: "bannerText", label: "নিচের বড় উক্তি", hint: "খালি রাখলে ব্যানারটি থাকবে না", max: 150, wide: true },
  { name: "bannerSubtext", label: "উক্তির নিচের লেখা", max: 200, wide: true },
  { name: "ctaTitle", label: "শেষ আহ্বানের শিরোনাম", max: 100 },
  { name: "ctaButton", label: "শেষ আহ্বানের বাটন", max: 40 },
  { name: "ctaText", label: "শেষ আহ্বানের লেখা", kind: "textarea", rows: 2, max: 300 },
  { name: "showNotices", label: "নোটিশের চলমান বার দেখান", kind: "switch" },
  { name: "showEvents", label: "আসন্ন ইভেন্ট অংশ দেখান", kind: "switch" },
  { name: "showTopAlumni", label: "বিশিষ্ট প্রাক্তন ছাত্র অংশ দেখান", kind: "switch" },
  { name: "showMemories", label: "স্মৃতির অংশ দেখান", kind: "switch" },
  { name: "showTestimonials", label: "মতামতের অংশ দেখান", kind: "switch", hint: "অনুমোদিত মতামত না থাকলে এমনিতেই লুকানো থাকে" },
];
const ABOUT: FieldDef[] = [
  { name: "heroTitle", label: "পাতার শিরোনাম", max: 100 },
  { name: "heroSubtitle", label: "পাতার উপশিরোনাম", kind: "textarea", rows: 2, max: 250 },
  { name: "mission", label: "আমাদের মিশন", kind: "textarea", rows: 2, max: 400 },
  { name: "vision", label: "আমাদের ভিশন", kind: "textarea", rows: 2, max: 400 },
  { name: "values", label: "আমাদের মূল্যবোধ", kind: "textarea", rows: 2, max: 400 },
  { name: "systemTitle", label: "বিস্তারিত অংশের শিরোনাম", max: 100 },
  { name: "systemText", label: "বিস্তারিত বর্ণনা", kind: "textarea", rows: 8, max: 4000, hint: "অনুচ্ছেদের মাঝে একটি ফাঁকা লাইন দিন।" },
  { name: "showDeveloper", label: "ডেভেলপারের পরিচিতি দেখান", kind: "switch" },
];
const FOOTER: FieldDef[] = [
  { name: "about", label: "ফুটারের পরিচিতি লেখা", kind: "textarea", rows: 3, max: 400 },
  { name: "copyright", label: "কপিরাইট লেখা", hint: "বছরের পরে এই লেখা বসবে — “© ২০২৬ …”", max: 150, wide: true },
  { name: "showDeveloperCredit", label: "ফুটারে ডেভেলপারের নাম দেখান", kind: "switch" },
];

/** Rename and hide menu entries. */
function NavEditor({ nav, isCustomised }: { nav: SiteSettings["nav"]; isCustomised: boolean }) {
  const confirm = useConfirm();
  const save = useSaveSetting();
  const reset = useResetSetting();
  const [labels, setLabels] = useState<Record<string, string>>(nav.labels);
  const [hidden, setHidden] = useState<Set<string>>(new Set(nav.hidden));
  useEffect(() => { setLabels(nav.labels); setHidden(new Set(nav.hidden)); }, [nav]);

  const dirty = JSON.stringify({ l: labels, h: [...hidden].sort() }) !== JSON.stringify({ l: nav.labels, h: [...nav.hidden].sort() });
  const rows = NAV.flatMap((e) => (isGroup(e) ? [{ id: e.id, label: e.label, depth: 0, group: true }, ...e.items.map((i) => ({ id: i.id, label: i.label, depth: 1, group: false }))] : [{ id: e.id, label: e.label, depth: 0, group: false }]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabels = Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, v.trim()]).filter(([k, v]) => v && v !== rows.find((r) => r.id === k)?.label));
    await attempt(save.mutateAsync({ key: "nav", value: { labels: cleanLabels, hidden: [...hidden] } }), "মেনু সংরক্ষিত হয়েছে");
  };
  const onReset = async () => {
    if (await confirm({ title: "মেনু আগের অবস্থায় ফেরাবেন?", description: "সব নাম পরিবর্তন ও লুকানো আইটেম আগের মতো হয়ে যাবে।", confirmLabel: "ফেরান", destructive: true })) {
      await attempt(reset.mutateAsync("nav"), "মেনু আগের অবস্থায় ফিরেছে");
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="mb-4 text-sm text-muted-foreground">মেনুর কাঠামো (কোন গ্রুপে কোন পাতা) নির্দিষ্ট; এখানে প্রতিটির নাম বদলাতে বা লুকাতে পারবেন। গ্রুপ লুকালে তার ভেতরের সব পাতা মেনু থেকে সরে যাবে।</p>
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((r) => (
          <li key={r.id} className={`flex items-center gap-3 p-3 ${r.depth ? "pl-8" : ""}`}>
            <Input
              aria-label={`${r.label} — মেনুতে দেখানো নাম`} placeholder={r.label} value={labels[r.id] ?? ""} maxLength={40}
              onChange={(e) => setLabels((l) => ({ ...l, [r.id]: e.target.value }))} className={r.group ? "font-semibold" : ""}
            />
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <Switch checked={!hidden.has(r.id)} onCheckedChange={(on) => setHidden((h) => { const n = new Set(h); if (on) n.delete(r.id); else n.add(r.id); return n; })} aria-label={`${r.label} দেখান`} />
              <span className="hidden sm:inline">{hidden.has(r.id) ? "লুকানো" : "দেখানো"}</span>
            </label>
          </li>
        ))}
      </ul>
      <SaveBar dirty={dirty} saving={save.isPending} onReset={onReset} resetting={reset.isPending} showReset={isCustomised} />
    </form>
  );
}

const INSTITUTION_FIELDS: { name: keyof InstitutionOverride; label: string; kind?: FieldKind; wide?: boolean }[] = [
  { name: "nameBn", label: "নাম (বাংলা)" },
  { name: "name", label: "নাম (ইংরেজি)" },
  { name: "established", label: "স্থাপিত সাল" },
  { name: "phoneDisplay", label: "ফোন নম্বর" },
  { name: "email", label: "ইমেইল", kind: "email" },
  { name: "mapUrl", label: "Google Maps লিংক", kind: "url" },
  { name: "address", label: "ঠিকানা", wide: true },
  { name: "desc", label: "সংক্ষিপ্ত বর্ণনা", kind: "textarea", wide: true },
];

/** Name, contact details and visibility of the three institutions. */
function InstitutionsEditor({ items, isCustomised }: { items: SiteSettings["institutions"]["items"]; isCustomised: boolean }) {
  const confirm = useConfirm();
  const save = useSaveSetting();
  const reset = useResetSetting();
  const initial = useMemo(() => {
    const out: Record<string, Record<string, string | boolean>> = {};
    for (const base of baseInstitutions) {
      const o = items[base.id] ?? {};
      out[base.id] = {
        nameBn: o.nameBn ?? base.nameBn, name: o.name ?? base.name, established: o.established ?? base.established ?? "",
        phoneDisplay: o.phoneDisplay ?? base.phoneDisplay, email: o.email ?? base.email, mapUrl: o.mapUrl ?? base.mapUrl ?? "",
        address: o.address ?? base.address ?? "", desc: o.desc ?? base.desc, hidden: o.hidden === true,
      };
    }
    return out;
  }, [items]);
  const [state, setState] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { setState(initial); setErrors({}); }, [initial]);
  const dirty = JSON.stringify(state) !== JSON.stringify(initial);

  const set = (id: string, name: string, value: string | boolean) => setState((s) => ({ ...s, [id]: { ...s[id], [name]: value } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const [id, vals] of Object.entries(state)) {
      for (const f of INSTITUTION_FIELDS) {
        const v = String(vals[f.name] ?? "").trim();
        if (!validLink(f.kind, v)) nextErrors[`${id}.${f.name}`] = linkError(f.kind);
      }
      if (!String(vals.nameBn).trim()) nextErrors[`${id}.nameBn`] = "নাম দিন";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const value: SiteSettings["institutions"] = { items: {} };
    for (const [id, vals] of Object.entries(state)) {
      const o: InstitutionOverride = { hidden: vals.hidden === true };
      for (const f of INSTITUTION_FIELDS) (o as Record<string, string>)[f.name] = String(vals[f.name] ?? "").trim();
      value.items[id] = o;
    }
    await attempt(save.mutateAsync({ key: "institutions", value }), "প্রতিষ্ঠানের তথ্য সংরক্ষিত হয়েছে");
  };
  const onReset = async () => {
    if (await confirm({ title: "প্রতিষ্ঠানের তথ্য আগের অবস্থায় ফেরাবেন?", description: "আপনার করা সব পরিবর্তন মুছে যাবে।", confirmLabel: "ফেরান", destructive: true })) {
      await attempt(reset.mutateAsync("institutions"), "আগের তথ্য ফিরে এসেছে");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-4 text-sm text-muted-foreground">হোম, পরিচিতি ও যোগাযোগ অংশে এই তথ্য দেখানো হয়। লোগো পরিবর্তনের প্রয়োজন হলে ডেভেলপারের সাথে যোগাযোগ করুন।</p>
      <div className="space-y-5">
        {baseInstitutions.map((base) => {
          const vals = state[base.id];
          return (
            <section key={base.id} className="rounded-xl border bg-card p-4 shadow-card sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border bg-white p-1.5"><img src={base.logo} alt="" className="max-h-full w-auto object-contain" /></div>
                <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{base.nameBn}</h3>
                <label className="flex items-center gap-2 text-sm"><Switch checked={vals.hidden !== true} onCheckedChange={(on) => set(base.id, "hidden", !on)} aria-label={`${base.nameBn} দেখান`} /> <span className="hidden sm:inline">ওয়েবসাইটে দেখান</span></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {INSTITUTION_FIELDS.map((f) => (
                  <Field key={f.name} label={f.label} error={errors[`${base.id}.${f.name}`]} className={f.wide ? "sm:col-span-2" : undefined}>
                    {f.kind === "textarea"
                      ? <Textarea rows={2} maxLength={300} value={String(vals[f.name] ?? "")} onChange={(e) => set(base.id, f.name, e.target.value)} />
                      : <Input maxLength={200} value={String(vals[f.name] ?? "")} onChange={(e) => set(base.id, f.name, e.target.value)} />}
                  </Field>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <SaveBar dirty={dirty} saving={save.isPending} onReset={onReset} resetting={reset.isPending} showReset={isCustomised} />
    </form>
  );
}

const TABS = [
  { id: "general", label: "সাধারণ ও যোগাযোগ" },
  { id: "social", label: "সোশ্যাল মিডিয়া" },
  { id: "home", label: "হোম পেজ" },
  { id: "cards", label: "হোম কার্ড" },
  { id: "about", label: "আমাদের সম্পর্কে" },
  { id: "institutions", label: "প্রতিষ্ঠান" },
  { id: "nav", label: "মেনু" },
  { id: "footer", label: "ফুটার" },
] as const;

export default function SiteSettingsSection() {
  const { settings } = useSiteSettings();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  // a group counts as customised when it differs from the built-in text
  const customised = (key: SettingsKey) => JSON.stringify(settings[key]) !== JSON.stringify(DEFAULT_SETTINGS[key]);

  return (
    <div>
      <SectionHeader
        title="সাইট সেটিংস"
        description="ওয়েবসাইটের লেখা, যোগাযোগের তথ্য, মেনু ও ফুটার এখান থেকেই বদলান — সংরক্ষণ করার সাথে সাথে সাইটে দেখা যাবে।"
        actions={<Button asChild variant="outline" className="gap-2"><a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> সাইট দেখুন</a></Button>}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max justify-start gap-1 p-1">
            {TABS.map((t) => <TabsTrigger key={t.id} value={t.id} className="whitespace-nowrap">{t.label}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-4">
          <GroupForm groupKey="general" fields={GENERAL} current={settings.general as unknown as Values} base={settings.general} isCustomised={customised("general")}
            derive={(v) => ({ phone: telHref(String(v.phoneDisplay)).replace(/^tel:/, "") })} />
        </TabsContent>
        <TabsContent value="social" className="mt-4"><GroupForm groupKey="social" fields={SOCIAL} current={settings.social as unknown as Values} base={settings.social} isCustomised={customised("social")} /></TabsContent>
        <TabsContent value="home" className="mt-4"><GroupForm groupKey="home" fields={HOME} current={settings.home as unknown as Values} base={settings.home} isCustomised={customised("home")} /></TabsContent>
        <TabsContent value="cards" className="mt-4"><CardsEditor home={settings.home} isCustomised={customised("home")} /></TabsContent>
        <TabsContent value="about" className="mt-4"><GroupForm groupKey="about" fields={ABOUT} current={settings.about as unknown as Values} base={settings.about} isCustomised={customised("about")} /></TabsContent>
        <TabsContent value="institutions" className="mt-4"><InstitutionsEditor items={settings.institutions.items} isCustomised={customised("institutions")} /></TabsContent>
        <TabsContent value="nav" className="mt-4"><NavEditor nav={settings.nav} isCustomised={customised("nav")} /></TabsContent>
        <TabsContent value="footer" className="mt-4"><GroupForm groupKey="footer" fields={FOOTER} current={settings.footer as unknown as Values} base={settings.footer} isCustomised={customised("footer")} /></TabsContent>
      </Tabs>
    </div>
  );
}
