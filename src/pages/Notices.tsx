import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import PageHero from "@/components/site/PageHero";
import { motion } from "framer-motion";
import { Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function Notices() {
  usePageMeta("নোটিশ", "সর্বশেষ নোটিশ ও ঘোষণা।");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("notices")
        .select("id, title, content, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setNotices((data as Notice[]) || []);
      setLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel("notices-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <PageHero badge="নোটিশ বোর্ড" title="নোটিশ সমূহ" subtitle="নবারুণ এডুকেশন ফ্যামিলির সর্বশেষ নোটিশ ও ঘোষণা।" />

      <section className="py-16">
        <div className="container max-w-3xl">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse font-display text-xl">লোড হচ্ছে...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">এখন কোনো নোটিশ নেই।</p>
            </div>
          ) : (
            <div className="space-y-6">
              {notices.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="shadow-card">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="font-display text-lg">{n.title}</CardTitle>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(n.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
