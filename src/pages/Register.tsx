import { useState } from "react";
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
import { explainAuthError, OTHER_INSTITUTION, registerSchema, RELATIONS, type RegisterInput, type RegisterValues } from "@/lib/auth";

type Outcome = "pending" | "confirm-email";

export default function Register() {
  usePageMeta("রেজিস্ট্রেশন", "নবারুণ অ্যালামনাই পোর্টালে যোগ দিতে আবেদন করুন।");
  const navigate = useNavigate();
  const institutions = useInstitutions();
  const [showPass, setShowPass] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", batchYear: "", roll: "", phone: "", institution: "", relation: "", note: "", email: "", password: "", confirm: "", agree: false as unknown as true },
  });
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = form;

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
    if (error) { toast.error(explainAuthError(error).message); return; }

    // With e-mail confirmation switched on, an address that is already registered comes back
    // as a "success" with no identities instead of an error.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error(explainAuthError({ code: "user_already_exists" }).message);
      return;
    }

    setSubmittedEmail(v.email);
    if (data.session) { toast.success("অ্যাকাউন্ট তৈরি হয়েছে"); navigate("/dashboard"); return; }

    // No session yet: either the address still has to be confirmed, or the database confirmed it
    // for us and we can simply sign in.
    const signIn = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
    if (!signIn.error) { toast.success("অ্যাকাউন্ট তৈরি হয়েছে"); navigate("/dashboard"); return; }
    setOutcome(explainAuthError(signIn.error).issue === "unconfirmed" ? "confirm-email" : "pending");
  });

  if (outcome) {
    const needsConfirm = outcome === "confirm-email";
    return (
      <AuthLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border bg-card p-8 text-center shadow-elevated">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            {needsConfirm ? <MailCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" /> : <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />}
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold">আবেদন জমা হয়েছে!</h1>
          {needsConfirm ? (
            <p className="mb-6 text-muted-foreground"><strong className="break-all">{submittedEmail}</strong> ঠিকানায় একটি যাচাইয়ের লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে ইমেইল নিশ্চিত করুন, তারপর লগইন করুন। না পেলে স্প্যাম ফোল্ডার দেখুন।</p>
          ) : (
            <p className="mb-6 text-muted-foreground">আপনার অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করতে পারবেন।</p>
          )}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>অ্যাডমিন আপনার দেওয়া তথ্য যাচাই করে অনুমোদন দেবেন। অনুমোদনের পর আপনি প্রোফাইল সম্পাদনা করতে ও স্মৃতি শেয়ার করতে পারবেন।</span>
          </div>
          <Button asChild className="w-full"><Link to="/login">লগইন পেজে যান</Link></Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 pb-5 pt-8 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold">ছাত্র রেজিস্ট্রেশন</h1>
          <p className="mt-1 text-sm text-muted-foreground">নবারুণ অ্যালামনাই পোর্টালে যোগ দিতে আবেদন করুন</p>
        </div>

        <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs sm:mx-8">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>সঠিক তথ্য দিন। অ্যাডমিন আপনার আবেদন যাচাই করে অনুমোদন দিলে তবেই প্রোফাইল প্রকাশিত হবে ও আপনি তথ্য সম্পাদনা করতে পারবেন। ফোন নম্বর ও যাচাইয়ের তথ্য শুধু অ্যাডমিন দেখতে পাবেন।</span>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 pb-8 pt-5 sm:px-8" noValidate>
          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-primary">আপনার পরিচয়</legend>
            <Field label="পূর্ণ নাম" required error={errors.fullName?.message}>
              <Input placeholder="আপনার পূর্ণ নাম" autoComplete="name" className="h-11" {...register("fullName")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="কোন প্রতিষ্ঠান" htmlFor="reg-institution" required error={errors.institution?.message}>
                <Controller name="institution" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="reg-institution" className="h-11" aria-invalid={!!errors.institution}><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
                    <SelectContent>
                      {institutions.map((i) => <SelectItem key={i.id} value={i.nameBn}>{i.nameBn}</SelectItem>)}
                      <SelectItem value={OTHER_INSTITUTION}>{OTHER_INSTITUTION}</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </Field>
              <Field label="আপনি" htmlFor="reg-relation" required error={errors.relation?.message}>
                <Controller name="relation" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="reg-relation" className="h-11" aria-invalid={!!errors.relation}><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
                    <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ব্যাচ (SSC পাসের সাল)" required error={errors.batchYear?.message} hint="বর্তমান ছাত্র হলে প্রত্যাশিত সাল">
                <Input inputMode="numeric" placeholder="যেমন ২০১৭" maxLength={4} className="h-11" {...register("batchYear")} />
              </Field>
              <Field label="রোল নম্বর" error={errors.roll?.message} hint="মনে থাকলে দিন">
                <Input inputMode="numeric" placeholder="ঐচ্ছিক" className="h-11" {...register("roll")} />
              </Field>
            </div>
            <Field label="মোবাইল নম্বর" required error={errors.phone?.message} hint="যাচাইয়ের প্রয়োজনে অ্যাডমিন যোগাযোগ করতে পারেন">
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className="h-11" {...register("phone")} />
            </Field>
            <Field label="যাচাইয়ের জন্য কিছু তথ্য" error={errors.note?.message} hint="যেমন: শিক্ষকের নাম, সহপাঠী বা শ্রেণি — যা দেখে অ্যাডমিন আপনাকে চিনতে পারবেন">
              <Textarea rows={3} maxLength={500} placeholder="ঐচ্ছিক, তবে দিলে দ্রুত অনুমোদন পাবেন" {...register("note")} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-primary">লগইনের তথ্য</legend>
            <Field label="ইমেইল" required error={errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="your@email.com" className="h-11" {...register("email")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পাসওয়ার্ড" htmlFor="reg-password" required error={errors.password?.message} hint="কমপক্ষে ৬ অক্ষর">
                <div className="relative">
                  <Input id="reg-password" type={showPass ? "text" : "password"} autoComplete="new-password" className="h-11 pr-10" {...register("password")} />
                  <button type="button" onClick={() => setShowPass((s) => !s)} aria-label={showPass ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="পাসওয়ার্ড নিশ্চিত করুন" required error={errors.confirm?.message}>
                <Input type={showPass ? "text" : "password"} autoComplete="new-password" className="h-11" {...register("confirm")} />
              </Field>
            </div>
          </fieldset>

          <div>
            <Controller name="agree" control={control} render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" aria-invalid={!!errors.agree} />
                <span>আমি নিশ্চিত করছি যে উপরের তথ্যগুলো সঠিক এবং আমি নবারুণ পরিবারের সদস্য।</span>
              </label>
            )} />
            {errors.agree && <p role="alert" className="mt-1 text-xs text-destructive">{errors.agree.message}</p>}
          </div>

          <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isSubmitting ? "আবেদন জমা হচ্ছে..." : "আবেদন জমা দিন"}
          </Button>
          <p className="border-t pt-4 text-center text-sm text-muted-foreground">
            ইতিমধ্যে অ্যাকাউন্ট আছে? <Link to="/login" className="font-semibold text-primary hover:underline">লগইন করুন</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
