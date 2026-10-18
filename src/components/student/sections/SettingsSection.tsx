import { Eye, KeyRound, LogOut, Mail, ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PasswordFields } from "@/components/common/PasswordChange";
import { usePasswordChange } from "@/hooks/usePasswordChange";
import { formatDate } from "@/lib/format";

export default function SettingsSection({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { form, submit, saving } = usePasswordChange();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Mail className="h-5 w-5 text-primary" /> অ্যাকাউন্ট</h2>
        <dl className="divide-y text-sm">
          <div className="grid grid-cols-3 gap-3 py-2.5"><dt className="text-muted-foreground">ইমেইল</dt><dd className="col-span-2 break-all">{user.email}</dd></div>
          <div className="grid grid-cols-3 gap-3 py-2.5"><dt className="text-muted-foreground">যোগদান</dt><dd className="col-span-2">{formatDate(user.created_at)}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-5 w-5 text-primary" /> পাসওয়ার্ড পরিবর্তন</h2>
        <p className="mb-4 text-sm text-muted-foreground">নিরাপত্তার জন্য মাঝে মাঝে পাসওয়ার্ড বদলান।</p>
        <form onSubmit={submit} className="space-y-4">
          <PasswordFields form={form} />
          <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} পাসওয়ার্ড পরিবর্তন করুন</Button>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> আপনার তথ্য কে দেখতে পায়?</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> অ্যাডমিন অনুমোদনের পর আপনার নাম, ব্যাচ, পেশা, ফলাফল ও লিংক অ্যালামনাই ডিরেক্টরিতে সবার কাছে দেখা যাবে।</li>
          <li className="flex gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> আপনার ইমেইল ও পাসওয়ার্ড কখনো সবার কাছে দেখানো হয় না।</li>
          <li className="flex gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> আপনার লেখা স্মৃতি অ্যাডমিন অনুমোদনের পরেই সবার সামনে প্রকাশিত হয়।</li>
        </ul>
      </section>

      <Button variant="outline" onClick={onLogout} className="w-full gap-2 sm:w-auto"><LogOut className="h-4 w-4" /> লগআউট</Button>
    </div>
  );
}
