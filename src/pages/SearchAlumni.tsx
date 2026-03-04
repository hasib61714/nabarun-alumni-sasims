import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Linkedin, Facebook } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

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
      <section className="bg-hero-gradient py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/90 mb-4">
              <Search className="h-4 w-4" />
              অনুসন্ধান
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">প্রাক্তন ছাত্র খুঁজুন</h1>
            <p className="text-primary-foreground/80 text-lg">নাম, রোল, পেশা বা ব্যাচ দিয়ে অনুসন্ধান করুন।</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="নাম, রোল বা পেশা দিয়ে খুঁজুন..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="ব্যাচ বছর" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ব্যাচ</SelectItem>
                {batches.map((b) => <SelectItem key={b} value={b!.toString()}>ব্যাচ {b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="পেশা" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল পেশা</SelectItem>
                {professions.map((p) => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">লোড হচ্ছে...</div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} টি ফলাফল পাওয়া গেছে</p>
              <div className="space-y-3">
                {filtered.map((a, i) => (
                  <motion.div key={`${a.roll}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <Card className="shadow-card hover:shadow-elevated transition-shadow">
                      <CardContent className="flex items-center gap-4 p-5">
                        <Avatar className="h-12 w-12">
                          {a.photo ? <AvatarImage src={a.photo} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(a.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{a.full_name || "নাম নেই"}</h3>
                          <p className="text-sm text-muted-foreground">রোল: {a.roll || "—"} · ব্যাচ: {a.batch_year || "—"}</p>
                          {a.higher_study && <p className="text-xs text-muted-foreground">🎓 {a.higher_study}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-medium text-primary hidden sm:block">{a.current_profession || "—"}</span>
                          {a.linkedin_link && (
                            <a href={a.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="h-4 w-4" /></a>
                          )}
                          {a.facebook_link && (
                            <a href={a.facebook_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook className="h-4 w-4" /></a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>আপনার অনুসন্ধানে কোনো প্রাক্তন ছাত্র পাওয়া যায়নি।</p>
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
