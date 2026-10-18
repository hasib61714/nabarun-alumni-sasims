import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Award, ArrowRight, BarChart3, Bell, BookOpen, Calendar, CheckCircle2, GraduationCap, MapPin, Search, Shield, Sparkles,
  Trophy, UserCheck, UserPlus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import nabarunLogo from "@/assets/nabarun-logo.png";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import MemoriesSection from "@/components/home/MemoriesSection";
import SectionHeading from "@/components/site/SectionHeading";
import CountUp from "@/components/site/CountUp";
import { useInstitutions, useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLang } from "@/lib/i18n";
import { initialsOf } from "@/lib/format";
import { safeHref } from "@/lib/siteSettings";

const featureIcons = [Users, BookOpen, Award, BarChart3, Search, Shield];
const stepIcons = [UserPlus, UserCheck, Sparkles];

interface TopAlumni {
  full_name: string | null;
  current_profession: string | null;
  batch_year: number | null;
  photo: string | null;
  achievement: string | null;
}
interface Notice { id: string; title: string; created_at: string }
interface UpcomingEvent { id: string; title: string; event_date: string; location: string | null }

export default function Index() {
  const { settings } = useSiteSettings();
  const institutions = useInstitutions();
  const { t, lang, locale } = useLang();
  const { home } = settings;
  usePageMeta();

  const [stats, setStats] = useState({ total: 0, batches: 0, professions: 0 });
  const [topAlumni, setTopAlumni] = useState<TopAlumni[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [profilesRes, noticesRes, eventsRes] = await Promise.all([
        supabase.from("student_profiles").select("batch_year, current_profession, full_name, photo, achievement").eq("is_approved", true),
        supabase.from("notices").select("id, title, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id, title, event_date, location").eq("is_published", true)
          .gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(3),
      ]);
      if (!active) return;
      const profiles = profilesRes.data;
      if (profiles) {
        const batches = new Set(profiles.map((p) => p.batch_year).filter(Boolean));
        const professions = new Set(profiles.map((p) => p.current_profession?.trim().toLowerCase()).filter(Boolean));
        setStats({ total: profiles.length, batches: batches.size, professions: professions.size });
        setTopAlumni(profiles.filter((p) => p.achievement && p.achievement.length > 5).slice(0, 6) as TopAlumni[]);
      }
      setNotices((noticesRes.data as Notice[]) || []);
      setEvents((eventsRes.data as UpcomingEvent[]) || []);
    };
    void load();
    return () => { active = false; };
  }, []);

  const displayStats = [
    { value: stats.total, label: t("প্রাক্তন ছাত্র", "Alumni"), plus: true },
    { value: stats.batches, label: t("ব্যাচ", "Batches"), plus: true },
    { value: stats.professions, label: t("পেশা", "Professions"), plus: true },
    { value: institutions.length, label: t("প্রতিষ্ঠান", "Institutions"), plus: false },
  ];

  const primaryHref = safeHref(home.primaryCtaLink) || "/register";
  const secondaryHref = safeHref(home.secondaryCtaLink) || "/alumni";
  const motto = home.heroMotto.trim();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="orb animate-float -left-24 top-10 h-80 w-80 bg-cyan-300/30" aria-hidden />
        <div className="orb animate-float-slow right-0 top-1/3 h-96 w-96 bg-teal-300/25" aria-hidden />
        <div className="orb animate-float -bottom-32 left-1/3 h-72 w-72 bg-red-400/15" aria-hidden />

        <div className="container relative grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {home.heroBadge && (
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-200" /> {home.heroBadge}
              </span>
            )}
            <h1 className="font-display text-4xl font-bold leading-[1.15] text-white md:text-6xl">
              <span className="text-gradient-light">{home.heroTitle}</span>
            </h1>
            {motto && <p className="mt-5 font-display text-xl font-semibold tracking-wide text-white/90 md:text-2xl">&ldquo;{motto}&rdquo;</p>}
            <p className="mt-5 max-w-2xl text-lg text-white/75 md:text-xl">{home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-full bg-white px-7 font-semibold text-teal-900 shadow-lg shadow-black/20 hover:bg-white/90">
                <Link to={primaryHref}>{home.primaryCtaLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              {home.secondaryCtaLabel && (
                <Button size="lg" variant="outline" asChild className="rounded-full border-white/30 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/15 hover:text-white">
                  <Link to={secondaryHref}>{home.secondaryCtaLabel}</Link>
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-white/10 blur-2xl" aria-hidden />
            <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-5">
                <div className="inline-block rounded-2xl bg-white p-3 shadow-md"><img src={nabarunLogo} alt="" className="h-12 w-auto" /></div>
                <p className="mt-3 text-sm font-medium text-white/80">{lang === "en" ? `${institutions.length} institutions · one family` : `${institutions.length}টি প্রতিষ্ঠান · এক পরিবার`}</p>
              </div>
              <ul className="space-y-3">
                {institutions.map((inst) => (
                  <li key={inst.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-md">
                    <img src={inst.logo} alt="" className="h-11 w-11 shrink-0 object-contain" />
                    <span className="text-sm font-semibold leading-snug text-slate-800">{inst.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-2 text-xs text-white/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {t("প্রতিটি প্রোফাইল অ্যাডমিন যাচাইকৃত", "Every profile is admin-verified")}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-10">
        <div className="container">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-elevated md:grid-cols-4">
            {displayStats.map((s) => (
              <div key={s.label} className="bg-card px-4 py-6 text-center">
                <div className="font-display text-3xl font-bold text-primary md:text-4xl">
                  {s.value > 0 ? <CountUp value={s.value} suffix={s.plus ? "+" : ""} /> : "—"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices ticker */}
      {home.showNotices && notices.length > 0 && (
        <section className="mt-10 border-y bg-accent/5">
          <div className="container flex items-center gap-3 py-3">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Bell className="h-3 w-3" /> {t("নোটিশ", "Notice")}
            </span>
            <div className="flex-1 overflow-hidden" aria-live="off">
              <div className="animate-marquee flex w-max gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
                {[...notices, ...notices].map((n, i) => (
                  <Link key={`${n.id}-${i}`} to="/notices" className="text-sm font-medium transition-colors hover:text-primary" tabIndex={i >= notices.length ? -1 : 0} aria-hidden={i >= notices.length}>
                    📌 {n.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Institutions */}
      {institutions.length > 0 && (
        <section className="py-20">
          <div className="container">
            <SectionHeading badge={t("আমাদের প্রতিষ্ঠানসমূহ", "Our institutions")} icon={GraduationCap} title={home.institutionsTitle} subtitle={home.institutionsSubtitle} />
            <div className={`grid gap-6 ${institutions.length >= 3 ? "md:grid-cols-3" : institutions.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-md"}`}>
              {institutions.map((inst, i) => (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card-lift group flex h-full flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-card"
                >
                  <div className="mb-5 flex h-28 w-full max-w-[220px] items-center justify-center rounded-xl border bg-white p-3 transition-transform duration-300 group-hover:scale-[1.03]">
                    <img src={inst.logo} alt={t(`${inst.nameBn} এর লোগো`, `${inst.name} logo`)} className="max-h-full w-auto object-contain" loading="lazy" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{inst.title}</h3>
                  <p className="text-xs text-muted-foreground">{inst.subtitle}</p>
                  {inst.established && <span className="mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">{t("স্থাপিত", "Est.")} {inst.established}</span>}
                  {inst.desc && <p className="mt-3 text-sm text-muted-foreground">{inst.desc}</p>}
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="outline" asChild className="rounded-full"><Link to="/about#institutions">{t("যোগাযোগসহ বিস্তারিত", "Details and contact")} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="relative overflow-hidden bg-muted/40 py-20">
        <div className="orb -left-24 top-1/2 h-72 w-72 bg-primary/10" aria-hidden />
        <div className="container relative">
          <SectionHeading title={home.featuresTitle} subtitle={home.featuresSubtitle} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {home.features.filter((f) => f.title.trim()).map((f, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card-lift rounded-2xl border bg-card p-6 shadow-card"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <SectionHeading badge={t("কীভাবে যুক্ত হবেন", "How to join")} icon={UserCheck} title={t("তিন ধাপে নবারুণ পরিবারে", "Join the Nabarun family in three steps")} subtitle={t("ভুয়া অ্যাকাউন্ট ঠেকাতে প্রতিটি আবেদন অ্যাডমিন নিজে যাচাই করেন।", "An admin personally verifies every application to keep fake accounts out.")} />
          <ol className="relative grid gap-6 md:grid-cols-3">
            <div className="hairline absolute left-[16%] right-[16%] top-8 hidden md:block" aria-hidden />
            {home.steps.filter((st) => st.title.trim()).map((s, i) => {
              const StepIcon = stepIcons[i % stepIcons.length];
              return (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <StepIcon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold text-primary ring-2 ring-primary">{i + 1}</span>
                </div>
                <h3 className="mb-1 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground">{s.desc}</p>
              </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Upcoming events */}
      {home.showEvents && events.length > 0 && (
        <section className="bg-muted/40 py-20">
          <div className="container">
            <SectionHeading badge={t("আসন্ন ইভেন্ট", "Upcoming events")} icon={Calendar} title={t("আসন্ন অনুষ্ঠান", "Upcoming programmes")} />
            <div className="grid gap-6 md:grid-cols-3">
              {events.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="card-lift flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Calendar className="h-6 w-6" /></div>
                  <div>
                    <h3 className="mb-1 font-display font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(e.event_date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</p>
                    {e.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {e.location}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="outline" asChild className="rounded-full"><Link to="/events">{t("সকল ইভেন্ট দেখুন", "See all events")} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      )}

      {/* Top alumni */}
      {home.showTopAlumni && topAlumni.length > 0 && (
        <section className="py-20">
          <div className="container">
            <SectionHeading badge={t("আমাদের গর্ব", "Our pride")} icon={Trophy} title={t("বিশিষ্ট প্রাক্তন ছাত্র", "Distinguished alumni")} subtitle={t("বিশেষ অর্জনকারী প্রাক্তন ছাত্রদের প্রোফাইল।", "Profiles of alumni with notable achievements.")} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topAlumni.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="card-lift rounded-2xl border bg-card p-6 text-center shadow-card">
                  <Avatar className="mx-auto mb-4 h-20 w-20 ring-4 ring-primary/10">
                    {a.photo ? <AvatarImage src={a.photo} alt={a.full_name ?? ""} /> : null}
                    <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initialsOf(a.full_name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-display text-lg font-semibold">{a.full_name || "—"}</h3>
                  {a.current_profession && <p className="text-sm font-medium text-primary">{a.current_profession}</p>}
                  {a.batch_year && <p className="text-xs text-muted-foreground">{t("ব্যাচ", "Batch")} {a.batch_year}</p>}
                  {a.achievement && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">🏆 {a.achievement}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {home.showMemories && <MemoriesSection />}
      {home.showTestimonials && <TestimonialsSection />}

      {/* Banner */}
      {home.bannerText && (
        <section className="relative overflow-hidden bg-hero-gradient py-20">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="container relative text-center">
            <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl">
              <h2 className="font-display text-3xl font-bold tracking-wide text-white md:text-5xl">&ldquo;<span className="text-gradient-light">{home.bannerText}</span>&rdquo;</h2>
              <div className="mx-auto mb-4 mt-6 h-1 w-28 rounded-full bg-white/30" />
              {home.bannerSubtext && <p className="text-lg text-white/70">{home.bannerSubtext}</p>}
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-14 text-center shadow-elevated md:px-12">
            <div className="orb -right-10 -top-16 h-56 w-56 bg-cyan-300/30" aria-hidden />
            <div className="orb -bottom-20 -left-10 h-56 w-56 bg-teal-300/25" aria-hidden />
            <div className="relative">
              <h2 className="mb-3 font-display text-3xl font-bold text-white md:text-4xl">{home.ctaTitle}</h2>
              <p className="mx-auto mb-8 max-w-lg text-white/80">{home.ctaText}</p>
              <Button size="lg" asChild className="rounded-full bg-white px-8 font-semibold text-teal-900 shadow-lg shadow-black/20 hover:bg-white/90">
                <Link to="/register">{home.ctaButton} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
