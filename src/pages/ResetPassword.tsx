import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordFields } from "@/components/common/PasswordChange";
import { usePasswordChange } from "@/hooks/usePasswordChange";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLang } from "@/lib/i18n";

export default function ResetPassword() {
  const { t, lang } = useLang();
  usePageMeta(t("নতুন পাসওয়ার্ড", "New password"), t("নতুন পাসওয়ার্ড সেট করুন।", "Set a new password."));
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { form, submit, saving } = usePasswordChange(() => navigate("/dashboard"), lang);

  useEffect(() => {
    // The recovery link signs the visitor in; the event may already have fired before this
    // page mounted, so also look at the current session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthLayout>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-8 pb-5 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold">{t("নতুন পাসওয়ার্ড সেট করুন", "Set a new password")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("আপনার নতুন পাসওয়ার্ড দিন", "Enter your new password")}</p>
        </div>
        <div className="px-8 pb-8 pt-5">
          {!ready ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <p>{t("রিকভারি লিংক যাচাই হচ্ছে... যদি সরাসরি এই পেজে এসে থাকেন, ইমেইলে পাঠানো লিংকে ক্লিক করুন।", "Verifying your recovery link... If you came to this page directly, click the link we emailed you.")}</p>
              <Button asChild variant="outline" className="mt-4"><Link to="/login">{t("লগইন পেজে ফিরে যান", "Back to login")}</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <PasswordFields form={form} lang={lang} />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {saving ? t("আপডেট হচ্ছে...", "Updating...") : t("পাসওয়ার্ড আপডেট করুন", "Update password")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
