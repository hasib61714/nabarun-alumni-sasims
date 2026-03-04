import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number | null;
  is_active: boolean;
  created_at: string;
}

const PAYMENT_METHODS = ["বিকাশ", "নগদ", "রকেট", "ব্যাংক ট্রান্সফার", "নগদ অর্থ"];

export default function Donations() {
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

    // Get approved donation totals per campaign
    const { data: donations } = await supabase
      .from("donations")
      .select("campaign_id, amount")
      .eq("status", "approved");
    const totals: Record<string, number> = {};
    (donations || []).forEach((d: { campaign_id: string | null; amount: number }) => {
      const key = d.campaign_id || "general";
      totals[key] = (totals[key] || 0) + Number(d.amount);
    });
    setDonationTotals(totals);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donor_name || !form.amount || Number(form.amount) <= 0) {
      toast.error("নাম ও পরিমাণ অবশ্যই দিন");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("donations").insert({
      donor_name: form.donor_name.trim(),
      donor_email: form.donor_email.trim() || null,
      donor_phone: form.donor_phone.trim() || null,
      amount: Number(form.amount),
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
      toast.success("আপনার অনুদান জমা হয়েছে! অ্যাডমিন অনুমোদনের পর এটি যুক্ত হবে।");
    }
  };

  const totalDonated = Object.values(donationTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">💝 অনুদান</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          নবারুণ এডুকেশন ফ্যামিলির উন্নয়নে আপনার অবদান রাখুন
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-display font-bold">৳{totalDonated.toLocaleString("bn-BD")}</p>
              <p className="text-xs text-muted-foreground">মোট অনুদান</p>
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
              <p className="text-xs text-muted-foreground">সক্রিয় ক্যাম্পেইন</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card col-span-2 md:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">প্রতিটি অনুদান গুরুত্বপূর্ণ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">সক্রিয় ক্যাম্পেইন</h2>
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
                        <Badge variant="default">সক্রিয়</Badge>
                      </div>
                      {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                      {c.goal_amount && (
                        <div className="space-y-2">
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>৳{raised.toLocaleString("bn-BD")} সংগৃহীত</span>
                            <span>লক্ষ্য: ৳{c.goal_amount.toLocaleString("bn-BD")}</span>
                          </div>
                        </div>
                      )}
                      <Button size="sm" className="mt-3" onClick={() => setSelectedCampaign(c.id)}>
                        এই ক্যাম্পেইনে দান করুন
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
            <CardTitle className="font-display text-xl">অনুদান ফর্ম</CardTitle>
            <CardDescription>আপনার তথ্য ও অনুদানের পরিমাণ দিন</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">ধন্যবাদ!</h3>
                <p className="text-muted-foreground">আপনার অনুদান জমা হয়েছে। অ্যাডমিন অনুমোদনের পর এটি তালিকায় যুক্ত হবে।</p>
                <Button className="mt-4" onClick={() => { setSubmitted(false); setForm({ donor_name: "", donor_email: "", donor_phone: "", amount: "", purpose: "", payment_method: "বিকাশ", transaction_id: "" }); }}>
                  আরেকটি অনুদান দিন
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedCampaign && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    ক্যাম্পেইন: <strong>{campaigns.find((c) => c.id === selectedCampaign)?.title}</strong>
                    <button type="button" onClick={() => setSelectedCampaign("")} className="ml-2 text-xs text-primary hover:underline">পরিবর্তন</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>আপনার নাম *</Label>
                    <Input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} placeholder="পূর্ণ নাম" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>ইমেইল</Label>
                    <Input type="email" value={form.donor_email} onChange={(e) => setForm({ ...form, donor_email: e.target.value })} placeholder="your@email.com" maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label>ফোন</Label>
                    <Input value={form.donor_phone} onChange={(e) => setForm({ ...form, donor_phone: e.target.value })} placeholder="01XXXXXXXXX" maxLength={20} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>পরিমাণ (৳) *</Label>
                    <Input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" required />
                  </div>
                  <div className="space-y-2">
                    <Label>পেমেন্ট মাধ্যম</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ট্রানজেকশন আইডি</Label>
                  <Input value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} placeholder="পেমেন্টের ট্রানজেকশন আইডি" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>উদ্দেশ্য / মন্তব্য</Label>
                  <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="কোন কাজে ব্যবহার হোক..." rows={2} maxLength={500} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Heart className="mr-2 h-4 w-4" /> {submitting ? "জমা হচ্ছে..." : "অনুদান জমা দিন"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
