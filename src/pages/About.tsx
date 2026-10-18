import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Code, Linkedin, Facebook, Github, Globe } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import developerPhoto from "@/assets/developer-photo.png";
import { InstitutionCards } from "@/components/InstitutionsSection";
import PageHero from "@/components/site/PageHero";
import SectionHeading from "@/components/site/SectionHeading";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLang } from "@/lib/i18n";
import { paragraphs } from "@/lib/siteSettings";

const developer = {
  name: "Md. Hasibul Hasan",
  photo: developerPhoto,
  role: "Full-Stack Web Developer",
  bio: "নবারুণ পাবলিক স্কুল (NPS) এর SSC ২০১৭ ব্যাচের গর্বিত প্রাক্তন ছাত্র। বর্তমানে Green University of Bangladesh থেকে BSc in Computer Science & Engineering অধ্যয়নরত। ওয়েব ডেভেলপমেন্ট, আর্টিফিশিয়াল ইন্টেলিজেন্স ও মেশিন লার্নিং-এ বিশেষ আগ্রহী। এই সিস্টেমটি তাঁর প্রিয় মাতৃ প্রতিষ্ঠানের প্রতি অবদান হিসেবে তৈরি করা হয়েছে।",
  bioEn: "A proud alumnus of Nabarun Public School (NPS), SSC batch of 2017. He is currently studying for a BSc in Computer Science & Engineering at Green University of Bangladesh, with a special interest in web development, artificial intelligence and machine learning. He built this system as a contribution to his beloved alma mater.",
  linkedin: "https://www.linkedin.com/in/md-hasibul-hasan-10749537a/",
  facebook: "https://www.facebook.com/mhhasan2347",
  github: "https://github.com/hasib61714",
  website: "https://hasib61714.github.io/hasibul-portfolio-v5/",
};

export default function About() {
  const { hash } = useLocation();
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const { about } = settings;
  usePageMeta(t("আমাদের সম্পর্কে", "About Us"), about.heroSubtitle);
  const values = [
    { icon: Target, title: t("আমাদের মিশন", "Our Mission"), desc: about.mission },
    { icon: Eye, title: t("আমাদের ভিশন", "Our Vision"), desc: about.vision },
    { icon: Heart, title: t("আমাদের মূল্যবোধ", "Our Values"), desc: about.values },
  ].filter((v) => v.desc.trim());
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  const devInitials = developer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const socialLinks = [
    { url: developer.linkedin, icon: Linkedin, label: "LinkedIn" },
    { url: developer.facebook, icon: Facebook, label: "Facebook" },
    { url: developer.github, icon: Github, label: "GitHub" },
    { url: developer.website, icon: Globe, label: "Website" },
  ].filter((s) => s.url);

  return (
    <div>
      <PageHero badge={t("আমাদের সম্পর্কে", "About Us")} title={about.heroTitle} subtitle={about.heroSubtitle} />

      <section className="py-20">
        <div className="container">
          <h2 className="sr-only">{t("আমাদের লক্ষ্য ও মূল্যবোধ", "Our mission and values")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-lift rounded-2xl border bg-card p-8 text-center shadow-card"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <v.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{v.title}</h3>
                <p className="text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="institutions" className="py-20 scroll-mt-20">
        <div className="container">
          <SectionHeading title={t("আমাদের প্রতিষ্ঠান", "Our Institutions")} subtitle={t("নবারুণ এডুকেশন ফ্যামিলির অধীনে তিনটি প্রতিষ্ঠান", "Three institutions under the Nabarun Education Family")} />
          <InstitutionCards />
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="container max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-bold">{about.systemTitle}</h2>
          <div className="space-y-4 text-muted-foreground">
            {paragraphs(about.systemText).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* Developer Credits */}
      {about.showDeveloper && (
      <section id="developer" className="scroll-mt-20 py-20">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-4">
                <Code className="h-4 w-4" /> {t("ডেভেলপার", "Developer")}
              </div>
              <h2 className="font-display text-3xl font-bold">{t("এই সাইটটি তৈরি করেছেন", "Built by")}</h2>
            </div>
            <Card className="shadow-elevated card-lift">
              <CardContent className="flex flex-col items-center text-center p-8">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  {developer.photo ? <AvatarImage src={developer.photo} alt={developer.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{devInitials}</AvatarFallback>
                </Avatar>
                <h3 className="font-display text-2xl font-bold mb-1">{developer.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{developer.role}</p>
                <p className="text-muted-foreground max-w-md mb-4">{t(developer.bio, developer.bioEn)}</p>
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-3">
                    {socialLinks.map((s) => (
                      <a
                        key={s.label}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title={s.label}
                      >
                        <s.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      )}
    </div>
  );
}
