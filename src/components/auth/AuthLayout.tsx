import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, BookHeart, ShieldCheck, Users } from "lucide-react";
import nabarunLogo from "@/assets/nabarun-logo.png";
import ThemeToggle from "@/components/site/ThemeToggle";
import LanguageToggle from "@/components/site/LanguageToggle";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLang } from "@/lib/i18n";

const points = [
  { icon: BadgeCheck, bn: "প্রতিটি আবেদন অ্যাডমিন যাচাই করেন — ভুয়া অ্যাকাউন্টের সুযোগ নেই", en: "Every application is verified by an admin, so there are no fake accounts" },
  { icon: Users, bn: "সব ব্যাচের প্রাক্তন ছাত্রের সাথে এক জায়গায় যুক্ত হন", en: "Connect with alumni from every batch in one place" },
  { icon: BookHeart, bn: "নিজের স্মৃতি, ছবি ও ভিডিও সবার সাথে শেয়ার করুন", en: "Share your memories, photos and videos with everyone" },
  { icon: ShieldCheck, bn: "আপনার ব্যক্তিগত তথ্য শুধু অ্যাডমিন দেখতে পান", en: "Only admins can see your personal details" },
];

/** Two-column frame shared by the login, registration and password-reset pages. */
export default function AuthLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { settings } = useSiteSettings();
  const { t } = useLang();
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <aside className="relative hidden overflow-hidden bg-hero-gradient text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="orb animate-float -left-20 top-0 h-80 w-80 bg-cyan-300/30" aria-hidden />
        <div className="orb animate-float-slow -bottom-24 right-0 h-96 w-96 bg-teal-300/25" aria-hidden />
        <Link to="/" className="relative inline-flex items-center gap-3">
          <img src={nabarunLogo} alt="" className="h-14 w-auto drop-shadow-lg" />
          <span className="font-display text-xl font-bold">{settings.general.siteName}</span>
        </Link>
        <div className="relative">
          <h1 className="font-display text-4xl font-bold leading-tight">
            <span className="text-gradient-light">{settings.general.tagline}</span>
          </h1>
          <p className="mt-3 max-w-md text-white/75">{t("ছাত্রদের সংযোগ, ঐতিহ্যের সংরক্ষণ।", "Connecting students, preserving our heritage.")}</p>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p.bn} className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur"><p.icon className="h-4 w-4" /></span>
                {t(p.bn, p.en)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} {settings.footer.copyright}</p>
      </aside>

      <main className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {t("হোম পেজ", "Home")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className={wide ? "w-full max-w-xl" : "w-full max-w-md"}>
            <Link to="/" className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
              <img src={nabarunLogo} alt={settings.general.siteName} className="h-12 w-auto" />
            </Link>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
