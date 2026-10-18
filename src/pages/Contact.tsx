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
import { isExternal, safeHref, telHref } from "@/lib/siteSettings";

export default function Contact() {
  const { settings } = useSiteSettings();
  const { general } = settings;
  usePageMeta("যোগাযোগ", "প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করুন।");
  const website = safeHref(general.website);
  const mapUrl = safeHref(general.mapUrl);
  const contactInfo = [
    general.email && { icon: Mail, label: "ইমেইল", value: general.email, href: `mailto:${general.email}` },
    general.phoneDisplay && { icon: Phone, label: "ফোন", value: general.phoneDisplay, href: telHref(general.phone || general.phoneDisplay) },
    general.address && { icon: MapPin, label: "ঠিকানা", value: general.address, href: mapUrl || null },
    website && { icon: Globe, label: "ওয়েবসাইট", value: website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: website },
    general.workingHours && { icon: Clock, label: "সময়সূচি", value: general.workingHours, href: null },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string | null }[];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setLoading(false);
    if (error) {
      toast.error("বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } else {
      toast.success("বার্তা পাঠানো হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।");
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <div>
      <PageHero title="যোগাযোগ করুন" subtitle="প্রশ্ন আছে? আমরা আপনার কথা শুনতে চাই।" />

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
                <h2 className="font-display text-xl font-bold mb-5">বার্তা পাঠান</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input placeholder="আপনার নাম" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                    <Input placeholder="আপনার ইমেইল" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                  </div>
                  <Input placeholder="বিষয়" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength={200} />
                  <Textarea placeholder="আপনার বার্তা..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} />
                  <Button type="submit" disabled={loading} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
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
