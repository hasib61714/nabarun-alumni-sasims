import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Award, Search, ArrowRight, BookOpen, BarChart3, Shield, Bell, GraduationCap, MapPin, Heart, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import nabarunLogo from "@/assets/nabarun-logo.png";
import TestimonialsSection from "@/components/home/TestimonialsSection";

const features = [
  { icon: Users, title: "প্রাক্তন ছাত্র নেটওয়ার্ক", desc: "সকল ব্যাচের গ্র্যাজুয়েটদের সাথে সংযুক্ত থাকুন।" },
  { icon: BookOpen, title: "একাডেমিক রেকর্ড", desc: "SSC, HSC এবং চূড়ান্ত পরীক্ষার ফলাফল ডিজিটালি সংরক্ষণ করুন।" },
  { icon: Award, title: "সাফল্য ও অর্জন", desc: "পুরস্কার, সম্মাননা এবং পেশাদার মাইলফলক প্রদর্শন করুন।" },
  { icon: BarChart3, title: "ব্যাচ পরিসংখ্যান", desc: "বছর ও পেশা অনুযায়ী প্রাক্তন ছাত্রদের ভিজ্যুয়াল ইনসাইট।" },
  { icon: Search, title: "স্মার্ট অনুসন্ধান", desc: "নাম, রোল, ব্যাচ বা পেশা দিয়ে প্রাক্তন ছাত্র খুঁজুন।" },
  { icon: Shield, title: "নিরাপদ ও গোপনীয়", desc: "রোল-ভিত্তিক অ্যাক্সেস ও অ্যাডমিন অনুমোদন ব্যবস্থা।" },
];

const institutions = [
  { name: "নবারুণ পাবলিক স্কুল (NPS)", desc: "পুরুষ শিক্ষার্থীদের জন্য মানসম্মত শিক্ষা প্রতিষ্ঠান।", icon: GraduationCap },
  { name: "বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুল", desc: "নারী শিক্ষায় অগ্রণী ভূমিকা পালনকারী প্রতিষ্ঠান।", icon: GraduationCap },
  { name: "নবারুণ কোচিং সেন্টার", desc: "পরীক্ষার প্রস্তুতি ও বিশেষ কোচিং সেবা।", icon: BookOpen },
];

interface TopAlumni {
  full_name: string | null;
  current_profession: string | null;
  batch_year: number | null;
  photo: string | null;
  achievement: string | null;
}

interface Notice {
  id: string;
  title: string;
  created_at: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

export default function Index() {
  const [stats, setStats] = useState({ total: 0, batches: 0, professions: 0 });
  const [topAlumni, setTopAlumni] = useState<TopAlumni[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("batch_year, current_profession, full_name, photo, achievement")
        .eq("is_approved", true);

      if (profiles) {
        const batchSet = new Set(profiles.map((p) => p.batch_year).filter(Boolean));
        const profSet = new Set(profiles.map((p) => p.current_profession).filter(Boolean));
        setStats({ total: profiles.length, batches: batchSet.size, professions: profSet.size });

        const withAchievements = profiles.filter((p) => p.achievement && p.achievement.length > 5);
        setTopAlumni(withAchievements.slice(0, 6) as TopAlumni[]);
      }

      const { data: noticeData } = await supabase
        .from("notices")
        .select("id, title, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotices((noticeData as Notice[]) || []);

      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(3);
      setEvents((eventData as UpcomingEvent[]) || []);
    };
    load();
  }, []);

