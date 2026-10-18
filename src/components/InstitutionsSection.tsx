import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { useInstitutions } from "@/hooks/useSiteSettings";
import { useLang } from "@/lib/i18n";
import { safeHref, telHref } from "@/lib/siteSettings";

export function InstitutionCards() {
  const institutions = useInstitutions();
  const { t } = useLang();
  return (
    <div className={`grid gap-6 ${institutions.length >= 3 ? "md:grid-cols-3" : institutions.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-md"}`}>
      {institutions.map((inst, i) => {
        const map = safeHref(inst.mapUrl);
        return (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card-lift flex flex-col rounded-2xl border bg-card p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-5 flex h-32 w-full items-center justify-center rounded-xl border bg-white p-3">
              <img src={inst.logo} alt={t(`${inst.title} এর লোগো`, `${inst.title} logo`)} className="max-h-full w-auto object-contain" loading="lazy" />
            </div>
            <h3 className="font-display text-lg font-semibold">{inst.title}</h3>
            <p className="text-sm text-muted-foreground">{inst.subtitle}</p>
            {inst.established && (
              <span className="mx-auto mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">{t("স্থাপিত", "Est.")} {inst.established}</span>
            )}
            {inst.desc && <p className="mt-3 text-sm text-muted-foreground">{inst.desc}</p>}
            <div className="mt-4 space-y-2 text-sm">
              {inst.address && (
                <p className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /> {inst.address}</p>
              )}
              {inst.phoneDisplay && (
                <a href={telHref(inst.phone || inst.phoneDisplay)} className="flex items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Phone className="h-4 w-4 shrink-0" /> {inst.phoneDisplay}
                </a>
              )}
              {inst.email && (
                <a href={`mailto:${inst.email}`} className="flex items-center justify-center gap-2 break-all text-muted-foreground transition-colors hover:text-primary">
                  <Mail className="h-4 w-4 shrink-0" /> {inst.email}
                </a>
              )}
              {map && (
                <a href={map} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-primary hover:underline">
                  <MapPin className="h-4 w-4 shrink-0" /> Google Maps
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
