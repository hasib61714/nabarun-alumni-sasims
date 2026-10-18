import { safeHttpsUrl } from "@/lib/memories";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import PageHero from "@/components/site/PageHero";
import { motion } from "framer-motion";
import { Search, Users, Linkedin, Facebook } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

interface AlumniProfile {
  full_name: string | null;
  batch_year: number | null;
  current_profession: string | null;
  roll: string | null;
  photo: string | null;
  linkedin_link: string | null;
  facebook_link: string | null;
  higher_study: string | null;
}

export default function SearchAlumni() {
  const { t } = useLang();
  usePageMeta(t("অনুসন্ধান", "Search"), t("নাম, রোল, পেশা বা ব্যাচ দিয়ে প্রাক্তন ছাত্র খুঁজুন।", "Find alumni by name, roll, profession or batch."));
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("full_name, batch_year, current_profession, roll, photo, linkedin_link, facebook_link, higher_study")
        .eq("is_approved", true)
        .order("batch_year", { ascending: false });
      setAlumni((data as AlumniProfile[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const batches = [...new Set(alumni.map((a) => a.batch_year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const professions = [...new Set(alumni.map((a) => a.current_profession).filter(Boolean))].sort();

  const filtered = alumni.filter((a) => {
    const q = query.toLowerCase();
    const matchesQuery = !query || (a.full_name || "").toLowerCase().includes(q) || (a.roll || "").includes(q) || (a.current_profession || "").toLowerCase().includes(q);
    const matchesBatch = batchFilter === "all" || a.batch_year?.toString() === batchFilter;
    const matchesProfession = professionFilter === "all" || a.current_profession === professionFilter;
    return matchesQuery && matchesBatch && matchesProfession;
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div>
      <PageHero badge={t("অনুসন্ধান", "Search")} title={t("প্রাক্তন ছাত্র খুঁজুন", "Find Alumni")} subtitle={t("নাম, রোল, পেশা বা ব্যাচ দিয়ে অনুসন্ধান করুন।", "Search by name, roll, profession or batch.")} />

      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("নাম, রোল বা পেশা দিয়ে খুঁজুন...", "Search by name, roll or profession...")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("ব্যাচ বছর", "Batch year")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("সকল ব্যাচ", "All batches")}</SelectItem>
                {batches.map((b) => <SelectItem key={b} value={b!.toString()}>{t(`ব্যাচ ${b}`, `Batch ${b}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t("পেশা", "Profession")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("সকল পেশা", "All professions")}</SelectItem>
                {professions.map((p) => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">{t("লোড হচ্ছে...", "Loading...")}</div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{t(`${filtered.length} টি ফলাফল পাওয়া গেছে`, filtered.length === 1 ? "1 result found" : `${filtered.length} results found`)}</p>
              <div className="space-y-3">
                {filtered.map((a, i) => (
                  <motion.div key={`${a.roll}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <Card className="shadow-card hover:shadow-elevated transition-shadow">
                      <CardContent className="flex items-center gap-4 p-5">
                        <Avatar className="h-12 w-12">
                          {safeHttpsUrl(a.photo) ? <AvatarImage src={safeHttpsUrl(a.photo) ?? undefined} alt={a.full_name ?? ""} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(a.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{a.full_name || t("নাম নেই", "No name")}</h3>
                          <p className="text-sm text-muted-foreground">{t("রোল", "Roll")}: {a.roll || "—"} · {t("ব্যাচ", "Batch")}: {a.batch_year || "—"}</p>
                          {a.higher_study && <p className="text-xs text-muted-foreground">🎓 {a.higher_study}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-medium text-primary hidden sm:block">{a.current_profession || "—"}</span>
                          {safeHttpsUrl(a.linkedin_link) && (
                            <a href={safeHttpsUrl(a.linkedin_link) ?? undefined} aria-label={`${a.full_name ?? t("প্রাক্তন ছাত্র", "Alumnus")} — LinkedIn`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="h-4 w-4" /></a>
                          )}
                          {safeHttpsUrl(a.facebook_link) && (
                            <a href={safeHttpsUrl(a.facebook_link) ?? undefined} aria-label={`${a.full_name ?? t("প্রাক্তন ছাত্র", "Alumnus")} — Facebook`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook className="h-4 w-4" /></a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>{t("আপনার অনুসন্ধানে কোনো প্রাক্তন ছাত্র পাওয়া যায়নি।", "No alumni matched your search.")}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