  const displayStats = [
    { value: stats.total > 0 ? `${stats.total}+` : "—", label: "প্রাক্তন ছাত্র" },
    { value: stats.batches > 0 ? `${stats.batches}+` : "—", label: "ব্যাচ" },
    { value: stats.professions > 0 ? `${stats.professions}+` : "—", label: "পেশা" },
    { value: "৯৮%", label: "সক্রিয় প্রোফাইল" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container relative py-24 md:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <img src={nabarunLogo} alt="Nabarun" className="h-16 w-auto drop-shadow-lg" />
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/90">
                নবারুণ এডুকেশন ফ্যামিলি
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-4">
              ছাত্রদের সংযোগ, <br />ঐতিহ্যের সংরক্ষণ
            </h1>
            <div className="relative inline-block mb-6">
              <span className="absolute -left-6 -top-4 text-6xl md:text-8xl font-serif text-primary-foreground/20 select-none leading-none">&ldquo;</span>
              <p className="font-display text-2xl md:text-3xl font-bold text-primary-foreground tracking-wide px-8">
                We are <span className="text-accent">Nabarun</span>, We are <span className="text-accent">Champion.</span>
              </p>
              <span className="absolute -right-4 -bottom-6 text-6xl md:text-8xl font-serif text-primary-foreground/20 select-none leading-none">&rdquo;</span>
              <div className="mt-3 mx-auto w-24 h-0.5 bg-primary-foreground/40 rounded-full" />
            </div>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              নবারুণ পাবলিক স্কুল ও বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুলের ছাত্র-ছাত্রীদের তথ্য ব্যবস্থাপনা ও প্রাক্তন ছাত্র নেটওয়ার্ক প্ল্যাটফর্ম।
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild className="font-semibold">
                <Link to="/register">রেজিস্টার করুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/alumni">প্রাক্তন ছাত্র দেখুন</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices marquee */}
      {notices.length > 0 && (
        <section className="bg-accent/10 border-b">
          <div className="container py-3 flex items-center gap-3">
            <Badge variant="destructive" className="shrink-0 flex items-center gap-1">
              <Bell className="h-3 w-3" /> নোটিশ
            </Badge>
            <div className="overflow-hidden flex-1">
              <div className="flex gap-8 animate-marquee whitespace-nowrap">
                {notices.map((n) => (
                  <Link key={n.id} to="/notices" className="text-sm font-medium hover:text-primary transition-colors">
                    📌 {n.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Institutions */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
              <GraduationCap className="h-4 w-4" /> আমাদের প্রতিষ্ঠানসমূহ
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">নবারুণ এডুকেশন ফ্যামিলি</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">তিনটি প্রতিষ্ঠানের সমন্বয়ে গড়ে ওঠা একটি শিক্ষা পরিবার।</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {institutions.map((inst, i) => (
              <motion.div key={inst.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full shadow-card hover:shadow-elevated transition-shadow text-center">
                  <CardContent className="pt-8 pb-6">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <inst.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{inst.name}</h3>
                    <p className="text-sm text-muted-foreground">{inst.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">সবকিছু এক জায়গায়</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">আধুনিক টুলস দিয়ে ছাত্র ও প্রাক্তন ছাত্রদের তথ্য ব্যবস্থাপনার সম্পূর্ণ সিস্টেম।</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" /> আসন্ন ইভেন্ট
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">আসন্ন অনুষ্ঠান</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card className="shadow-card hover:shadow-elevated transition-shadow">
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold mb-1">{e.title}</h3>
                          <p className="text-sm text-muted-foreground">{new Date(e.event_date).toLocaleDateString("bn-BD")}</p>
                          {e.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/events">সকল ইভেন্ট দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Top Alumni */}
      {topAlumni.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
                <Trophy className="h-4 w-4" /> আমাদের গর্ব
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">বিশিষ্ট প্রাক্তন ছাত্র</h2>
              <p className="text-muted-foreground">বিশেষ অর্জনকারী প্রাক্তন ছাত্রদের প্রোফাইল।</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topAlumni.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="shadow-card hover:shadow-elevated transition-shadow text-center">
                    <CardContent className="pt-6 pb-5">
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        {a.photo ? <AvatarImage src={a.photo} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {(a.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-display font-semibold text-lg">{a.full_name || "—"}</h3>
                      {a.current_profession && <p className="text-sm text-primary font-medium">{a.current_profession}</p>}
                      {a.batch_year && <p className="text-xs text-muted-foreground">ব্যাচ {a.batch_year}</p>}
                      {a.achievement && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">🏆 {a.achievement}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Tagline Banner */}
      <section className="py-20 bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container text-center relative">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="max-w-3xl mx-auto">
              <span className="text-8xl md:text-9xl font-serif text-primary-foreground/15 select-none leading-none block">&ldquo;</span>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground -mt-10 md:-mt-14 tracking-wide">
                We are <span className="underline decoration-4 decoration-accent underline-offset-8">Nabarun</span>,
                <br className="hidden sm:block" /> We are <span className="underline decoration-4 decoration-accent underline-offset-8">Champion</span>.
              </h2>
              <span className="text-8xl md:text-9xl font-serif text-primary-foreground/15 select-none leading-none block -mt-4">&rdquo;</span>
              <div className="mx-auto w-32 h-1 bg-primary-foreground/30 rounded-full mt-2 mb-4" />
              <p className="text-primary-foreground/70 text-lg">একতা, শৃঙ্খলা ও শ্রেষ্ঠত্ব — আমাদের পরিচয়।</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">আজই যোগ দিন!</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">রেজিস্টার করুন এবং নবারুণ পরিবারের প্রাক্তন ছাত্র নেটওয়ার্কে সংযুক্ত হন।</p>
          <Button size="lg" variant="secondary" asChild className="font-semibold">
            <Link to="/register">অ্যাকাউন্ট তৈরি করুন <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
