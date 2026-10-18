import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { optionalUrl, yearField } from "@/lib/forms";

export type StudentProfile = Database["public"]["Tables"]["student_profiles"]["Row"];

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "আপনার নাম লিখুন").max(100, "নাম ১০০ অক্ষরের মধ্যে হতে হবে"),
  roll: z.string().trim().max(30, "রোল ৩০ অক্ষরের মধ্যে হতে হবে"),
  batch_year: yearField,
  result: z.string().trim().max(500, "৫০০ অক্ষরের মধ্যে লিখুন"),
  achievement: z.string().trim().max(1000, "১০০০ অক্ষরের মধ্যে লিখুন"),
  current_profession: z.string().trim().max(120, "১২০ অক্ষরের মধ্যে লিখুন"),
  higher_study: z.string().trim().max(200, "২০০ অক্ষরের মধ্যে লিখুন"),
  location: z.string().trim().max(120, "১২০ অক্ষরের মধ্যে লিখুন"),
  linkedin_link: optionalUrl,
  facebook_link: optionalUrl,
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const emptyProfileForm: ProfileFormValues = {
  full_name: "", roll: "", batch_year: "", result: "", achievement: "",
  current_profession: "", higher_study: "", location: "", linkedin_link: "", facebook_link: "",
};

export const toProfileForm = (profile: Partial<StudentProfile> | null | undefined): ProfileFormValues => ({
  full_name: profile?.full_name ?? "",
  roll: profile?.roll ?? "",
  batch_year: profile?.batch_year?.toString() ?? "",
  result: profile?.result ?? "",
  achievement: profile?.achievement ?? "",
  current_profession: profile?.current_profession ?? "",
  higher_study: profile?.higher_study ?? "",
  location: profile?.location ?? "",
  linkedin_link: profile?.linkedin_link ?? "",
  facebook_link: profile?.facebook_link ?? "",
});

const blank = (v: string) => (v === "" ? null : v);

/** Form values -> database columns (empty text becomes null). */
export const toProfileRow = (v: ProfileFormValues) => ({
  full_name: v.full_name,
  roll: blank(v.roll),
  batch_year: v.batch_year ? Number(v.batch_year) : null,
  result: blank(v.result),
  achievement: blank(v.achievement),
  current_profession: blank(v.current_profession),
  higher_study: blank(v.higher_study),
  location: blank(v.location),
  linkedin_link: blank(v.linkedin_link),
  facebook_link: blank(v.facebook_link),
});

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

const filled = (v: string | number | null | undefined) => v !== null && v !== undefined && String(v).trim() !== "";

/** How complete a profile is, and what is still missing (drives the checklist and the percentage). */
export function computeCompleteness(profile: Partial<StudentProfile> | null | undefined) {
  const p = profile ?? {};
  const items: CompletenessItem[] = [
    { key: "full_name", label: "পূর্ণ নাম", done: filled(p.full_name) },
    { key: "roll", label: "রোল নম্বর", done: filled(p.roll) },
    { key: "batch_year", label: "ব্যাচ (SSC সাল)", done: filled(p.batch_year) },
    { key: "photo", label: "প্রোফাইল ছবি", done: filled(p.photo) },
    { key: "result", label: "একাডেমিক ফলাফল", done: filled(p.result) },
    { key: "current_profession", label: "বর্তমান পেশা", done: filled(p.current_profession) },
    { key: "location", label: "অবস্থান", done: filled(p.location) },
    { key: "links", label: "LinkedIn বা Facebook লিংক", done: filled(p.linkedin_link) || filled(p.facebook_link) },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items, missing: items.filter((i) => !i.done) };
}
