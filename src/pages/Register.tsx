import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Eye, EyeOff, GraduationCap, Info, Loader2, MailCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/FormDialog";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { useInstitutions } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { buildRegisterSchema, explainAuthError, institutionLabel, OTHER_INSTITUTION, relationLabel, RELATIONS, type RegisterInput, type RegisterValues } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

type Outcome = "pending" | "confirm-email";

export default function Register() {
  const { t, lang } = useLang();
  usePageMeta(t("রেজিস্ট্রেশন", "Register"), t("নবারুণ অ্যালামনাই পোর্টালে যোগ দিতে আবেদন করুন।", "Apply to join the Nabarun alumni portal."));
  const navigate = useNavigate();
  const institutions = useInstitutions();
  const [showPass, setShowPass] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const resolver = useMemo(() => zodResolver(buildRegisterSchema(lang)), [lang]);
  const form = useForm<RegisterInput, unknown, RegisterValues>({
    resolver,
    defaultValues: { fullName: "", batchYear: "", roll: "", phone: "", institution: "", relation: "", note: "", email: "", password: "", confirm: "", agree: false as unknown as true },
  });
  const { register, control, handleSubmit, trigger, formState: { errors, isSubmitting } } = form;

  // Messages come from the schema, so when the language changes re-validate the fields that are showing an error.
  useEffect(() => {
    const failing = Object.keys(form.formState.errors) as (keyof RegisterInput)[];
    if (failing.length) void trigger(failing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const onSubmit = handleSubmit(async (v) => {
    const { data, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: v.fullName,
          batch_year: v.batchYear,
          roll: v.roll,
          phone: v.phone,
          institution: v.institution,
          relation: v.relation,
          note: v.note,
        },
      },
    });
    if (error) { toast.error(explainAuthError(error, lang).message); return; }

    // With e-mail confirmation switched on, an address that is already registered comes back
    // as a "success" with no identities instead of an error.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error(explainAuthError({ code: "user_already_exists" }, lang).message);
      return;
    }

    setSubmittedEmail(v.email);
    if (data.session) { toast.success(t("অ্যাকাউন্ট তৈরি হয়েছে", "Account created")); navigate("/dashboard"); return; }

    // No session yet: either the address still has to be confirmed, or the database confirmed it
    // for us and we can simply sign in.
    const signIn = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
    if (!signIn.error) { toast.success(t("অ্যাকাউন্ট তৈরি হয়েছে", "Account created")); navigate("/dashboard"); return; }
    setOutcome(explainAuthError(signIn.error, lang).issue === "unconfirmed" ? "confirm-email" : "pending");
  });

  if (outcome) {
    const needsConfirm = outcome === "confirm-email";
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border bg-card p-8 text-center shadow-elevated">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            {needsConfirm ? <MailCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" /> : <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold">{t("আবেদন জমা হয়েছে!", "Application submitted!")}</h1>
          {needsConfirm ? (
            <p className="mb-6 text-muted-foreground"><strong className="break-all">{submittedEmail}</strong>{t(" ঠিকানায় একটি যাচাইয়ের লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে ইমেইল নিশ্চিত করুন, তারপর লগইন করুন। না পেলে স্প্যাম ফোল্ডার দেখুন।", ": we sent a verification link to this address. Click it to confirm your email, then log in. If you can’t find it, check your spam folder.")}</p>
          ) : (
            <p className="mb-6 text-muted-foreground">{t("আপনার অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করতে পারবেন।", "Your account has been created. You can log in now.")}</p>
          )}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{t("অ্যাডমিন আপনার দেওয়া তথ্য যাচাই করে অনুমোদন দেবেন। অনুমোদনের পর আপনি প্রোফাইল সম্পাদনা করতে ও স্মৃতি শেয়ার করতে পারবেন।", "An admin will check your details and approve your application. Once approved, you can edit your profile and share memories.")}</span>
          </div>
          <Button asChild className="w-full"><Link to="/login">{t("লগইন পেজে যান", "Go to login")}</Link></Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 pb-5 pt-8 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold">{t("ছাত্র রেজিস্ট্রেশন", "Student registration")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("নবারুণ অ্যালামনাই পোর্টালে যোগ দিতে আবেদন করুন", "Apply to join the Nabarun alumni portal")}</p>
        </div>

        <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs sm:mx-8">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{t("সঠিক তথ্য দিন। অ্যাডমিন আপনার আবেদন যাচাই করে অনুমোদন দিলে তবেই প্রোফাইল প্রকাশিত হবে ও আপনি তথ্য সম্পাদনা করতে পারবেন। ফোন নম্বর ও যাচাইয়ের তথ্য শুধু অ্যাডমিন দেখতে পাবেন।", "Please give accurate details. Your profile is published and editable only after an admin verifies and approves your application. Only admins can see your phone number and verification details.")}</span>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 pb-8 pt-5 sm:px-8" noValidate>
          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-primary">{t("আপনার পরিচয়", "About you")}</legend>
            <Field label={t("পূর্ণ নাম", "Full name")} required error={errors.fullName?.message}>
              <Input placeholder={t("আপনার পূর্ণ নাম", "Your full name")} autoComplete="name" className="h-11" {...register("fullName")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("কোন প্রতিষ্ঠান", "Institution")} htmlFor="reg-institution" required error={errors.institution?.message}>
                <Controller name="institution" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="reg-institution" className="h-11" aria-invalid={!!errors.institution}><SelectValue placeholder={t("বাছাই করুন", "Select")} /></SelectTrigger>
                    <SelectContent>
                      {institutions.map((i) => <SelectItem key={i.id} value={i.nameBn}>{i.title}</SelectItem>)}
                      <SelectItem value={OTHER_INSTITUTION}>{institutionLabel(OTHER_INSTITUTION, lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </Field>
              <Field label={t("আপনি", "You are")} htmlFor="reg-relation" required error={errors.relation?.message}>
                <Controller name="relation" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="reg-relation" className="h-11" aria-invalid={!!errors.relation}><SelectValue placeholder={t("বাছাই করুন", "Select")} /></SelectTrigger>
                    <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r}>{relationLabel(r, lang)}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("ব্যাচ (SSC পাসের সাল)", "Batch (SSC pass year)")} required error={errors.batchYear?.message} hint={t("বর্তমান ছাত্র হলে প্রত্যাশিত সাল", "Expected year if you are a current student")}>
                <Input inputMode="numeric" placeholder={t("যেমন ২০১৭", "e.g. 2017")} maxLength={4} className="h-11" {...register("batchYear")} />
              </Field>
              <Field label={t("রোল নম্বর", "Roll number")} error={errors.roll?.message} hint={t("মনে থাকলে দিন", "If you remember it")}>
                <Input inputMode="numeric" placeholder={t("ঐচ্ছিক", "Optional")} className="h-11" {...register("roll")} />
              </Field>
            </div>
            <Field label={t("মোবাইল নম্বর", "Mobile number")} required error={errors.phone?.message} hint={t("যাচাইয়ের প্রয়োজনে অ্যাডমিন যোগাযোগ করতে পারেন", "An admin may contact you to verify your details")}>
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className="h-11" {...register("phone")} />
            </Field>
            <Field label={t("যাচাইয়ের জন্য কিছু তথ্য", "Details to help us verify you")} error={errors.note?.message} hint={t("যেমন: শিক্ষকের নাম, সহপাঠী বা শ্রেণি — যা দেখে অ্যাডমিন আপনাকে চিনতে পারবেন", "For example, a teacher’s name, a classmate or your class, so the admin can recognise you")}>
              <Textarea rows={3} maxLength={500} placeholder={t("ঐচ্ছিক, তবে দিলে দ্রুত অনুমোদন পাবেন", "Optional, but it speeds up approval")} {...register("note")} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-primary">{t("লগইনের তথ্য", "Login details")}</legend>
            <Field label={t("ইমেইল", "Email")} required error={errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="your@email.com" className="h-11" {...register("email")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("পাসওয়ার্ড", "Password")} htmlFor="reg-password" required error={errors.password?.message} hint={t("কমপক্ষে ৬ অক্ষর", "At least 6 characters")}>
                <div className="relative">
                  <Input id="reg-password" type={showPass ? "text" : "password"} autoComplete="new-password" className="h-11 pr-10" {...register("password")} />
                  <button type="button" onClick={() => setShowPass((s) => !s)} aria-label={showPass ? t("পাসওয়ার্ড লুকান", "Hide password") : t("পাসওয়ার্ড দেখান", "Show password")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label={t("পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")} required error={errors.confirm?.message}>
                <Input type={showPass ? "text" : "password"} autoComplete="new-password" className="h-11" {...register("confirm")} />
              </Field>
            </div>
          </fieldset>

          <div>
            <Controller name="agree" control={control} render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" aria-invalid={!!errors.agree} />
                <span>{t("আমি নিশ্চিত করছি যে উপরের তথ্যগুলো সঠিক এবং আমি নবারুণ পরিবারের সদস্য।", "I confirm that the details above are correct and that I am part of the Nabarun family.")}</span>
              </label>
            )} />
            {errors.agree && <p role="alert" className="mt-1 text-xs text-destructive">{errors.agree.message}</p>}
          </div>

          <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isSubmitting ? t("আবেদন জমা হচ্ছে...", "Submitting...") : t("আবেদন জমা দিন", "Submit application")}
          </Button>
          <p className="border-t pt-4 text-center text-sm text-muted-foreground">
            {t("ইতিমধ্যে অ্যাকাউন্ট আছে?", "Already have an account?")} <Link to="/login" className="font-semibold text-primary hover:underline">{t("লগইন করুন", "Log in")}</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
