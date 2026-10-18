import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, Lock, MessageSquare, Pencil, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Field } from "@/components/common/FormDialog";
import { useInstitutions } from "@/hooks/useSiteSettings";
import { useMyVerification, useResubmitVerification, type Verification } from "@/hooks/useStudentData";
import { OTHER_INSTITUTION, RELATIONS, verificationSchema, type VerificationInput, type VerificationValues } from "@/lib/auth";
import type { StudentProfile } from "@/lib/profile";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = [
  { label: "রেজিস্ট্রেশন সম্পন্ন", done: true },
  { label: "অ্যাডমিন যাচাই", done: false },
  { label: "প্রোফাইল ও স্মৃতি চালু", done: false },
];

function Detail({ label, value, className }: { label: string; value?: string | number | null; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function CorrectionForm({ userId, verification, onDone }: { userId: string; verification: Verification | null; onDone: () => void }) {
  const institutions = useInstitutions();
  const save = useResubmitVerification(userId);
  const { register, control, handleSubmit, formState: { errors } } = useForm<VerificationInput, unknown, VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { phone: verification?.phone ?? "", institution: verification?.institution ?? "", relation: verification?.relation ?? "", note: verification?.note ?? "" },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      toast.success("তথ্য জমা হয়েছে — অ্যাডমিন আবার যাচাই করবেন");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "জমা দেওয়া যায়নি");
    }
  });

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border bg-muted/30 p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="প্রতিষ্ঠান" htmlFor="fix-institution" required error={errors.institution?.message}>
          <Controller name="institution" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="fix-institution"><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
              <SelectContent>
                {institutions.map((i) => <SelectItem key={i.id} value={i.nameBn}>{i.nameBn}</SelectItem>)}
                <SelectItem value={OTHER_INSTITUTION}>{OTHER_INSTITUTION}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="আপনি" htmlFor="fix-relation" required error={errors.relation?.message}>
          <Controller name="relation" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="fix-relation"><SelectValue placeholder="বাছাই করুন" /></SelectTrigger>
              <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
      </div>
      <Field label="মোবাইল নম্বর" required error={errors.phone?.message}>
        <Input type="tel" inputMode="tel" placeholder="01XXXXXXXXX" {...register("phone")} />
      </Field>
      <Field label="যাচাইয়ের জন্য তথ্য" error={errors.note?.message} hint="নাম, ব্যাচ বা রোলে ভুল থাকলে এখানে সঠিকটি লিখে দিন।">
        <Textarea rows={3} maxLength={500} {...register("note")} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending} className="gap-2">{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} জমা দিন</Button>
        <Button type="button" variant="ghost" onClick={onDone}>বাতিল</Button>
      </div>
    </form>
  );
}

/** What a not-yet-approved student sees instead of the normal overview. */
export function PendingOverview({ userId, name, email, profile }: { userId: string; name: string; email: string; profile: StudentProfile | null | undefined }) {
  const { data: verification } = useMyVerification(userId);
  const rejected = verification?.status === "rejected";
  const [editing, setEditing] = useState(false);
  const showForm = editing || rejected;

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="relative overflow-hidden bg-hero-gradient px-6 py-8 text-white sm:px-8">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              {rejected ? <ShieldAlert className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
            </span>
            <div>
              <p className="text-sm text-white/75">স্বাগতম, {name}</p>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{rejected ? "আবেদনে কিছু তথ্য দরকার" : "আপনার আবেদন যাচাই করা হচ্ছে"}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                {rejected
                  ? "অ্যাডমিন আপনার আবেদন এখনো অনুমোদন করতে পারেননি। নিচের মন্তব্য দেখে তথ্য সংশোধন করে আবার জমা দিন।"
                  : "অ্যাডমিন আপনার দেওয়া তথ্য মিলিয়ে দেখবেন। অনুমোদনের পর আপনি প্রোফাইল সম্পাদনা করতে ও স্মৃতি শেয়ার করতে পারবেন।"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <ol className="mb-6 grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.label} className={cn("flex items-center gap-3 rounded-xl border p-3 text-sm", s.done ? "border-emerald-500/30 bg-emerald-500/10" : i === 1 ? "border-primary/40 bg-primary/5" : "bg-muted/40 text-muted-foreground")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", s.done ? "bg-emerald-500 text-white" : i === 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : i === 1 ? <Clock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>
                <span className="font-medium">{s.label}</span>
              </li>
            ))}
          </ol>

          {rejected && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive dark:text-red-300">অ্যাডমিনের মন্তব্য{verification?.reviewed_at ? ` (${formatDate(verification.reviewed_at)})` : ""}</p>
                <p className="mt-1">{verification?.review_note || "কারণ উল্লেখ করা হয়নি। তথ্য সংশোধন করে আবার জমা দিন, অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।"}</p>
              </div>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">আপনার জমা দেওয়া তথ্য</h3>
            {!showForm && <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2"><Pencil className="h-3.5 w-3.5" /> সংশোধন</Button>}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="নাম" value={profile?.full_name || name} />
            <Detail label="ইমেইল" value={email} />
            <Detail label="ব্যাচ" value={profile?.batch_year} />
            <Detail label="রোল" value={profile?.roll} />
            <Detail label="প্রতিষ্ঠান" value={verification?.institution} />
            <Detail label="পরিচয়" value={verification?.relation} />
            <Detail label="মোবাইল" value={verification?.phone} />
            <Detail className="sm:col-span-2" label="যাচাইয়ের তথ্য" value={verification?.note} />
          </dl>
          {showForm && <CorrectionForm userId={userId} verification={verification ?? null} onDone={() => setEditing(false)} />}

          <p className="mt-6 text-sm text-muted-foreground">
            অনেকক্ষণ পরও অনুমোদন না পেলে <Link to="/contact" className="font-medium text-primary underline underline-offset-2">যোগাযোগ করুন</Link>।
          </p>
        </div>
      </motion.section>
    </div>
  );
}

/** Shown in place of Profile / Memories until the account is approved. */
export function LockedSection({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed bg-card p-10 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-8 w-8" /></span>
      <h2 className="font-display text-xl font-bold">{title} এখনো চালু হয়নি</h2>
      <p className="mt-2 text-sm text-muted-foreground">অ্যাডমিন আপনার আবেদন অনুমোদন করলেই এই অংশ খুলে যাবে। ততক্ষণ আবেদনের অবস্থা ওভারভিউতে দেখতে পারবেন।</p>
      <Button onClick={onBack} className="mt-5">আবেদনের অবস্থা দেখুন</Button>
    </div>
  );
}
