import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Search, Users, Briefcase, MapPin, GraduationCap, Linkedin, Facebook } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AlumniProfile {
  user_id: string;
  full_name: string | null;
  roll: string | null;
  batch_year: number | null;
  current_profession: string | null;
  higher_study: string | null;
  photo: string | null;
  linkedin_link: string | null;
  facebook_link: string | null;
  location: string | null;
}

const CHART_COLORS = [
  "hsl(185, 75%, 40%)", "hsl(0, 85%, 55%)", "hsl(40, 90%, 52%)",
  "hsl(195, 50%, 45%)", "hsl(160, 60%, 40%)", "hsl(280, 50%, 50%)",
  "hsl(30, 80%, 50%)", "hsl(185, 65%, 55%)",
];

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    const { data } = await supabase
      .from("student_profiles")
      .select("user_id, full_name, roll, batch_year, current_profession, higher_study, photo, linkedin_link, facebook_link, location")
      .eq("is_approved", true)
      .order("batch_year", { ascending: false });
    setAlumni((data as AlumniProfile[]) || []);
    setLoading(false);
  };

  const batches = useMemo(() => [...new Set(alumni.map((a) => a.batch_year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)), [alumni]);
  const professions = useMemo(() => [...new Set(alumni.map((a) => a.current_profession).filter(Boolean))] as string[], [alumni]);

  const filtered = alumni.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || (a.full_name || "").toLowerCase().includes(q) || (a.current_profession || "").toLowerCase().includes(q) || (a.location || "").toLowerCase().includes(q);
    const matchesBatch = batchFilter === "all" || a.batch_year?.toString() === batchFilter;
    const matchesProf = professionFilter === "all" || a.current_profession === professionFilter;
    return matchesSearch && matchesBatch && matchesProf;
  });

  // Stats
  const professionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    alumni.forEach((a) => {
      const p = a.current_profession || "অনির্ধারিত";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [alumni]);

  const batchStats = useMemo(() => {
    const counts: Record<string, number> = {};
    alumni.forEach((a) => {
      const b = a.batch_year?.toString() || "অনির্ধারিত";
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [alumni]);

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">🗂️ অ্যালামনাই ডিরেক্টরি</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          নবারুণের অনুমোদিত প্রাক্তন ছাত্রদের পেশা, ব্যাচ ও অবস্থান অনুযায়ী খুঁজুন
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{alumni.length}</p>
              <p className="text-xs text-muted-foreground">মোট অ্যালামনাই</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{professions.length}</p>
              <p className="text-xs text-muted-foreground">বিভিন্ন পেশা</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{batches.length}</p>
              <p className="text-xs text-muted-foreground">ব্যাচ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {alumni.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-display">পেশা অনুযায়ী বিভাজন</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={professionStats} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {professionStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm font-display">ব্যাচ অনুযায়ী বিভাজন</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={batchStats} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {batchStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="নাম, পেশা বা অবস্থান দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="ব্যাচ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ব্যাচ</SelectItem>
            {batches.map((b) => <SelectItem key={b} value={b!.toString()}>ব্যাচ {b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={professionFilter} onValueChange={setProfessionFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="পেশা" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল পেশা</SelectItem>
            {professions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} জন অ্যালামনাই পাওয়া গেছে</p>

      {/* Alumni Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">কোনো অ্যালামনাই পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a, idx) => (
            <motion.div
              key={a.user_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.5) }}
            >
              <Card className="shadow-card hover:shadow-elevated transition-shadow h-full">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-3">
                    {a.photo ? <AvatarImage src={a.photo} /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {(a.full_name || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm">{a.full_name || "—"}</h3>
                  {a.batch_year && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">ব্যাচ {a.batch_year}</Badge>
                  )}
                  {a.current_profession && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {a.current_profession}
                    </p>
                  )}
                  {a.location && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {a.location}
                    </p>
                  )}
                  {a.higher_study && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> {a.higher_study}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {a.linkedin_link && (
                      <a href={a.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {a.facebook_link && (
                      <a href={a.facebook_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
