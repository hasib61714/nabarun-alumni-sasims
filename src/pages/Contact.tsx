import { Mail, Phone, MapPin, Send, Globe, Clock, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PageHero from "@/components/site/PageHero";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLang } from "@/lib/i18n";
import { isExternal, safeHref, telHref } from "@/lib/siteSettings";

export default function Contact() {
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const { general } = settings;
  usePageMeta(t("যোগাযোগ", "Contact"), t("প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করুন।", "Get in touch with us for questions, suggestions or collaboration."));
  const website = safeHref(general.website);
  const mapUrl = safeHref(general.mapUrl);
  const contactInfo = [
    general.email && { icon: Mail, label: t("ইমেইল", "Email"), value: general.email, href: `mailto:${general.email}` },
    general.phoneDisplay && { icon: Phone, label: t("ফোন", "Phone"), value: general.phoneDisplay, href: telHref(general.phone || general.phoneDisplay) },
    general.address && { icon: MapPin, label: t("ঠিকানা", "Address"), value: general.address, href: mapUrl || null },
    website && { icon: Globe, label: t("ওয়েবসাইট", "Website"), value: website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: website },
    general.workingHours && { icon: Clock, label: t("সময়সূচি", "Working hours"), value: general.workingHours, href: null },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string | null }[];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setLoading(false);
    if (error) {
      toast.error(t("বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "Could not send your message. Please try again."));
    } else {
      toast.success(t("বার্তা পাঠানো হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।", "Message sent! We will get back to you soon."));
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <div>
      <PageHero title={t("যোগাযোগ করুন", "Contact Us")} subtitle={t("প্রশ্ন আছে? আমরা আপনার কথা শুনতে চাই।", "Have a question? We would love to hear from you.")} />

      <section className="py-16">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              {contactInfo.map((c) => (
                <Card key={c.label} className="card-lift shadow-card">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} {...(isExternal(c.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline">
                          {c.value}{isExternal(c.href) && <ExternalLink className="h-3 w-3 shrink-0" />}
                        </a>
                      ) : (
                        <p className="font-medium text-sm">{c.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="md:col-span-3 shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-5">{t("বার্তা পাঠান", "Send a Message")}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input placeholder={t("আপনার নাম", "Your name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                    <Input placeholder={t("আপনার ইমেইল", "Your email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                  </div>
                  <Input placeholder={t("বিষয়", "Subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength={200} />
                  <Textarea placeholder={t("আপনার বার্তা...", "Your message...")} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} />
                  <Button type="submit" disabled={loading} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? t("পাঠানো হচ্ছে...", "Sending...") : t("বার্তা পাঠান", "Send Message")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
