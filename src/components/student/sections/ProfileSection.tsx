import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Camera, GraduationCap, Link2, Loader2, MapPin, MessageSquareQuote, Save, Send, Trash2, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/FormDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/common/use-confirm";
import { useMyTestimonial, useSaveProfile, useSetPhoto, useStudentProfile } from "@/hooks/useStudentData";
import { initialsOf } from "@/lib/format";
import { IMAGE_MAX_RAW_BYTES, IMAGE_TYPES, prepareImage, safeHttpsUrl } from "@/lib/memories";
import { FILE_EXT } from "@/lib/memory-storage";
import { profileSchema, toProfileForm, type ProfileFormValues, type StudentProfile } from "@/lib/profile";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function Card({ icon: Icon, title, hint, children }: { icon: typeof UserRound; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Icon className="h-5 w-5 text-primary" /> {title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PhotoCard({ user, profile, name }: { user: User; profile: StudentProfile | null | undefined; name: string }) {
  const input = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const setPhoto = useSetPhoto(user.id);
  const [busy, setBusy] = useState(false);
  const photo = safeHttpsUrl(profile?.photo);

  const upload = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) { toast.error("শুধুমাত্র ছবি দিন (JPG, PNG, WebP, GIF)"); return; }
    if (file.size > IMAGE_MAX_RAW_BYTES) { toast.error("ছবির সাইজ ২০MB এর কম হতে হবে"); return; }
    setBusy(true);
    try {
      const prepared = await prepareImage(file);
      if (prepared.size > AVATAR_MAX_BYTES) throw new Error("ছবির সাইজ ২MB এর কম হতে হবে");
      const path = `${user.id}/avatar.${FILE_EXT[prepared.type] ?? "jpg"}`;
      const { error } = await supabase.storage.from("avatars").upload(path, prepared, { upsert: true, contentType: prepared.type, cacheControl: "3600" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await setPhoto.mutateAsync(`${data.publicUrl}?v=${Date.now()}`);
      // an older picture with another file type would just waste space
      const { data: files } = await supabase.storage.from("avatars").list(user.id);
      const stale = (files ?? []).filter((f) => `${user.id}/${f.name}` !== path).map((f) => `${user.id}/${f.name}`);
      if (stale.length) void supabase.storage.from("avatars").remove(stale);
      toast.success("ছবি আপডেট হয়েছে");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ছবি আপলোড করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!(await confirm({ title: "প্রোফাইল ছবি সরাবেন?", description: "ছবি মুছে যাবে, আপনি চাইলে পরে নতুন ছবি দিতে পারবেন।", confirmLabel: "সরান", destructive: true }))) return;
    setBusy(true);
    try {
      await setPhoto.mutateAsync(null);
      const { data: files } = await supabase.storage.from("avatars").list(user.id);
      const paths = (files ?? []).map((f) => `${user.id}/${f.name}`);
      if (paths.length) void supabase.storage.from("avatars").remove(paths);
      toast.success("ছবি সরানো হয়েছে");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ছবি সরানো যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={Camera} title="প্রোফাইল ছবি" hint="স্পষ্ট মুখের ছবি দিন — ডিরেক্টরিতে এটিই সবার আগে চোখে পড়ে।">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
          {photo && <AvatarImage src={photo} alt="প্রোফাইল ছবি" />}
          <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">{initialsOf(name, "S")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} aria-label="প্রোফাইল ছবি বাছাই করুন" className="sr-only" tabIndex={-1} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          <Button type="button" onClick={() => input.current?.click()} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {photo ? "ছবি পরিবর্তন" : "ছবি যোগ করুন"}</Button>
          {photo && <Button type="button" variant="outline" onClick={removePhoto} disabled={busy} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> সরান</Button>}
        </div>
      </div>
    </Card>
  );
}

function TestimonialCard({ user, profile, name }: { user: User; profile: StudentProfile | null | undefined; name: string }) {
  const queryClient = useQueryClient();
  const { data: testimonial } = useMyTestimonial(user.id);
  const [message, setMessage] = useState("");
  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").insert({
        user_id: user.id, name, batch_year: profile?.batch_year ?? null, profession: profile?.current_profession ?? null,
        message: message.trim(), photo: profile?.photo ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("মতামত জমা হয়েছে! অ্যাডমিন অনুমোদনের পর হোম পেজে দেখানো হবে।"); void queryClient.invalidateQueries({ queryKey: ["student", "testimonial", user.id] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const length = message.trim().length;

  return (
    <Card icon={MessageSquareQuote} title="নবারুণ সম্পর্কে আপনার মতামত" hint="অনুমোদনের পর হোম পেজে সবার সামনে দেখানো হবে।">
      {testimonial ? (
        <div className="space-y-3">
          <blockquote className="rounded-lg border-l-4 border-primary bg-muted/40 p-4 text-sm leading-7">“{testimonial.message}”</blockquote>
          <StatusBadge tone={testimonial.is_approved ? "approved" : "pending"} label={testimonial.is_approved ? "হোম পেজে প্রকাশিত" : "অ্যাডমিনের অনুমোদনের অপেক্ষায়"} />
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (length >= 10) submit.mutate(); else toast.error("মতামত কমপক্ষে ১০ অক্ষরের হতে হবে"); }} className="space-y-3">
          <Field label="আপনার মতামত" hint={`${length}/৫০০ (কমপক্ষে ১০ অক্ষর)`}>
            <Textarea rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="নবারুণ আমার জীবনে যে প্রভাব ফেলেছে…" />
          </Field>
          <Button type="submit" disabled={submit.isPending} className="gap-2">{submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} মতামত জমা দিন</Button>
        </form>
      )}
    </Card>
  );
}

export default function ProfileSection({ user }: { user: User }) {
  const { data: profile, isLoading } = useStudentProfile(user.id);
  const save = useSaveProfile(user.id);
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: toProfileForm(profile) });
  const { errors, isDirty } = form.formState;
  const values = form.watch();

  useEffect(() => {
    if (profile) form.reset(toProfileForm(profile));
    // only when the saved profile changes, never while the user is typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.updated_at]);

  const metaName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const displayName = values.full_name || profile?.full_name || metaName || "ছাত্র";
  const photo = safeHttpsUrl(profile?.photo);

  const submit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync(v);
      form.reset(v);
      toast.success("প্রোফাইল সংরক্ষিত হয়েছে");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "সংরক্ষণ করা যায়নি");
    }
  });

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <PhotoCard user={user} profile={profile} name={displayName} />

        {/* forms cannot be nested: the testimonial card below has a form of its own, so this one closes first
            and the save bar (further down) submits it through the `form` attribute */}
        <form id="profile-form" onSubmit={submit} className="space-y-6" noValidate>
          <Card icon={UserRound} title="ব্যক্তিগত তথ্য">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পূর্ণ নাম" required error={errors.full_name?.message} className="sm:col-span-2"><Input autoComplete="name" {...form.register("full_name")} /></Field>
              <Field label="রোল নম্বর" error={errors.roll?.message}><Input placeholder="যেমন: ১০১" {...form.register("roll")} /></Field>
              <Field label="ব্যাচ (SSC সাল)" error={errors.batch_year?.message}><Input inputMode="numeric" maxLength={4} placeholder="যেমন: ২০১৭" {...form.register("batch_year")} /></Field>
            </div>
          </Card>

          <Card icon={GraduationCap} title="একাডেমিক তথ্য">
            <div className="space-y-4">
              <Field label="একাডেমিক ফলাফল" error={errors.result?.message}><Textarea rows={2} placeholder="SSC: GPA 5.00, HSC: GPA 5.00…" {...form.register("result")} /></Field>
              <Field label="উচ্চশিক্ষা" error={errors.higher_study?.message}><Input placeholder="যেমন: BSc in CSE, BUET" {...form.register("higher_study")} /></Field>
              <Field label="অর্জনসমূহ" error={errors.achievement?.message}><Textarea rows={3} placeholder="পুরস্কার, সম্মাননা, প্রতিযোগিতা…" {...form.register("achievement")} /></Field>
            </div>
          </Card>

          <Card icon={Briefcase} title="পেশা ও অবস্থান">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="বর্তমান পেশা" error={errors.current_profession?.message}><Input placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার" {...form.register("current_profession")} /></Field>
              <Field label="অবস্থান" error={errors.location?.message}><Input placeholder="যেমন: ঢাকা, বাংলাদেশ" {...form.register("location")} /></Field>
            </div>
          </Card>

          <Card icon={Link2} title="সামাজিক লিংক" hint="https:// দিয়ে শুরু হওয়া পুরো লিংক দিন।">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn" error={errors.linkedin_link?.message}><Input inputMode="url" placeholder="https://linkedin.com/in/…" {...form.register("linkedin_link")} /></Field>
              <Field label="Facebook" error={errors.facebook_link?.message}><Input inputMode="url" placeholder="https://facebook.com/…" {...form.register("facebook_link")} /></Field>
            </div>
          </Card>
        </form>

        <TestimonialCard user={user} profile={profile} name={displayName} />

        <AnimatePresence>
          {isDirty && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="sticky bottom-20 z-20 lg:bottom-4">
              <div className="flex items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-elevated backdrop-blur">
                <p className="flex-1 text-sm text-muted-foreground">অসংরক্ষিত পরিবর্তন আছে</p>
                <Button type="button" variant="ghost" onClick={() => form.reset(toProfileForm(profile))} disabled={save.isPending}>বাতিল</Button>
                <Button type="submit" form="profile-form" disabled={save.isPending} className="gap-2">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সংরক্ষণ করুন</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside aria-label="ডিরেক্টরি প্রিভিউ" className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-sm font-medium text-muted-foreground">ডিরেক্টরিতে আপনার প্রোফাইল এভাবে দেখাবে</p>
        <div className="rounded-xl border bg-card p-5 text-center shadow-card">
          <Avatar className="mx-auto h-20 w-20 border-4 border-card shadow">
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">{initialsOf(displayName, "S")}</AvatarFallback>
          </Avatar>
          <h3 className="mt-3 break-words font-display text-lg font-semibold">{displayName}</h3>
          {(values.batch_year || values.roll) && <p className="text-sm text-primary">{values.batch_year ? `ব্যাচ ${values.batch_year}` : ""}{values.batch_year && values.roll ? " · " : ""}{values.roll ? `রোল ${values.roll}` : ""}</p>}
          {values.current_profession && <p className="mt-2 flex items-center justify-center gap-1.5 break-words text-sm"><Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {values.current_profession}</p>}
          {values.higher_study && <p className="mt-1 flex items-center justify-center gap-1.5 break-words text-sm"><GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {values.higher_study}</p>}
          {values.location && <p className="mt-1 flex items-center justify-center gap-1.5 break-words text-sm"><MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {values.location}</p>}
          {!values.current_profession && !values.location && !values.higher_study && <p className="mt-2 text-xs text-muted-foreground">পেশা ও অবস্থান যোগ করলে এখানে দেখা যাবে।</p>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">অ্যাডমিন অনুমোদনের পরেই ডিরেক্টরিতে দেখা যায়।</p>
      </aside>
    </div>
  );
}
