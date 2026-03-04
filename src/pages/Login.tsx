import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, GraduationCap, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import nabarunLogo from "@/assets/nabarun-logo.png";

type LoginMode = "student" | "admin";

export default function Login() {
  const [mode, setMode] = useState<LoginMode>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const isAdmin = mode === "admin";

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success("পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!"); setForgotOpen(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে");
      return;
    }
    // Verify role matches selected mode
    const { data: roleData } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    setLoading(false);
    const userIsAdmin = Boolean(roleData);
    if (isAdmin && !userIsAdmin) {
      await supabase.auth.signOut();
      toast.error("আপনার অ্যাডমিন অ্যাক্সেস নেই। ছাত্র লগইন ব্যবহার করুন।");
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে! ✓");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-muted/60 via-background to-muted/30">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={nabarunLogo} alt="Nabarun" className="h-16 w-auto mx-auto drop-shadow-md" />
          </Link>
          <p className="text-sm text-muted-foreground mt-2 font-medium">নবারুণ এডুকেশন ফ্যামিলি</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-2xl bg-muted p-1.5 mb-6 gap-1.5">
          <button
            onClick={() => { setMode("student"); setEmail(""); setPassword(""); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
              !isAdmin ? "bg-white shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            ছাত্র লগইন
          </button>
          <button
            onClick={() => { setMode("admin"); setEmail(""); setPassword(""); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
              isAdmin ? "bg-primary shadow-md text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            অ্যাডমিন লগইন
          </button>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: isAdmin ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isAdmin ? -30 : 30 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl shadow-elevated overflow-hidden border ${
              isAdmin ? "border-primary/30 bg-gradient-to-b from-primary/5 to-background" : "border-border bg-background"
            }`}
          >
            {/* Card Header */}
            <div className={`px-8 pt-8 pb-6 text-center ${
              isAdmin ? "bg-gradient-to-r from-primary/10 to-primary/5" : "bg-gradient-to-r from-muted/60 to-muted/30"
            }`}>
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-3 ${
                isAdmin ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <GraduationCap className="h-7 w-7" />}
              </div>
              <h2 className="font-display text-2xl font-bold">
                {isAdmin ? "অ্যাডমিন প্যানেল" : "স্বাগতম!"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin ? "শুধুমাত্র অনুমোদিত ব্যবস্থাপকদের জন্য" : "আপনার অ্যালামনাই পোর্টালে প্রবেশ করুন"}
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8 pt-6">
              {isAdmin && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5 text-amber-800 text-xs">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  শুধুমাত্র অনুমোদিত অ্যাডমিনরাই এখানে প্রবেশ করতে পারবেন
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={isAdmin ? "admin@example.com" : "your@email.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full h-11 text-sm font-semibold ${
                    isAdmin ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  disabled={loading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? "প্রবেশ করা হচ্ছে..." : isAdmin ? "অ্যাডমিন প্যানেলে প্রবেশ করুন" : "লগইন করুন"}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="block w-full text-center text-xs text-primary hover:underline mt-4"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>

              {!isAdmin && (
                <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                  অ্যাকাউন্ট নেই?{" "}
                  <Link to="/register" className="text-primary font-semibold hover:underline">রেজিস্টার করুন</Link>
                </p>
              )}
              {isAdmin && (
                <p className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t">
                  অ্যাডমিন অ্যাক্সেসের জন্য সিস্টেম পরিচালকের সাথে যোগাযোগ করুন
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary transition-colors">← হোম পেজে ফিরে যান</Link>
        </p>
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
