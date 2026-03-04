import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const contactInfo = [
  { icon: Mail, label: "ইমেইল", value: "info.nabarun@gmail.com", href: "mailto:info.nabarun@gmail.com" },
  { icon: Phone, label: "ফোন", value: "+৮৮০ ১৭৪১ ৯১৯৪৬২", href: "tel:+8801741919462" },
  { icon: MapPin, label: "ঠিকানা", value: "নবারুণ এডুকেশন ফ্যামিলি, বাংলাদেশ", href: null },
  { icon: Globe, label: "ওয়েবসাইট", value: "www.nabarun.com.bd", href: "https://www.nabarun.com.bd" },
];

export default function Contact() {
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
      <section className="bg-hero-gradient py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">যোগাযোগ করুন</h1>
            <p className="text-primary-foreground/80 text-lg">প্রশ্ন আছে? আমরা আপনার কথা শুনতে চাই।</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              {contactInfo.map((c) => (
                <Card key={c.label} className="shadow-card">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="font-medium text-sm text-primary hover:underline">
                          {c.value}
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
                    <Input placeholder="আপনার নাম" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input placeholder="আপনার ইমেইল" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Input placeholder="বিষয়" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                  <Textarea placeholder="আপনার বার্তা..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
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
