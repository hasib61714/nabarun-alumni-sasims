import { usePageMeta } from "@/hooks/usePageMeta";
import PageHero from "@/components/site/PageHero";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { asciiDigits } from "@/lib/forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Heart, Target, HandCoins, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { formatTaka } from "@/lib/format";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number | null;
  is_active: boolean;
  created_at: string;
}

// Payment methods are stored in Bengali; the English map only changes the label shown.
const PAYMENT_METHODS = ["বিকাশ", "নগদ", "রকেট", "ব্যাংক ট্রান্সফার", "নগদ অর্থ"];
const PAYMENT_LABELS_EN: Record<string, string> = {
  "বিকাশ": "bKash",
  "নগদ": "Nagad",
  "রকেট": "Rocket",
  "ব্যাংক ট্রান্সফার": "Bank transfer",
  "নগদ অর্থ": "Cash",
};

export default function Donations() {
  const { t, lang } = useLang();
  usePageMeta(t("অনুদান", "Donations"), t("নবারুণ এডুকেশন ফ্যামিলির উন্নয়নে অবদান রাখুন।", "Support the growth of the Nabarun Education Family."));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [donationTotals, setDonationTotals] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    donor_name: "", donor_email: "", donor_phone: "",
    amount: "", purpose: "", payment_method: "বিকাশ", transaction_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: camps } = await supabase
      .from("donation_campaigns")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setCampaigns((camps as Campaign[]) || []);

    // Approved donation totals per campaign (aggregates only; donor details stay private)
    const { data: donations } = await supabase.rpc("get_donation_totals");
    const totals: Record<string, number> = {};
    (donations || []).forEach((d) => {
      const key = d.campaign_id || "general";
      totals[key] = (totals[key] || 0) + Number(d.total);
    });
    setDonationTotals(totals);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(asciiDigits(form.amount).trim());
    if (!form.donor_name || !amount || amount <= 0) {
      toast.error(t("নাম ও পরিমাণ অবশ্যই দিন", "Please enter your name and the amount"));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("donations").insert({
      donor_name: form.donor_name.trim(),
      donor_email: form.donor_email.trim() || null,
      donor_phone: form.donor_phone.trim() || null,
      amount,
      purpose: form.purpose.trim() || null,
      campaign_id: selectedCampaign || null,
      payment_method: form.payment_method,
      transaction_id: form.transaction_id.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
      toast.success(t("আপনার অনুদান জমা হয়েছে! অ্যাডমিন অনুমোদনের পর এটি যুক্ত হবে।", "Your donation has been submitted! It will be added once an admin approves it."));
    }
  };

  const totalDonated = Object.values(donationTotals).reduce((a, b) => a + b, 0);

  return (
    <>
    <PageHero badge={t("অনুদান", "Donate")} title={t("অনুদান", "Donations")} subtitle={t("নবারুণ এডুকেশন ফ্যামিলির উন্নয়নে আপনার অবদান রাখুন", "Contribute to the growth of the Nabarun Education Family")} />
    <div className="container py-12">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-display font-bold">{formatTaka(totalDonated, lang)}</p>
              <p className="text-xs text-muted-foreground">{t("মোট অনুদান", "Total donated")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-display font-bold">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">{t("সক্রিয় ক্যাম্পেইন", "Active campaigns")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card col-span-2 md:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("প্রতিটি অনুদান গুরুত্বপূর্ণ", "Every donation matters")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">{t("সক্রিয় ক্যাম্পেইন", "Active campaigns")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map((c, i) => {
              const raised = donationTotals[c.id] || 0;
              const progress = c.goal_amount ? Math.min((raised / c.goal_amount) * 100, 100) : 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="shadow-card hover:shadow-elevated transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{c.title}</h3>
                        <Badge variant="default">{t("সক্রিয়", "Active")}</Badge>
                      </div>
                      {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                      {c.goal_amount && (
                        <div className="space-y-2">
                          <Progress value={progress} className="h-2" aria-label={`${c.title} — ${t("অগ্রগতি", "Progress")}`} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t(`${formatTaka(raised, lang)} সংগৃহীত`, `${formatTaka(raised, lang)} raised`)}</span>
                            <span>{t("লক্ষ্য", "Goal")}: {formatTaka(c.goal_amount, lang)}</span>
                          </div>
                        </div>
                      )}
                      <Button size="sm" className="mt-3" onClick={() => setSelectedCampaign(c.id)}>
                        {t("এই ক্যাম্পেইনে দান করুন", "Donate to this campaign")}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donation Form */}
      <div className="max-w-lg mx-auto">
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">{t("অনুদান ফর্ম", "Donation Form")}</CardTitle>
            <CardDescription>{t("আপনার তথ্য ও অনুদানের পরিমাণ দিন", "Enter your details and the donation amount")}</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">{t("ধন্যবাদ!", "Thank you!")}</h3>
                <p className="text-muted-foreground">{t("আপনার অনুদান জমা হয়েছে। অ্যাডমিন অনুমোদনের পর এটি তালিকায় যুক্ত হবে।", "Your donation has been submitted. It will be listed once an admin approves it.")}</p>
                <Button className="mt-4" onClick={() => { setSubmitted(false); setForm({ donor_name: "", donor_email: "", donor_phone: "", amount: "", purpose: "", payment_method: "বিকাশ", transaction_id: "" }); }}>
                  {t("আরেকটি অনুদান দিন", "Make another donation")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedCampaign && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    {t("ক্যাম্পেইন", "Campaign")}: <strong>{campaigns.find((c) => c.id === selectedCampaign)?.title}</strong>
                    <button type="button" onClick={() => setSelectedCampaign("")} className="ml-2 text-xs text-primary hover:underline">{t("পরিবর্তন", "Change")}</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>{t("আপনার নাম *", "Your name *")}</Label>
                    <Input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} placeholder={t("পূর্ণ নাম", "Full name")} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ইমেইল", "Email")}</Label>
                    <Input type="email" value={form.donor_email} onChange={(e) => setForm({ ...form, donor_email: e.target.value })} placeholder="your@email.com" maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ফোন", "Phone")}</Label>
                    <Input value={form.donor_phone} onChange={(e) => setForm({ ...form, donor_phone: e.target.value })} placeholder="01XXXXXXXXX" maxLength={20} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("পরিমাণ (৳) *", "Amount (৳) *")}</Label>
                    <Input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("পেমেন্ট মাধ্যম", "Payment method")}</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger aria-label={t("পেমেন্ট মাধ্যম", "Payment method")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{t(m, PAYMENT_LABELS_EN[m] ?? m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ট্রানজেকশন আইডি", "Transaction ID")}</Label>
                  <Input value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} placeholder={t("পেমেন্টের ট্রানজেকশন আইডি", "Payment transaction ID")} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>{t("উদ্দেশ্য / মন্তব্য", "Purpose / note")}</Label>
                  <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder={t("কোন কাজে ব্যবহার হোক...", "How should it be used...")} rows={2} maxLength={500} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Heart className="mr-2 h-4 w-4" /> {submitting ? t("জমা হচ্ছে...", "Submitting...") : t("অনুদান জমা দিন", "Submit donation")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
