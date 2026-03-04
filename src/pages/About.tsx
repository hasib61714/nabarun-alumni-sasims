import { motion } from "framer-motion";
import { Target, Eye, Heart, Code, Linkedin, Facebook, Github, Globe } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import nabarunLogo from "@/assets/nabarun-logo.png";
import developerPhoto from "@/assets/developer-photo.png";

const values = [
  { icon: Target, title: "আমাদের মিশন", desc: "আমাদের প্রতিষ্ঠানের প্রতিটি ছাত্রের যাত্রাপথকে ডিজিটালভাবে সংরক্ষণ ও উদযাপন করা।" },
  { icon: Eye, title: "আমাদের ভিশন", desc: "সবচেয়ে সংযুক্ত ও সহায়ক প্রাক্তন ছাত্র নেটওয়ার্ক তৈরি যা বর্তমান ও ভবিষ্যৎ ছাত্রদের ক্ষমতায়ন করে।" },
  { icon: Heart, title: "আমাদের মূল্যবোধ", desc: "শ্রেষ্ঠত্ব, সততা, সম্প্রদায় এবং আজীবন শিক্ষা আমাদের সবকিছুর পথপ্রদর্শক।" },
];

const developer = {
  name: "Md. Hasibul Hasan",
  photo: developerPhoto,
  bio: "নবারুণ পাবলিক স্কুল (NPS), SSC ২০১৭ ব্যাচের ছাত্র। এই সাইটটি ডিজাইন ও ডেভেলপ করেছেন। ওয়েব ডেভেলপমেন্ট ও আধুনিক প্রযুক্তিতে দক্ষ।",
  linkedin: "https://www.linkedin.com/in/md-hasibul-hasan-software-engineer97",
  facebook: "https://www.facebook.com/mhhasan2347",
  github: "https://github.com/hasib61714",
  website: "https://hasib61714.github.io/hasibul-portfolio-v5/",
};

export default function About() {
  const devInitials = developer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const socialLinks = [
    { url: developer.linkedin, icon: Linkedin, label: "LinkedIn" },
    { url: developer.facebook, icon: Facebook, label: "Facebook" },
    { url: developer.github, icon: Github, label: "GitHub" },
    { url: developer.website, icon: Globe, label: "Website" },
  ].filter((s) => s.url);

  return (
    <div>
      <section className="bg-hero-gradient py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img src={nabarunLogo} alt="Nabarun" className="h-12 w-auto drop-shadow-lg" />
              <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/90">
                আমাদের সম্পর্কে
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">নবারুণ এডুকেশন ফ্যামিলি</h1>
            <p className="text-primary-foreground/80 text-lg">দশকের শিক্ষায় শ্রেষ্ঠত্ব, হাজার হাজার সফল প্রাক্তন ছাত্র, এবং আগামীর নেতা তৈরির প্রতিশ্রুতি।</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-8 shadow-card text-center"
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

      <section className="py-20 bg-muted/50">
        <div className="container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-8">সিস্টেম সম্পর্কে</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>নবারুণ এডুকেশন ফ্যামিলির অধীনে <strong>নবারুণ পাবলিক স্কুল</strong>, <strong>বিপ্লব লোপা মেমোরিয়াল গার্লস স্কুল</strong>, এবং <strong>নবারুণ কোচিং সেন্টার</strong> অন্তর্ভুক্ত।</p>
            <p>এই স্মার্ট অ্যালামনাই ও স্টুডেন্ট ইনফরমেশন ম্যানেজমেন্ট সিস্টেম (SASIMS) হলো একটি সম্পূর্ণ ডিজিটাল প্ল্যাটফর্ম যা অতীত ও বর্তমান ছাত্রদের মধ্যে সেতুবন্ধন তৈরি করতে ডিজাইন করা হয়েছে।</p>
            <p>আমাদের সিস্টেম ছাত্রদের তাদের একাডেমিক রেকর্ড সংরক্ষণ, পেশাদার যাত্রা আপডেট এবং মাতৃ প্রতিষ্ঠানের সাথে সংযুক্ত থাকতে সহায়তা করে। প্রশাসকরা কার্যকরভাবে ছাত্রদের তথ্য পরিচালনা, রিপোর্ট তৈরি এবং প্রাক্তন ছাত্রদের সাফল্যের গল্প ট্র্যাক করতে পারেন।</p>
          </div>
        </div>
      </section>

      {/* Developer Credits */}
      <section className="py-20">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-4">
                <Code className="h-4 w-4" /> ডেভেলপার
              </div>
              <h2 className="font-display text-3xl font-bold">এই সাইটটি তৈরি করেছেন</h2>
            </div>
            <Card className="shadow-elevated">
              <CardContent className="flex flex-col items-center text-center p-8">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  {developer.photo ? <AvatarImage src={developer.photo} alt={developer.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{devInitials}</AvatarFallback>
                </Avatar>
                <h3 className="font-display text-2xl font-bold mb-2">{developer.name}</h3>
                <p className="text-muted-foreground max-w-md mb-4">{developer.bio}</p>
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
    </div>
  );
}
