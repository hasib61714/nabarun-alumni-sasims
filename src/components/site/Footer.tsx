import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Clock, Facebook, Globe, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter, Youtube, type LucideIcon } from "lucide-react";
import nabarunLogo from "@/assets/nabarun-logo.png";
import { useInstitutions, useSiteSettings } from "@/hooks/useSiteSettings";
import { applyNavSettings, isGroup, type NavLinkDef } from "@/lib/navigation";
import { isExternal, safeHref, telHref } from "@/lib/siteSettings";

const socials: { key: keyof ReturnType<typeof useSiteSettings>["settings"]["social"]; label: string; icon: LucideIcon }[] = [
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "X (Twitter)", icon: Twitter },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export default function Footer() {
  const { settings } = useSiteSettings();
  const institutions = useInstitutions();
  const { general, footer } = settings;
  const links = useMemo<NavLinkDef[]>(
    () => applyNavSettings(settings.nav).flatMap((e) => (isGroup(e) ? e.items : [e])),
    [settings.nav],
  );
  const socialLinks = socials.map((s) => ({ ...s, href: safeHref(settings.social[s.key]) })).filter((s) => s.href);
  const website = safeHref(general.website);
  const mapUrl = safeHref(general.mapUrl);

  return (
    <footer className="relative mt-auto overflow-hidden border-t bg-card">
      <div className="hairline absolute inset-x-0 top-0" aria-hidden />
      <div className="orb -right-24 -top-24 h-64 w-64 bg-primary/20" aria-hidden />
      <div className="container relative py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="mb-4 inline-flex items-center gap-2.5">
              <img src={nabarunLogo} alt="" className="h-11 w-auto" />
              <span className="font-display text-lg font-bold text-primary">{general.siteNameEn || general.siteName}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{footer.about}</p>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <s.icon className="h-[1.1rem] w-[1.1rem]" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav className="lg:col-span-3" aria-label="দ্রুত লিংক">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">দ্রুত লিংক</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-1 lg:grid-cols-2">
              {links.map((l) => (
                <li key={l.id}>
                  <Link to={l.path} className="text-sm text-muted-foreground transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">আমাদের প্রতিষ্ঠান</h2>
            <ul className="space-y-2.5">
              {institutions.map((i) => (
                <li key={i.id}>
                  <Link to="/about#institutions" className="text-sm text-muted-foreground transition-colors hover:text-primary">{i.nameBn}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">যোগাযোগ</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {general.address && (
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{general.address}</a> : <span>{general.address}</span>}
                </li>
              )}
              {general.phoneDisplay && (
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={telHref(general.phone || general.phoneDisplay)} className="hover:text-primary">{general.phoneDisplay}</a>
                </li>
              )}
              {general.email && (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={`mailto:${general.email}`} className="break-all hover:text-primary">{general.email}</a>
                </li>
              )}
              {website && (
                <li className="flex gap-2.5">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={website} {...(isExternal(website) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="break-all hover:text-primary">
                    {website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                  </a>
                </li>
              )}
              {general.workingHours && (
                <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{general.workingHours}</span></li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} {footer.copyright}</p>
            {footer.showDeveloperCredit && (
              <p className="mt-1 text-xs">Developed with ❤️ by <Link to="/about#developer" className="font-medium hover:text-primary">Md. Hasibul Hasan</Link></p>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowUp className="h-3.5 w-3.5" /> উপরে যান
          </button>
        </div>
      </div>
    </footer>
  );
}
