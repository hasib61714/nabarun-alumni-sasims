import { safeHttpsUrl } from "@/lib/memories";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import PageHero from "@/components/site/PageHero";
import { motion } from "framer-motion";
import { GraduationCap, Users, Linkedin, Facebook, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  achievement: string | null;
}

export default function Alumni() {
  const { t } = useLang();
  usePageMeta(t("প্রাক্তন ছাত্র", "Alumni"), t("ব্যাচ অনুযায়ী অনুমোদিত প্রাক্তন ছাত্রদের প্রোফাইল।", "Profiles of approved alumni, grouped by batch."));
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("full_name, batch_year, current_profession, roll, photo, linkedin_link, facebook_link, higher_study, achievement")
        .eq("is_approved", true)
        .order("batch_year", { ascending: false });
      setAlumni((data as AlumniProfile[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const batches = [...new Set(alumni.map((a) => a.batch_year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div>
      <PageHero badge={t("আমাদের প্রাক্তন ছাত্র", "Our Alumni")} title={t("প্রাক্তন ছাত্র তালিকা", "Alumni List")} subtitle={t("ব্যাচ অনুযায়ী আমাদের অনুমোদিত প্রাক্তন ছাত্রদের প্রোফাইল দেখুন।", "Browse the profiles of our approved alumni, grouped by batch.")} />

      <section className="py-16">
        <div className="container">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse font-display text-xl">{t("লোড হচ্ছে...", "Loading...")}</div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{t("এখনো কোনো অনুমোদিত প্রাক্তন ছাত্র নেই।", "No approved alumni yet.")}</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-bold">{t(`ব্যাচ ${batch}`, `Batch ${batch}`)}</h2>
                  <Badge variant="secondary">{t(`${alumni.filter((a) => a.batch_year === batch).length} সদস্য`, `${alumni.filter((a) => a.batch_year === batch).length} members`)}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alumni
                    .filter((a) => a.batch_year === batch)
                    .map((a, i) => (
                      <motion.div
                        key={`${a.roll}-${i}`}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="shadow-card hover:shadow-elevated transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4 mb-3">
                              <Avatar className="h-14 w-14">
                                {safeHttpsUrl(a.photo) ? <AvatarImage src={safeHttpsUrl(a.photo) ?? undefined} alt={a.full_name ?? ""} /> : null}
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {getInitials(a.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold truncate">{a.full_name || t("নাম নেই", "No name")}</h3>
                                <p className="text-sm text-muted-foreground">{t("রোল", "Roll")}: {a.roll || "—"}</p>
                                {a.current_profession && (
                                  <p className="text-sm text-primary font-medium truncate">{a.current_profession}</p>
                                )}
                              </div>
                            </div>
                            {(a.higher_study || a.achievement) && (
                              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                                {a.higher_study && <p>🎓 {a.higher_study}</p>}
                                {a.achievement && <p>🏆 {a.achievement}</p>}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {safeHttpsUrl(a.linkedin_link) && (
                                <a href={safeHttpsUrl(a.linkedin_link) ?? undefined} aria-label={`${a.full_name ?? t("প্রাক্তন ছাত্র", "Alumnus")} — LinkedIn`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                              {safeHttpsUrl(a.facebook_link) && (
                                <a href={safeHttpsUrl(a.facebook_link) ?? undefined} aria-label={`${a.full_name ?? t("প্রাক্তন ছাত্র", "Alumnus")} — Facebook`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                  <Facebook className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
