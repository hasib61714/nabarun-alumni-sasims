import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, GraduationCap, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import nabarunLogo from "@/assets/nabarun-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।");
      setForgotOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("সফলভাবে লগইন হয়েছে!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={nabarunLogo} alt="Nabarun" className="h-14 w-auto mx-auto" />
          </Link>
          <p className="text-sm text-muted-foreground mt-2">নবারুণ এডুকেশন ফ্যামিলি</p>
        </div>
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">স্বাগতম</CardTitle>
            <CardDescription>আপনার অ্যাকাউন্টে সাইন ইন করুন</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role indicators */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold">ছাত্র</p>
                  <p className="text-[10px] text-muted-foreground">প্রোফাইল ও তথ্য</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold">অ্যাডমিন</p>
                  <p className="text-[10px] text-muted-foreground">ব্যবস্থাপনা</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "সাইন ইন হচ্ছে..." : "সাইন ইন"}
              </Button>
            </form>
            <button type="button" onClick={() => setForgotOpen(true)} className="block w-full text-center text-xs text-primary hover:underline mt-3">
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              ছাত্র বা অ্যাডমিন — একই ফর্মে লগইন করুন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনাকে সঠিক ড্যাশবোর্ডে নিয়ে যাবে।
            </p>
            <p className="text-center text-sm text-muted-foreground mt-4">
              অ্যাকাউন্ট নেই?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">রেজিস্টার করুন</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>পাসওয়ার্ড রিসেট</DialogTitle>
            <DialogDescription>আপনার ইমেইল দিন, রিসেট লিংক পাঠানো হবে।</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">ইমেইল</Label>
              <Input id="reset-email" type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
