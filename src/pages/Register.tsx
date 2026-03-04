import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, GraduationCap, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import nabarunLogo from "@/assets/nabarun-logo.png";

const currentYear = new Date().getFullYear();
const batchYears = Array.from({ length: 20 }, (_, i) => currentYear - i);

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    if (password !== confirmPassword) { toast.error("পাসওয়ার্ড মিলছে না"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, batch_year: batchYear ? parseInt(batchYear) : null },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { setDone(true); }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-muted/60 via-background to-muted/30">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-5">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">রেজিস্ট্রেশন সফল!</h2>
          <p className="text-muted-foreground mb-6">আপনার ইমেইলে একটি যাচাই লিংক পাঠানো হয়েছে। ইমেইল যাচাই করার পর লগইন করুন।</p>
          <Link to="/login">
            <Button className="w-full">লগইন পেজে যান</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-muted/60 via-background to-muted/30">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={nabarunLogo} alt="Nabarun" className="h-16 w-auto mx-auto drop-shadow-md" />
          </Link>
          <p className="text-sm text-muted-foreground mt-2 font-medium">নবারুণ এডুকেশন ফ্যামিলি</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl shadow-elevated border border-border bg-background overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-r from-muted/60 to-muted/30">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold">ছাত্র রেজিস্ট্রেশন</h2>
            <p className="text-sm text-muted-foreground mt-1">নবারুণ অ্যালামনাই পোর্টালে যোগ দিন</p>
          </div>

          {/* Notice */}
          <div className="mx-8 mt-5 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-primary text-xs">
            <GraduationCap className="h-4 w-4 shrink-0 mt-0.5" />
            <span>এই রেজিস্ট্রেশন শুধুমাত্র <strong>প্রাক্তন ও বর্তমান ছাত্রদের</strong> জন্য। অ্যাডমিন অ্যাক্সেসের জন্য পরিচালকের সাথে যোগাযোগ করুন।</span>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">পূর্ণ নাম *</Label>
                <Input id="name" placeholder="আপনার পূর্ণ নাম লিখুন" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch">SSC / পাসের ব্যাচ বছর</Label>
                <Select value={batchYear} onValueChange={setBatchYear}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="ব্যাচ বছর নির্বাচন করুন (ঐচ্ছিক)" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">ইমেইল *</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">পাসওয়ার্ড *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">পাসওয়ার্ড নিশ্চিত করুন *</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 ${
                    confirmPassword && confirmPassword !== password ? "border-destructive" : ""
                  }`}
                  required
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive">পাসওয়ার্ড মিলছে না</p>
                )}
              </div>
              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "রেজিস্টার করুন"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">লগইন করুন</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary transition-colors">← হোম পেজে ফিরে যান</Link>
        </p>
      </motion.div>
    </div>
  );
}


export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("রেজিস্ট্রেশন সফল! দয়া করে আপনার ইমেইল যাচাই করুন।");
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
            <CardTitle className="font-display text-2xl">অ্যাকাউন্ট তৈরি করুন</CardTitle>
            <CardDescription>ছাত্র হিসেবে রেজিস্টার করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">পূর্ণ নাম</Label>
                <Input id="name" placeholder="আপনার পূর্ণ নাম" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input id="password" type="password" placeholder="কমপক্ষে ৬ অক্ষর" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "রেজিস্টার"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">সাইন ইন করুন</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
