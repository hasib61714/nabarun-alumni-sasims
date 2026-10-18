import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareQuote, Quote } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { initialsOf } from "@/lib/format";
import { useLang } from "@/lib/i18n";

interface Testimonial {
  id: string;
  name: string;
  batch_year: number | null;
  profession: string | null;
  message: string;
  photo: string | null;
}

/** Approved testimonials only; the section stays hidden until there are real ones. */
export default function TestimonialsSection() {
  const { t, lang } = useLang();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from("testimonials")
      .select("id, name, batch_year, profession, message, photo")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { if (active && data) setTestimonials(data); });
    return () => { active = false; };
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <MessageSquareQuote className="h-4 w-4" /> {t("প্রাক্তন ছাত্রদের মতামত", "Alumni voices")}
          </span>
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">{t("তারা কী বলেন", "What they say")}</h2>
          <p className="text-muted-foreground">{t("নবারুণ পরিবারের সদস্যদের অভিজ্ঞতা ও অনুভূতি।", "Experiences and feelings from members of the Nabarun family.")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-lift relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card"
            >
              <Quote className="mb-3 h-8 w-8 text-primary/30" aria-hidden />
              <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">{t.message}</blockquote>
              <figcaption className="flex items-center gap-3 border-t pt-4">
                <Avatar className="h-10 w-10">
                  {t.photo ? <AvatarImage src={t.photo} alt="" /> : null}
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{initialsOf(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[t.profession, t.batch_year ? `${lang === "en" ? "Batch" : "ব্যাচ"} ${t.batch_year}` : null].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
