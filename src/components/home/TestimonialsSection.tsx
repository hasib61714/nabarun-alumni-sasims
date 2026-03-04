import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareQuote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  batch_year: number | null;
  profession: string | null;
  message: string;
  photo: string | null;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id, name, batch_year, profession, message, photo")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setTestimonials(data);
    };
    load();
  }, []);

  // Show static fallback if no DB testimonials yet
  const displayTestimonials: Testimonial[] = testimonials.length > 0 ? testimonials : [
    {
      id: "1",
      name: "রাহাত হাসান",
      batch_year: 2015,
      profession: "সফটওয়্যার ইঞ্জিনিয়ার",
      message: "নবারুণ আমার জীবনের ভিত্তি গড়ে দিয়েছে। এখানকার শিক্ষা ও মূল্যবোধ আমাকে আজও পথ দেখায়।",
      photo: null,
    },
    {
      id: "2",
      name: "ফাতেমা আক্তার",
      batch_year: 2018,
      profession: "চিকিৎসক",
      message: "নবারুণ পরিবারের অংশ হতে পেরে গর্বিত। এখানের শিক্ষকদের অনুপ্রেরণা আমাকে ডাক্তার হতে সাহায্য করেছে।",
      photo: null,
    },
    {
      id: "3",
      name: "আবদুল করিম",
      batch_year: 2012,
      profession: "ব্যাংকার",
      message: "নবারুণের শৃঙ্খলা ও টিমওয়ার্কের শিক্ষা আমার পেশাগত জীবনে অমূল্য সম্পদ।",
      photo: null,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
            <MessageSquareQuote className="h-4 w-4" /> প্রাক্তন ছাত্রদের মতামত
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">তারা কী বলেন</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            নবারুণ পরিবারের সদস্যদের অভিজ্ঞতা ও অনুভূতি।
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="pt-6 pb-5">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Avatar className="h-10 w-10">
                      {t.photo ? <AvatarImage src={t.photo} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.profession && <span>{t.profession}</span>}
                        {t.profession && t.batch_year && <span> • </span>}
                        {t.batch_year && <span>ব্যাচ {t.batch_year}</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
