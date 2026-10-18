import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bell, BookHeart, CheckCircle2, Circle, Clock, MessageSquareQuote, PenLine, Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useMyMemories } from "@/hooks/useMemories";
import { useMyTestimonial, useNotices, useStudentProfile } from "@/hooks/useStudentData";
import { excerpt, formatDate, initialsOf, timeAgo } from "@/lib/format";
import { safeHttpsUrl, STATUS_LABEL } from "@/lib/memories";
import { computeCompleteness } from "@/lib/profile";
import type { StudentSectionId } from "../studentSections";

interface Props {
  userId: string;
  email: string;
  fallbackName: string;
  onNavigate: (id: StudentSectionId) => void;
}

export default function OverviewSection({ userId, email, fallbackName, onNavigate }: Props) {
  const { data: profile } = useStudentProfile(userId);
  const { data: memories = [] } = useMyMemories(userId);
  const { data: notices = [] } = useNotices(3);
  const { data: testimonial } = useMyTestimonial(userId);

  const name = profile?.full_name || fallbackName;
  const photo = safeHttpsUrl(profile?.photo);
  const approved = !!profile?.is_approved;
  const { percent, missing } = computeCompleteness(profile);
  const published = memories.filter((m) => m.status === "approved").length;
  const pending = memories.filter((m) => m.status === "pending").length;
  const rejected = memories.filter((m) => m.status === "rejected").length;

  const tiles = [
    { icon: UserRound, label: "প্রোফাইল সম্পূর্ণ", value: `${percent}%`, tone: "bg-primary/10 text-primary", to: "profile" as StudentSectionId },
    { icon: BookHeart, label: "প্রকাশিত স্মৃতি", value: String(published), tone: "bg-rose-500/15 text-rose-600", to: "memories" as StudentSectionId },
    { icon: Clock, label: "অনুমোদনের অপেক্ষায়", value: String(pending), tone: "bg-amber-500/15 text-amber-600", to: "memories" as StudentSectionId },
    { icon: MessageSquareQuote, label: "আপনার মতামত", value: testimonial ? (testimonial.is_approved ? "প্রকাশিত" : "অপেক্ষমান") : "দেননি", tone: "bg-emerald-500/15 text-emerald-600", to: "profile" as StudentSectionId },
  ];

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="bg-hero-gradient px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-4 border-white/30 shadow-lg">
              {photo && <AvatarImage src={photo} alt="" />}
              <AvatarFallback className="bg-black/25 text-2xl font-bold text-white">{initialsOf(name, "S")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-white">
              <p className="text-sm text-white/80">স্বাগতম 👋</p>
              <h2 className="truncate font-display text-2xl font-bold sm:text-3xl">{name}</h2>
              <p className="truncate text-sm text-white/80">{email}{profile?.batch_year ? ` · ব্যাচ ${profile.batch_year}` : ""}{profile?.roll ? ` · রোল ${profile.roll}` : ""}</p>
            </div>
            <StatusBadge tone={approved ? "approved" : "pending"} label={approved ? "অনুমোদিত" : "অনুমোদনের অপেক্ষায়"} className="self-start sm:self-center" />
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">প্রোফাইল সম্পূর্ণতা</span>
              <span className="font-display font-bold text-primary">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2.5" aria-label="প্রোফাইল সম্পূর্ণতা" />
            <p className="mt-2 text-sm text-muted-foreground">
              {percent === 100 ? "দারুণ! আপনার প্রোফাইল সম্পূর্ণ।" : "তথ্য যত সম্পূর্ণ, অ্যাডমিন তত দ্রুত অনুমোদন দিতে পারেন এবং সহপাঠীরা তত সহজে আপনাকে খুঁজে পায়।"}
            </p>
          </div>
          <Button onClick={() => onNavigate("profile")} className="gap-2">{percent === 100 ? "প্রোফাইল দেখুন" : "প্রোফাইল সম্পূর্ণ করুন"} <ArrowRight className="h-4 w-4" /></Button>
        </div>
        <div className={`border-t px-5 py-3 text-sm sm:px-6 ${approved ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200" : "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"}`}>
          {approved
            ? <>আপনার প্রোফাইল অনুমোদিত — আপনি এখন <Link to="/directory" className="font-medium underline underline-offset-2">অ্যালামনাই ডিরেক্টরিতে</Link> সবার কাছে দৃশ্যমান।</>
            : "আপনার প্রোফাইল অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে।"}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.button
            key={t.label} type="button" onClick={() => onNavigate(t.to)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.tone}`}><t.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block truncate font-display text-xl font-bold">{t.value}</span><span className="block text-xs text-muted-foreground">{t.label}</span></span>
          </motion.button>
        ))}
      </div>

      {rejected > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <p className="flex-1"><strong>{rejected}টি স্মৃতি</strong> অ্যাডমিন ফেরত পাঠিয়েছেন। মন্তব্য দেখে সম্পাদনা করে আবার জমা দিন।</p>
          <Button size="sm" variant="outline" onClick={() => onNavigate("memories")}>দেখুন</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 font-display text-lg font-semibold">প্রোফাইলে যা বাকি আছে</h3>
          {missing.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> সবকিছু পূরণ করা হয়েছে।</p>
          ) : (
            <ul className="space-y-1">
              {missing.map((m) => (
                <li key={m.key}>
                  <button type="button" onClick={() => onNavigate("profile")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" /> <span className="flex-1">{m.label}</span> <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 font-display text-lg font-semibold">দ্রুত কাজ</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button className="justify-start gap-2" onClick={() => onNavigate("memories")}><PenLine className="h-4 w-4" /> স্মৃতি লিখুন</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("profile")}><UserRound className="h-4 w-4" /> প্রোফাইল সম্পাদনা</Button>
            <Button asChild variant="outline" className="justify-start gap-2"><Link to="/directory"><Search className="h-4 w-4" /> ডিরেক্টরি দেখুন</Link></Button>
            <Button asChild variant="outline" className="justify-start gap-2"><Link to="/memories"><BookHeart className="h-4 w-4" /> স্মৃতির পাতা</Link></Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">সাম্প্রতিক নোটিশ</h3><Button variant="link" size="sm" onClick={() => onNavigate("notices")}>সব দেখুন</Button></div>
          {notices.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো নোটিশ নেই।</p> : (
            <ul className="divide-y">
              {notices.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-2.5">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">আমার সাম্প্রতিক স্মৃতি</h3><Button variant="link" size="sm" onClick={() => onNavigate("memories")}>সব দেখুন</Button></div>
          {memories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground"><p>এখনো কোনো স্মৃতি লেখেননি।</p><Button size="sm" className="mt-3 gap-2" onClick={() => onNavigate("memories")}><PenLine className="h-4 w-4" /> প্রথম স্মৃতি লিখুন</Button></div>
          ) : (
            <ul className="divide-y">
              {memories.slice(0, 3).map((m) => (
                <li key={m.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{m.title}</p><StatusBadge tone={m.status} label={STATUS_LABEL[m.status]} /></div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{excerpt(m.body, 70)} · {timeAgo(m.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
