import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookHeart, CheckCircle2, DatabaseBackup, GraduationCap, HandCoins, Loader2, Mail, MessageSquareQuote, PartyPopper, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { attempt, useAdminCounts, useAdminRows, useRowMutations } from "@/hooks/useAdminData";
import { downloadBackup } from "@/lib/backup";
import { formatNumber, formatTaka, initialsOf, timeAgo } from "@/lib/format";
import { safeHttpsUrl, toMemory } from "@/lib/memories";
import { SectionHeader } from "../AdminCommon";
import type { SectionId } from "../adminSections";

export default function OverviewSection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const { data: counts } = useAdminCounts();
  const { data: students = [] } = useAdminRows("student_profiles", "created_at");
  const { data: memoryRows = [] } = useAdminRows("memories", "created_at");
  const { data: donations = [] } = useAdminRows("donations", "created_at");
  const { update } = useRowMutations("student_profiles", "user_id");
  const [backingUp, setBackingUp] = useState(false);

  const memories = memoryRows.map((r) => toMemory(r as unknown as Record<string, unknown>));
  const raised = donations.filter((d) => d.status === "approved").reduce((t, d) => t + Number(d.amount), 0);
  const pendingStudents = students.filter((s) => !s.is_approved);
  const pendingMemories = memories.filter((m) => m.status === "pending");

  const stats = [
    { icon: Users, label: "মোট ছাত্র", value: formatNumber(students.length), tone: "bg-primary/10 text-primary", to: "students" as SectionId },
    { icon: CheckCircle2, label: "অনুমোদিত ছাত্র", value: formatNumber(students.length - pendingStudents.length), tone: "bg-emerald-500/15 text-emerald-600", to: "students" as SectionId },
    { icon: BookHeart, label: "প্রকাশিত স্মৃতি", value: formatNumber(memories.filter((m) => m.status === "approved").length), tone: "bg-rose-500/15 text-rose-600", to: "memories" as SectionId },
    { icon: HandCoins, label: "মোট অনুদান", value: formatTaka(raised), tone: "bg-amber-500/15 text-amber-600", to: "donations" as SectionId },
  ];

  const tasks = [
    { icon: GraduationCap, label: "অনুমোদনের অপেক্ষায় ছাত্র", count: counts?.pendingStudents, to: "students" as SectionId },
    { icon: BookHeart, label: "পর্যালোচনার অপেক্ষায় স্মৃতি", count: counts?.pendingMemories, to: "memories" as SectionId },
    { icon: MessageSquareQuote, label: "অনুমোদনের অপেক্ষায় মতামত", count: counts?.pendingTestimonials, to: "testimonials" as SectionId },
    { icon: HandCoins, label: "অনুমোদনের অপেক্ষায় অনুদান", count: counts?.pendingDonations, to: "donations" as SectionId },
    { icon: Mail, label: "অপঠিত বার্তা", count: counts?.unreadMessages, to: "messages" as SectionId },
  ];
  const openTasks = tasks.filter((t) => t.count);

  const backup = async () => {
    setBackingUp(true);
    try {
      const result = await downloadBackup();
      toast.success(`ব্যাকআপ ডাউনলোড হয়েছে (${Object.values(result).reduce((a, b) => a + b, 0)}টি রেকর্ড)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ব্যাকআপ নেওয়া যায়নি");
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="স্বাগতম, অ্যাডমিন 👋" description="আজ কী কী করার আছে, এক নজরে।" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.button
            key={s.label} type="button" onClick={() => onNavigate(s.to)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block truncate font-display text-xl font-bold sm:text-2xl">{s.value}</span><span className="block text-xs text-muted-foreground">{s.label}</span></span>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 font-display text-lg font-semibold">অপেক্ষমান কাজ</h3>
          {openTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground"><PartyPopper className="h-9 w-9 text-primary" /><p>সব কাজ শেষ! কোনো কিছু অপেক্ষায় নেই।</p></div>
          ) : (
            <ul className="divide-y">
              {openTasks.map((t) => (
                <li key={t.label}>
                  <button type="button" onClick={() => onNavigate(t.to)} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline">
                    <t.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="flex-1 text-sm">{t.label}</span>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{t.count}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">নতুন ছাত্র — দ্রুত অনুমোদন</h3>{pendingStudents.length > 5 && <Button variant="link" size="sm" onClick={() => onNavigate("students")}>সব দেখুন</Button>}</div>
          {pendingStudents.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">অনুমোদনের অপেক্ষায় কোনো ছাত্র নেই।</p> : (
            <ul className="divide-y">
              {pendingStudents.slice(0, 5).map((s) => (
                <li key={s.user_id} className="flex items-center gap-3 py-2.5">
                  <Avatar className="h-9 w-9">{safeHttpsUrl(s.photo) && <AvatarImage src={s.photo!} alt="" />}<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initialsOf(s.full_name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.full_name || "নামহীন"}</p><p className="truncate text-xs text-muted-foreground">{s.batch_year ? `ব্যাচ ${s.batch_year} · ` : ""}{timeAgo(s.created_at)}</p></div>
                  <Button size="sm" className="gap-1.5" disabled={update.isPending} onClick={() => attempt(update.mutateAsync({ id: s.user_id, values: { is_approved: true } }), "ছাত্র অনুমোদিত হয়েছে")}><CheckCircle2 className="h-4 w-4" /> অনুমোদন</Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {pendingMemories.length > 0 && (
          <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">নতুন জমা পড়া স্মৃতি</h3><Button variant="link" size="sm" onClick={() => onNavigate("memories")}>পর্যালোচনা করুন <ArrowRight className="ml-1 h-4 w-4" /></Button></div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pendingMemories.slice(0, 3).map((m) => (
                <li key={m.id} className="rounded-lg border bg-muted/30 p-3"><p className="line-clamp-1 text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.author_name} · {timeAgo(m.created_at)}</p></li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><DatabaseBackup className="h-6 w-6" /></span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">সব তথ্যের ব্যাকআপ</h3>
          <p className="text-sm text-muted-foreground">ছাত্র, স্মৃতি, মতামত, নোটিশ, ইভেন্ট, গ্যালারি, অনুদান ও বার্তার সম্পূর্ণ কপি একটি ফাইলে (JSON) নামিয়ে নিন। নিয়মিত — যেমন মাসে একবার — ব্যাকআপ রাখা ভালো। ছবি/ভিডিও সংরক্ষিত থাকে, ফাইলে তার লিংক থাকে।</p>
        </div>
        <Button onClick={backup} disabled={backingUp} className="gap-2">{backingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />} ব্যাকআপ নামান</Button>
      </section>
    </div>
  );
}
