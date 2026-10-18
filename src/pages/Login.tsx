import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Loader2, LogIn, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { explainAuthError, type AuthIssue } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LoginMode = "student" | "admin";

export default function Login() {
  const { t, lang } = useLang();
  usePageMeta(t("লগইন", "Log in"), t("নবারুণ অ্যালামনাই পোর্টালে লগইন করুন।", "Log in to the Nabarun alumni portal."));
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<{ issue: AuthIssue; message: string } | null>(null);
  const [resending, setResending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const isAdmin = mode === "admin";

  const switchMode = (next: LoginMode) => {
    setMode(next); setPassword(""); setProblem(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setResetLoading(false);
    if (error) { toast.error(explainAuthError(error, lang).message); return; }
    toast.success(t("ইমেইল সঠিক হলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।", "If the email is correct, a password reset link has been sent."));
    setForgotOpen(false);
  };

  const resendConfirmation = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setResending(false);
    if (error) toast.error(explainAuthError(error, lang).message);
    else toast.success(t("যাচাইয়ের ইমেইল আবার পাঠানো হয়েছে। স্প্যাম ফোল্ডারও দেখুন।", "Verification email sent again. Check your spam folder too."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setProblem(explainAuthError(error, lang));
      return;
    }
    const { data: roleData } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setLoading(false);
    if (isAdmin && !roleData) {
      await supabase.auth.signOut();
      setProblem({ issue: "other", message: t("আপনার অ্যাডমিন অ্যাক্সেস নেই। ছাত্র লগইন ব্যবহার করুন।", "You don’t have admin access. Use the student login.") });
      return;
    }
    toast.success(t("সফলভাবে লগইন হয়েছে", "Logged in successfully"));
    navigate("/dashboard");
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex gap-1.5 rounded-2xl bg-muted p-1.5" role="tablist" aria-label={t("লগইনের ধরন", "Login type")}>
        {([["student", t("ছাত্র লগইন", "Student login"), GraduationCap], ["admin", t("অ্যাডমিন লগইন", "Admin login"), ShieldCheck]] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              mode === value ? "bg-card text-primary shadow-md" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: isAdmin ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-2xl border bg-card shadow-elevated"
        >
          <div className="bg-gradient-to-r from-primary/10 to-transparent px-8 pb-5 pt-8 text-center">
            <div className={cn("mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl", isAdmin ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
              {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <GraduationCap className="h-7 w-7" />}
            </div>
            <h1 className="font-display text-2xl font-bold">{isAdmin ? t("অ্যাডমিন প্যানেল", "Admin panel") : t("স্বাগতম!", "Welcome!")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isAdmin ? t("শুধুমাত্র অনুমোদিত ব্যবস্থাপকদের জন্য", "For authorised administrators only") : t("আপনার অ্যালামনাই পোর্টালে প্রবেশ করুন", "Sign in to your alumni portal")}</p>
          </div>

          <div className="px-8 pb-8 pt-5">
            {problem && (
              <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:text-red-300">
                <p>{problem.message}</p>
                {problem.issue === "unconfirmed" && (
                  <Button type="button" variant="outline" size="sm" onClick={resendConfirmation} disabled={resending || !email} className="mt-2 gap-2">
                    {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />} {t("যাচাইয়ের ইমেইল আবার পাঠান", "Resend verification email")}
                  </Button>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("ইমেইল", "Email")}</Label>
                <Input id="email" type="email" autoComplete="username" placeholder={isAdmin ? "admin@example.com" : "your@email.com"} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("পাসওয়ার্ড", "Password")}</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? t("পাসওয়ার্ড লুকান", "Hide password") : t("পাসওয়ার্ড দেখান", "Show password")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {loading ? t("প্রবেশ করা হচ্ছে...", "Signing in...") : isAdmin ? t("অ্যাডমিন প্যানেলে প্রবেশ করুন", "Enter admin panel") : t("লগইন করুন", "Log in")}
              </Button>
            </form>

            <button type="button" onClick={() => { setResetEmail(email); setForgotOpen(true); }} className="mt-4 block w-full text-center text-xs text-primary hover:underline">
              {t("পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}
            </button>

            {!isAdmin ? (
              <p className="mt-4 border-t pt-4 text-center text-sm text-muted-foreground">
                {t("অ্যাকাউন্ট নেই?", "Don’t have an account?")} <Link to="/register" className="font-semibold text-primary hover:underline">{t("রেজিস্টার করুন", "Register")}</Link>
              </p>
            ) : (
              <p className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">{t("অ্যাডমিন অ্যাক্সেসের জন্য সিস্টেম পরিচালকের সাথে যোগাযোগ করুন", "Contact the system administrator for admin access")}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("পাসওয়ার্ড রিসেট", "Reset password")}</DialogTitle>
            <DialogDescription>{t("আপনার ইমেইল দিন, রিসেট লিংক পাঠানো হবে।", "Enter your email and we’ll send you a reset link.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("ইমেইল", "Email")}</Label>
              <Input id="reset-email" type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>{resetLoading ? t("পাঠানো হচ্ছে...", "Sending...") : t("রিসেট লিংক পাঠান", "Send reset link")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
