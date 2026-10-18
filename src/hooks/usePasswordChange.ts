import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";

const buildSchema = (lang: Lang) => {
  const t = (bn: string, en: string) => (lang === "en" ? en : bn);
  return z
    .object({
      password: z.string().min(6, t("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "Password must be at least 6 characters")).max(72, t("পাসওয়ার্ড ৭২ অক্ষরের মধ্যে হতে হবে", "Password must be at most 72 characters")),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: t("পাসওয়ার্ড মিলছে না", "Passwords do not match") });
};
type Values = z.infer<ReturnType<typeof buildSchema>>;

/** Form state and the Supabase call for changing the signed-in user's password. */
/** The dashboards are Bengali only; the public reset page passes the visitor's language. */
export function usePasswordChange(onDone?: () => void, lang: Lang = "bn") {
  const resolver = useMemo(() => zodResolver(buildSchema(lang)), [lang]);
  const form = useForm<Values>({ resolver, defaultValues: { password: "", confirm: "" } });
  const [saving, setSaving] = useState(false);

  const submit = form.handleSubmit(async ({ password }) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "en" ? "Password changed" : "পাসওয়ার্ড পরিবর্তন হয়েছে");
    form.reset();
    onDone?.();
  });
  return { form, submit, saving };
}
